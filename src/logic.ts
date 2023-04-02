import '@logseq/libs'
import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { Template } from './template'
import { PageContext, BlockContext, ILogseqContext, ArgsContext, ConfigContext, Context } from './context'
import { p, IBlockNode, lockOn, sleep, LogseqReference, getPage, getBlock, LogseqReferenceAccessType, getPageFirstBlock, PropertiesUtils, RendererMacro, parseReference, walkBlockTree, isUUID, html } from './utils'
import { RenderError, StateError, StateMessage } from './errors'
import { LogseqMarkup } from './utils/mldoc_ast'


/**
 * @raises StateError: Arg `:page` doesn't exist or improperly specified
 */
async function getCurrentContext(
    template: Template,
    blockUUID: string,
    argsContext: ArgsContext,
): Promise<ILogseqContext | null> {
    if (!blockUUID) {
        // Where is uuid? It definitely should be here, but this is a bug:
        //   https://github.com/logseq/logseq/issues/8904
        console.debug(p`Assertion error: this case should be filtered out in "isInsideMacro"`)
        return null
    }

    // @ts-expect-error
    const contextPageRef = parseReference(argsContext.page as string ?? '')
    let contextPage: PageEntity | null = null
    if (contextPageRef) {
        if (contextPageRef.type === 'block')
            throw new StateError(
                `[:p "Argument " [:code ":page"] " should be a page reference"]`
            )

        // TODO: use query instead of ref
        const pageExists = await getPage(contextPageRef)
        if (!pageExists)
            throw new StateError(
                `[:p "Page " [:i "${contextPageRef.original}"]" doesn't exist"]`,
                {contextPageRef})

        contextPage = pageExists
    }

    const currentBlock = await logseq.Editor.getBlock(blockUUID)
    if (!currentBlock) {
        console.debug(p`logseq issue → rendering non-existed block / slot`)
        return null
    }

    const currentPage = await logseq.Editor.getPage(currentBlock.page.id) as PageEntity
    const currentPageContext = PageContext.createFromEntity(currentPage)

    argsContext._hideUndefinedMode = true
    return {
        config: await ConfigContext.get(),
        page: contextPage ? PageContext.createFromEntity(contextPage) : currentPageContext,
        block: BlockContext.createFromEntity(currentBlock, { page: currentPageContext }),
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

async function getTemplate(ref: LogseqReference): Promise<Template> {
    const [ templateBlock, name, accessedVia ] = await getTemplateBlock(ref)

    let includingParent: boolean | undefined
    if (ref.option)
        includingParent = ref.option === '+'  // or '-'

    const template = new Template(templateBlock, {name, includingParent, accessedVia})
    await template.init()
    if (template.isEmpty())
        throw new StateMessage(
            `[:p "Template " [:i "${template.name || ref.original}"] " is empty. "
                 "Add content / child blocks or set " [:br]
                 [:code "template-including-parent:: yes"]
            ]`,
            {ref},
        )

    return template
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

    logseq.UI.showMsg(
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
    rawCode: RendererMacro,
    args: string[],
) => {
    // backwards compatibility
    //   obsolete: first arg is a context page ref
    //   now: :page arg is a context page ref
    // → treat {{renderer :template, wiki, —, ru}}
    //   as {{renderer :template, wiki, ru}}
    if (args[0] === '')
        args.shift()

    const argsContext = ArgsContext.create(templateRef, args)

    if (await isInsideMacro(uuid))
        return

    const template = await getTemplate(templateRef)
    const context = await getCurrentContext(template, uuid, argsContext)
    if (!context)
        return

    let rendered: IBlockNode
    try {
        rendered = await template.render(context)
    }
    catch (error) {
        const message = (error as Error).message
        throw new RenderError(
            `[:p "Cannot render template "
                [:i "${template.name || templateRef.original}"] ": "
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
    const argsContext = ArgsContext.create(templateRef, args)

    if (await isInsideMacro(blockUUID))
        return

    const template = await getTemplate(templateRef)
    const context = await getCurrentContext(template, blockUUID, argsContext)
    if (!context)
        return

    let rendered: IBlockNode
    try {
        rendered = await template.render(context)
        console.debug(p`Template rendered:`, {data: rendered})
    }
    catch (error) {
        const message = (error as Error).message
        throw new RenderError(
            `[:p "Cannot render template view "
                [:i "${template.name || templateRef.original}"] ": "
                [:pre "${message}"]
            ]`,
            {template, error},
        )
    }

    const compiled = await walkBlockTree(rendered, async (b, lvl) => {
        if (!b.content.trim())
            return ''

        return await new LogseqMarkup(context).toHTML(b.content)
    })
    console.debug(p`Markup compiled:`, {data: compiled})

    const htmlFold = (node: IBlockNode, level = 0): string => {
        const children = () => node.children.map(
            (n) => htmlFold(n as IBlockNode, level + 1)
        ).join('')

        if (level === 0) {
            if (node.children.length === 0)
                return node.content

            const body = `<div class="body">${children()}</div>`
            if (node.content)
                return html`
                    <div class="header">${node.content}</div>
                    ${body}
                `

            return body
        }

        if (level === 1) {
            const content = node.content ? `<div>${node.content}</div>` : ''
            if (!node.children.length)
                return content

            return content + `<ul>${children()}</ul>`
        }

        const content =
            `<li>${node.content}` +
                (node.children.length ? `<ul>${children()}</ul>` : '') +
            '</li>'

        return content
    }

    const view = htmlFold(compiled)
    console.debug(p`View folded:`, {data: view})

    const content = html`
        <span class="fh_template-view"
              data-uuid="${blockUUID}"
              data-on-click="editBlock"
            >${view}</span>
    `

    const identity = slot.slice(1 + slot.split('_', 1).length).trim()
    logseq.provideUI({
        key: `template-view_${identity}`,
        slot: slot,
        reset: true,
        template: content,
    })
 }
