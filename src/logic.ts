import '@logseq/libs'
import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { Template, InlineTemplate } from './template'
import { PageContext, BlockContext, ILogseqContext, ArgsContext, ConfigContext, Context } from './context'
import { p, IBlockNode, lockOn, sleep, LogseqReference, getPage, getBlock, LogseqReferenceAccessType, getPageFirstBlock, PropertiesUtils, RendererMacro, parseReference, walkBlockTree, isUUID } from './utils'
import { RenderError, StateError, StateMessage } from './errors'


/**
 * @raises StateError: `contextPageRef` doesn't exist
 */
async function getCurrentContext(
    template: Template,
    blockUUID: string,
    argsContext: ArgsContext,
    contextPageRef?: LogseqReference,
): Promise<ILogseqContext | null> {
    // @ts-expect-error
    const contextPageRef_ = argsContext.page as string
    if (contextPageRef_)
        contextPageRef = parseReference(contextPageRef_) ?? undefined

    let contextPage: PageEntity | undefined
    if (contextPageRef) {
        // TODO: use query for page instead of ref
        const pageExists = await getPage(contextPageRef)
        if (!pageExists)
            throw new StateError(`Page doesn't exist: "${contextPageRef.original}"`, {contextPageRef})
        contextPage = pageExists
    }

    let currentBlock: BlockEntity | null = null
    if (blockUUID) {
        currentBlock = await logseq.Editor.getBlock(blockUUID)
        if (!currentBlock) {
            console.debug(p`logseq issue → rendering non-existed block / slot`)
            return null
        }
    }

    let currentPage: PageEntity | null = null
    if (currentBlock)
        currentPage = await logseq.Editor.getPage(currentBlock.page.id) as PageEntity
    else {
        // fighting with bug: https://github.com/logseq/logseq/issues/8904
        // user should provide special arg `:__page <% current page %>`
        // @ts-expect-error
        const macroCurrentPage_ = argsContext.__page as string
        if (macroCurrentPage_) {
            const macroCurrentPage = parseReference(macroCurrentPage_)
            if (macroCurrentPage) {
                // fighting with bug: https://github.com/logseq/logseq/issues/8903
                if (macroCurrentPage.type === 'page' && isUUID(macroCurrentPage.value as string)) {
                    const blockUUID = macroCurrentPage.value
                    const zoomedBlock = await logseq.Editor.getBlock(blockUUID)
                    if (zoomedBlock)
                        currentPage = await logseq.Editor.getPage(zoomedBlock.page.id)
                } else {
                    currentPage = await getPage(macroCurrentPage)
                }
            }
        }
    }

    const currentPageContext = currentPage ? PageContext.createFromEntity(currentPage) : PageContext.empty()

    return {
        config: await ConfigContext.get(),
        page: contextPage ? PageContext.createFromEntity(contextPage) : currentPageContext,
        block: currentBlock ? BlockContext.createFromEntity(currentBlock, { page: currentPageContext }) : BlockContext.empty(),
        args: argsContext,
    }
 }

/**
 * @raises StateError: template doesn't exist
 */
async function getTemplateBlock(
    templateRef: LogseqReference
): Promise<[BlockEntity, string | undefined, LogseqReferenceAccessType]> {
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
            `[:p "There's no such template: "
                [:i "${templateRef.original}"]]`,
            {templateRef},
        )

    return [ templateBlock, name, accessedVia ]
 }

/**
 * @ui may show message to user
 */
async function isInsideMacro(blockUUID: string) {
    if (blockUUID)
        return false

    // Where is uuid? It definitely should be here, but this is a bug:
    //   https://github.com/logseq/logseq/issues/8904

    // We are inside the :macros from config.edn
    // And can't auto fill `c.block` & `c.page` context variables

    await logseq.UI.showMsg(
        `[:div
            [:p "It seems like you are using the " [:code ":macros"] " with"
                [:code "🏛Full House Templates"]
                "." ]
            [:p "Unfortunately there is an issue in Logseq which restricts"
                " usage of some plugin features with macros." ]
            [:p "Please use the " [:code ":template-view"] "command instead,"
                " specially designed for this case." ]
            [:p [:b "See details " [:a
                {:href "https://github.com/stdword/logseq13-full-house-plugin/blob/main/docs/using-with-macros.md"}
                "here"]]]
        ]`,
        'error', {timeout: 15000})

    console.debug(p`logseq issue: https://github.com/logseq/logseq/issues/8904`)

    // TODO: continue to render template view
    //   if it is not accessing `c.page` & `c.block` variables
    return true
 }

/**
 * @raises StateError: template doesn't exist
 * @raises StateMessage: template doesn't have any content (empty)
 * @raises RenderError: template rendering error
 */
export const renderTemplateInBlock =
    lockOn( ([uuid, ..._]) => uuid ) (
async (
    uuid: string,
    templateRef: LogseqReference,
    rawCode: RendererMacro, opts: {
    includingParent?: boolean,
    pageRef?: LogseqReference,
    args: string[],
} = {args: []}) => {
    const { includingParent, pageRef, args } = opts
    const [ templateBlock, name, accessedVia ] = await getTemplateBlock(templateRef)
    const argsContext = new ArgsContext(templateRef, args)

    const template = new Template(templateBlock, {name, includingParent, accessedVia})
    if (template.isEmpty())
        throw new StateMessage(
            `[:p "Template "
                [:i "${template.name || templateRef.original}"]
                " is empty. "
                "Add child blocks or set "
                [:br]
                [:code "template-including-parent:: yes"]
            ]`,
            {templateRef},
        )

    if (await isInsideMacro(uuid))
        return

    const context = await getCurrentContext(template, uuid, argsContext, pageRef ?? undefined)
    if (!context)
        return

    let rendered: IBlockNode
    try {
        rendered = template.render(context)
    }
    catch (error) {
        const message = (error as Error).message
        throw new RenderError(
            `[:p "Cannot render template "
                [:i "${template.name || templateRef.original}"]
                ": "
                [:pre "${message}"]
            ]`,
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

    const oldContent = context.block!.content!
    const toInsert = head.content
    let newContent = oldContent.replace(rawCode.toString(), toInsert)
    if (newContent === oldContent) {
        // if no replacement was done, try another form of macro command
        const toReplace = rawCode.toString({useColon: false})
        newContent = oldContent.replace(toReplace, toInsert)
        if (newContent === oldContent)
            console.warn(p`Cannot find renderer macro to replace it`, {
                uuid,
                oldContent,
                toReplace,
                toInsert,
            })
    }

    await logseq.Editor.updateBlock(uuid, newContent)
 })

/**
 * @raises StateError: template doesn't exist
 * @raises StateMessage: template doesn't have any content (empty)
 * @raises RenderError: template rendering error
 */
export async function renderTemplateView(
    slot: string,
    blockUUID: string,
    templateRef: LogseqReference,
    rawCode: RendererMacro,
    args: string[] = [],
) {
    const [ templateBlock, name, accessedVia ] = await getTemplateBlock(templateRef)
    const argsContext = new ArgsContext(templateRef, args)

    const template = new Template(templateBlock, {name, includingParent: false, accessedVia})
    if (template.isEmpty())
        throw new StateMessage(
            `[:p "Template "
                [:i "${template.name || templateRef.original}"]
                " is empty. "
                "Add child blocks to use it as view"
            ]`,
            {templateRef},
        )

    if (await isInsideMacro(blockUUID))
        return

    const context = await getCurrentContext(template, blockUUID, argsContext)
    if (!context)
        return

    let rendered: IBlockNode
    try {
        rendered = template.render(context)
    }
    catch (error) {
        const message = (error as Error).message
        throw new RenderError(
            `[:p "Cannot render template "
                [:i "${template.name || templateRef.original}"]
                ": "
                [:pre "${message}"]
            ]`,
            {template, error},
        )
    }

    let content = ''
    walkBlockTree(rendered, (b, lvl) => {
        if (lvl === 0)
            return

        if (lvl === 1)
            content += b.content
        else
            content += '\n' + ' '.repeat(lvl) + '- ' + b.content
    })

    content = `
        <span class="fh_template-view"
              data-uuid="${blockUUID}"
              data-on-click="editBlock"
            >${content}</span>
    `.trim()

    const identity = slot.slice(1 + slot.split('_', 1).length).trim()
    logseq.provideUI({
        key: `template-view_${identity}`,
        slot: slot,
        reset: true,
        template: content,
    })
 }
