import '@logseq/libs'
import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { Template, InlineTemplate } from './template'
import { PageContext, BlockContext, getConfigContext } from './context'
import { p, IBlockNode, lockOn, sleep, LogseqReference, getPage } from './utils'
import { RenderError, StateError, StateMessage } from './errors'


/*
 * @raises StateError: `pageRef` doesn't exist
 */
async function getCurrentContext(
    forBlockUUID: string,
    pageRef: LogseqReference | null,
): Promise<[PageEntity | null, BlockEntity | null]> {
    let page: PageEntity | null = null
    if (pageRef) {
        // TODO: use query for page instead of ref
        const pageExists = await getPage(pageRef)
        if (!pageExists)
            throw new StateError(`Page doesn't exist: "${pageRef.original}"`, {pageRef})
        page = pageExists
    }

    const block = await logseq.Editor.getBlock(forBlockUUID)
    if (!block)
        return [page, null]  // could be [null, null]

    if (!page)
        page = await logseq.Editor.getPage(block.page.id) as PageEntity
    return [page, block]
 }

/*
 * @raises StateError: template doesn't exist
 * @raises StateMessage: template doesn't have any content (empty)
 * @raises RenderError: template rendering error
 */
export let renderTemplateInBlock =
    lockOn( ([uuid, ..._]) => uuid ) (
async (
    uuid: string,
    templateName: string,
    pageRef: LogseqReference | null,
) => {
    console.debug(p`Render to block`, {uuid})

    const template = await Template.createByName(templateName);
    if (!template)
        throw new StateError(`There's no such template: "${templateName}"`, {templateName})

    if (template.isEmpty())
        throw new StateMessage(
            `Template "${templateName}" is empty.\n` +
            `Add child blocks or set \`template-including-parent:: yes\``,
            {templateName},
        )

    const [ page, block ] = await getCurrentContext(uuid, pageRef)
    if (!page || !block) {
        console.debug(p`logseq issue → rendering non-existed block / slot`)
        return
    }

    const context = {
        config: await getConfigContext(),
        page: new PageContext(page),
        block: new BlockContext(block),
    }

    let rendered: IBlockNode
    try {
        rendered = template.render(context)
    }
    catch (error) {
        const message = (error as Error).message
        throw new RenderError(
            `Cannot render template "${templateName}": ${message}`,
            {template, error},
        )
    }

    await logseq.Editor.exitEditingMode(false)
    await logseq.Editor.updateBlock(uuid, '')

    if (template.includingParent) {
        await logseq.Editor.updateBlock(uuid, rendered.content)
        if (rendered.children.length !== 0)
            await logseq.Editor.insertBatchBlock(uuid, rendered.children, {sibling: false})
    }
    else
        await logseq.Editor.insertBatchBlock(uuid, rendered.children, {sibling: true})

    await logseq.Editor.exitEditingMode(false)

    await sleep(3000)
 })
