import '@logseq/libs'
import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { Template, InlineTemplate } from './template'
import { PageContext, BlockContext, getConfigContext, ILogseqContext } from './context'
import { p, IBlockNode, lockOn, sleep, LogseqReference, getPage, getBlock, LogseqReferenceAccessType, getPageFirstBlock, PropertiesUtils, RendererMacro } from './utils'
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
    templateRef: LogseqReference,
    includingParent: boolean | undefined,
    pageRef: LogseqReference | null,
    rawCode: RendererMacro,
) => {
    console.debug(p`Render to block`, {uuid})

    let templateBlock: BlockEntity | null
    let accessedVia: LogseqReferenceAccessType
    let name: string | undefined

    if (['page', 'tag'].includes(templateRef.type)) {
        templateBlock = await getPageFirstBlock(templateRef, {includeChildren: true})
        accessedVia = 'page'

        name = templateRef.value as string
    }
    else {
        [ templateBlock, accessedVia ] = await getBlock(
            templateRef, {
            byProperty: PropertiesUtils.templateProperty,
            includeChildren: true,
        })
    }

    if (!templateBlock)
        throw new StateError(
            `There's no such template: "${templateRef.original}"`,
            {templateRef},
        )

    const template = new Template(templateBlock, {name, includingParent, accessedVia})
    if (template.isEmpty())
        throw new StateMessage(
            `Template "${template.name || templateRef.original}" is empty.\n` +
            `Add child blocks or set "template-including-parent:: yes"`,
            {templateRef},
        )

    const [ contextPage, contextBlock ] = await getCurrentContext(uuid, pageRef)
    if (!contextPage || !contextBlock) {
        console.debug(p`logseq issue → rendering non-existed block / slot`)
        return
    }

    const currentPage = await logseq.Editor.getPage(contextBlock.page.id) as PageEntity
    const currentPageContext = PageContext.createFromEntity(currentPage)

    const context = {
        config: await getConfigContext(),
        page: PageContext.createFromEntity(contextPage),
        block: BlockContext.createFromEntity(contextBlock, { page: currentPageContext }),
    }

    let rendered: IBlockNode
    try {
        rendered = template.render(context as unknown as ILogseqContext)
    }
    catch (error) {
        const message = (error as Error).message
        throw new RenderError(
            `Cannot render template "${template.name || templateRef.original}": ${message}`,
            {template, error},
        )
    }

    let head: IBatchBlock
    let children: IBatchBlock[]
    if (template.includingParent)
        [ head, children ] = [ rendered, rendered.children ]
    else
        [ head, ...children ] = rendered.children

    // NOTE: it is important to call `insertBatchBlock` before `updateBlock`
    // due to @logseq/lib bug on batch inserting to empty block (content == '')

    if (children.length) {
        await logseq.Editor.insertBatchBlock(
            uuid,
            children, {
            sibling: !template.includingParent,
        })
    }

    const oldContent = contextBlock.content
    const toInsert = head.content
    let newContent = oldContent.replace(rawCode.toString(), toInsert)
    if (newContent === oldContent) {
        // if no replacement was done, try another from of macro command
        const toReplace = rawCode.toString({useColon: false})
        newContent = oldContent.replace(toReplace, toInsert)
        if (newContent === oldContent)
            console.warn(p`Cannot find renderer macro to replace it`, {
                uuid: contextBlock.uuid,
                oldContent,
                toReplace,
                toInsert,
            })
    }

    await logseq.Editor.updateBlock(uuid, newContent)

    // to prevent too often re-renderings
    // await sleep(3000)
 })
