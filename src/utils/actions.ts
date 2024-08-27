import '@logseq/libs'
import { BlockEntity, IBatchBlock, ILSPluginUser } from '@logseq/libs/dist/LSPlugin'

import { ensureChildrenIncluded, filterOutChildBlocks, getBlocksWithReferences, getChosenBlocks, getEditingCursorSelection, IBlockNode, insertBatchBlockBefore, mapBlockTree, PropertiesUtils, setEditingCursorSelection, walkBlockTree, walkBlockTreeAsync } from './logseq'
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
