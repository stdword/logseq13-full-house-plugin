import '@logseq/libs'
import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { Template, InlineTemplate } from './template'
import { PageContext, BlockContext, getConfigContext, ILogseqContext, ArgsContext } from './context'
import { p, IBlockNode, lockOn, sleep, LogseqReference, getPage, getBlock, LogseqReferenceAccessType, getPageFirstBlock, PropertiesUtils, RendererMacro } from './utils'
import { RenderError, StateError, StateMessage } from './errors'


/*
 * @raises StateError: `pageRef` doesn't exist
 */
async function getCurrentContext(
    forBlockUUID: string,
    pageRef?: LogseqReference,
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
    rawCode: RendererMacro, opts: {
    includingParent?: boolean,
    pageRef?: LogseqReference,
    args: string[],
} = {args: []}) => {
    console.debug(p`Render to block`, {uuid})

    const { includingParent, pageRef, args } = opts

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

/**
 * @ui may show message to user
 */
async function isInsideMacro(blockUUID) {
    if (blockUUID)
        return false

    // Where is uuid? It definitely should be here, but this is a bug:
    //   https://github.com/logseq/logseq/issues/8904

    // We are inside the :macros from config.edn
    // And can't auto fulfill `c.block` & `c.page` context variables

    // Workarounds:
    //   1) ✖️ fill these vars manually with :page and :block args
    //     - requires user to make some manual work
    //     - this work is not trivial: "How to specify block as macro arg?"
    //   2) ✔️ offer user to use this command without macros
    //     - instead of: `{{wiki}}`
    //     - offer to use: `{{renderer :template-view, wiki}}`
    //     - it is a bit longer, but can be inserted with :command
    //       - `"view" "{{renderer :template-view, NAME}}"`
    //   3) ✖️ offer user to construct special macro
    //     - `"view" "{{renderer :template-view, $1, :_current_page_dynamic_var <% current page %>}}"`
    //     - this way we can fulfill `c.page`
    //       - but note another bug: https://github.com/logseq/logseq/issues/8903
    //     - `c.block` remains undetected
    //     - approach is very ugly
    //   4) ✔️ wait until bug will be fixed

    await logseq.UI.showMsg(
        `[:div
            [:p "It seems like you are using the " [:code ":macros"] " with"
                [:code "🏛Full House Templates"]
                "." ]
            [:p "Unfortunately there is an issue in Logseq which causes"
                " some plugin features to work incorrectly with macros." ]
            [:p "Please use the " [:code ":template-view"] "command instead,"
                " specially designed for this case." ]
            [:p [:b "See details "
                [:a {:href "https://github.com/logseq/logseq/issues/8904"} "here"]]]
        ]`,
        'error', {timeout: 15000})

    console.debug(p`logseq issue: https://github.com/logseq/logseq/issues/8904`)

    // TODO: continue to render template view
    //   if it is not accessing `c.page` & `c.block` variables
    return true
 }
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
        args: new ArgsContext(args),
    }

    let rendered: IBlockNode
    try {
        rendered = template.render(context as unknown as ILogseqContext)
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

    const oldContent = contextBlock.content
    const toInsert = head.content
    let newContent = oldContent.replace(rawCode.toString(), toInsert)
    if (newContent === oldContent) {
        // if no replacement was done, try another form of macro command
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
