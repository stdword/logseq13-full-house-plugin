import '@logseq/libs'
import { BlockEntity, IBatchBlock, ILSPluginUser } from '@logseq/libs/dist/LSPlugin'

import { filterOutChildBlocks, getBlocksWithReferences, getChosenBlocks, getEditingCursorSelection, IBlockNode, insertBatchBlockBefore, mapBlockTree, PropertiesUtils, setEditingCursorSelection, walkBlockTree, walkBlockTreeAsync } from './logseq'
import { sleep, unique } from './other'
import { objectEquals } from './parsing'
import { blocks_skip } from '../tags'
import { ILogseqContext } from '@src/context'


function initAction(context: ILogseqContext, skipTree: boolean) {
    if (skipTree) {
        // every action means non-standard way of rendering (skipping rendered tree content)
        blocks_skip(context, {self: true, children: true})
    }
}

export async function updateBlocksAction(
    context: ILogseqContext,
    callback: (
        contentWithoutProperties: string,
        properties: Record<string, any>,
        level: number,
        block: BlockEntity,
        data: Record<string, any>
    ) => [string, Record<string, any>] | string | void,
    opts?: {
        skipTree?: boolean,
        blocks?: BlockEntity[] | string[],
        recursive?: boolean,
        useMinimalUndoActions?: boolean,
    }
) {
    initAction(context, opts?.skipTree ?? true)

    const recursive = opts?.recursive ?? false
    const useMinimalUndoActions = opts?.useMinimalUndoActions ?? true

    const blocks_ = opts?.blocks ?? (await getChosenBlocks())[0]
    if (blocks_ && blocks_.length === 0)
        return

    let blocks: BlockEntity[]
    if (typeof blocks_[0] === 'string')
        blocks = (await Promise.all(
            unique(blocks_ as string[])
                .map(async (uuid) => {
                    return await logseq.Editor.getBlock(uuid)
                })
        )).filter((b) => b !== null)
    else
        blocks = blocks_ as BlockEntity[]

    if (recursive) {
        blocks = await Promise.all(
            blocks.map(async (b) => {
                return (
                    await logseq.Editor.getBlock(b.uuid, {includeChildren: true})
                )!
            })
        )
        blocks = filterOutChildBlocks(blocks)
    }

    // it is important to check if any block in the tree has references
    // (Logseq replaces references with it's text)
    if (recursive)
        for (const block of blocks) {
            const blocksWithReferences = await getBlocksWithReferences(block)
            block._treeHasReferences = blocksWithReferences.length !== 0
        }

    for (const block of blocks) {
        // ensure .children is always an array
        if (!block.children)
            block.children = []

        // skip child nodes in non-recursive mode
        if (!recursive)
            block.children = []

        const newTree = await mapBlockTree(block as IBlockNode, async (b, level, data) => {
            data.node = b as BlockEntity

            let properties = PropertiesUtils.fromCamelCaseAll(b.properties)
            const propertiesOrder = PropertiesUtils.getPropertyNames(b.content ?? '')

            let content = PropertiesUtils.deleteAllProperties(b.content ?? '')
            const newItem = await callback(content, properties, level, b as BlockEntity, data)
            if (newItem === undefined)
                return b.content

            let newContent: string
            let newProperties: typeof properties
            if (Array.isArray(newItem))
                [ newContent, newProperties ] = newItem
            else
                [ newContent, newProperties ] = [ newItem, {} ]

            if (content === newContent && objectEquals(properties, newProperties))
                data.leftIntact = true

            for (const property of propertiesOrder)
                newContent += `\n${property}:: ${newProperties[property]}`

            return newContent
        })

        if (!useMinimalUndoActions || block._treeHasReferences || block.children.length === 0) {
            walkBlockTreeAsync(newTree, async (b, level, path) => {
                // @ts-expect-error
                const block = b.data!.node as BlockEntity

                // @ts-expect-error
                if (!b.data!.leftIntact)
                    if (b.content !== undefined)
                        await logseq.Editor.updateBlock(block.uuid, b.content)
            })
        } else {
            await insertBatchBlockBefore(block, newTree as IBatchBlock)
            await logseq.Editor.removeBlock(block.uuid)
        }
    }
}

export async function transformBlocksAction(
    callback: (blocks: BlockEntity[]) => BlockEntity[],
    blocks: BlockEntity[],
    isSelectedState: boolean,
) {
    // if all blocks relates to one root block
    if (blocks.length === 1) {
        const tree = await ensureChildrenIncluded(blocks[0])
        if (!tree.children || tree.children.length === 0)
            return  // nothing to transform

        const newRoot = await transformBlocksTreeByReplacing(tree, callback)
        if (newRoot) {  // successfully replaced
            if (isSelectedState)
                await logseq.Editor.selectBlock(newRoot.uuid)
            else
                await logseq.Editor.editBlock(newRoot.uuid)

            return
        }

        // fallback to array of blocks
        blocks = tree.children as BlockEntity[]
    }


    // if all blocks from different parents
    transformSelectedBlocksWithMovements(blocks, callback)
}

async function transformBlocksTreeByReplacing(
    root: BlockEntity,
    transformChildrenCallback: (blocks: BlockEntity[]) => BlockEntity[],
): Promise<BlockEntity | null> {
    root = await ensureChildrenIncluded(root)
    if (!root || !root.children || root.children.length === 0)
        return null  // nothing to replace

    // METHOD: blocks removal to replace whole tree
    // but it is important to check if any block in the tree has references
    // (Logseq replaces references with it's text)
    const blocksWithReferences = await getBlocksWithReferences(root)
    if (blocksWithReferences.length !== 0)
        return null  // blocks removal cannot be used

    const transformedBlocks = transformChildrenCallback(root.children as BlockEntity[])
    walkBlockTree({content: '', children: transformedBlocks as IBatchBlock[]}, (b, level) => {
        b.properties = PropertiesUtils.fromCamelCaseAll(b.properties ?? {})
    })

    // root is the first block in page
    if (root.left.id === root.page.id) {
        const page = await logseq.Editor.getPage(root.page.id)
        await logseq.Editor.removeBlock(root.uuid)

        // logseq bug: cannot use sibling next to root to insert whole tree to a page
        //  so insert root of a tree separately from children
        const properties = PropertiesUtils.fromCamelCaseAll(root.properties)
        let prepended = await logseq.Editor.insertBlock(
            page!.uuid, root.content,
            {properties, before: true, customUUID: root.uuid},
        )
        if (!prepended) {
            // logseq bug: for empty pages need to change `before: true → false`
            prepended = (await logseq.Editor.insertBlock(
                page!.uuid, root.content,
                {properties, before: false, customUUID: root.uuid},
            ))!
        }

        await logseq.Editor.insertBatchBlock(
            prepended.uuid, transformedBlocks as IBatchBlock[],
            {before: false, sibling: false, keepUUID: true},
        )
        return prepended
    }

    // use root to insert whole tree at once
    const oldChildren = root.children
    root.children = transformedBlocks

    // root is the first child for its parent
    if (root.left.id === root.parent.id) {
        let parentRoot = (await logseq.Editor.getBlock(root.parent.id))!
        await logseq.Editor.removeBlock(root.uuid)
        await logseq.Editor.insertBatchBlock(
            parentRoot.uuid, root as IBatchBlock,
            {before: true, sibling: false, keepUUID: true},
        )

        // restore original object
        root.children = oldChildren

        parentRoot = (await logseq.Editor.getBlock(parentRoot.uuid, {includeChildren: true}))!
        return parentRoot.children![0] as BlockEntity
    }

    // root is not first child of parent and is not first block on page: it has sibling
    const preRoot = (await logseq.Editor.getPreviousSiblingBlock(root.uuid))!
    await logseq.Editor.removeBlock(root.uuid)
    await logseq.Editor.insertBatchBlock(
        preRoot.uuid, root as IBatchBlock,
        {before: false, sibling: true, keepUUID: true},
    )

    // restore original object
    root.children = oldChildren

    return (await logseq.Editor.getNextSiblingBlock(preRoot.uuid))!
}

async function transformSelectedBlocksWithMovements(
    blocks: BlockEntity[],
    transformCallback: (blocks: BlockEntity[]) => BlockEntity[],
) {
    // METHOD: blocks movement

    // Logseq sorts selected blocks, so the first is the most upper one
    let insertionPoint = blocks[0]

    // Logseq bug: selected blocks can be duplicated (but sorted!)
    //   just remove duplication
    blocks = unique(blocks, (b) => b.uuid)

    const transformed = transformCallback(blocks)
    for (const block of transformed) {
        // Logseq don't add movement to history if there was no movement at all
        //   so we don't have to save API calls: just call .moveBlock on EVERY block
        await logseq.Editor.moveBlock(block.uuid, insertionPoint.uuid, {before: false})
        insertionPoint = block
    }
}
