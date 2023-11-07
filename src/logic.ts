import '@logseq/libs'
import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { LogseqMarkup } from './extensions/mldoc_ast'
import { InlineTemplate, ITemplate, Template } from './template'
import {
    ILogseqContext, Context, PageContext, BlockContext,
    ArgsContext, ConfigContext,
} from './context'
import {
    p, IBlockNode, lockOn, sleep, LogseqReference, getPage, getBlock,
    LogseqReferenceAccessType, getPageFirstBlock, PropertiesUtils, RendererMacro,
    parseReference, walkBlockTree, isUUID, html, isRecursiveOrNestedTemplate,
    escapeForHiccup,
} from './utils'
import { RenderError, StateError, StateMessage } from './errors'


/**
 * @raises StateError: Arg `:page` doesn't exist or improperly specified
 */
async function getCurrentContext(
    slot: string,
    template: ITemplate,
    blockUUID: string,
    argsContext: ArgsContext,
): Promise<ILogseqContext | null> {
    if (!blockUUID) {
        // Where is uuid? It definitely should be here, but this is a bug:
        //   https://github.com/logseq/logseq/issues/8904
        console.debug(p`Assertion error: this case should be filtered out in "isInsideMacro"`)
        return null
    }

    // fulfill args with template arg-props
    const argsProps = template.getArgProperties()
    for (const [ key, value ] of Object.entries(argsProps))
        if (key.startsWith(ArgsContext.propertyPrefix)) {
            const name = key.slice(ArgsContext.propertyPrefix.length)
            if (argsContext[name] === undefined)
                argsContext[name] = value
        }

    // @ts-expect-error
    const contextPageRef = parseReference(argsContext.page as string ?? '')
    let contextPage: PageEntity | null = null
    if (contextPageRef) {
        if (contextPageRef.type === 'block')
            throw new StateError(
                `[:p "Argument " [:code ":page"] " should be a page reference"]`
            )

        const pageExists = await getPage(contextPageRef)
        if (!pageExists)
            throw new StateError(
                `[:p "Page " [:i "${contextPageRef.original.replaceAll('"', '\\"')}"]" doesn't exist"]`,
                {contextPageRef})

        contextPage = pageExists
    }

    // @ts-expect-error
    const contextBlockRef = parseReference(argsContext.block as string ?? '')
    let contextBlock: BlockEntity | null = null
    if (contextBlockRef) {
        if (!['block', 'uuid'].includes(contextBlockRef.type))
            throw new StateError(
                `[:p "Argument " [:code ":block"] " should be a block reference"]`
            )

        const [ blockExists, _] = await getBlock(contextBlockRef, { includeChildren: false })
        if (!blockExists)
            throw new StateError(
                `[:p "Block " [:i "${contextBlockRef.original}"]" doesn't exist"]`,
                {contextBlockRef})

        contextBlock = blockExists
    }

    const currentBlock = await logseq.Editor.getBlock(blockUUID)
    if (!currentBlock) {
        console.debug(p`logseq issue → rendering non-existed block / slot`)
        return null
    }

    const currentPage = await logseq.Editor.getPage(currentBlock.page.id) as PageEntity
    const currentPageContext = PageContext.createFromEntity(currentPage)
    const currentBlockContext = BlockContext.createFromEntity(currentBlock, { page: currentPageContext })

    argsContext._hideUndefinedMode = true
    return {
        identity: new Context({ slot, key: slot.split('__', 2)[1].trim() }),
        config: await ConfigContext.get(),

        page: contextPage ? PageContext.createFromEntity(contextPage) : currentPageContext,
        currentPage: currentPageContext,

        block: contextBlock ? BlockContext.createFromEntity(contextBlock) : currentBlockContext,
        currentBlock: currentBlockContext,

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
    } else {
        [ templateBlock, accessedVia ] = await getBlock(
            templateRef, {
            byProperty: PropertiesUtils.templateProperty,
            includeChildren: true,
        })

        if (accessedVia === 'name')
            name = templateRef.value as string
    }

    if (!templateBlock)
        throw new StateError(
            `[:p "There's no such template: "
                [:i "${templateRef.original}"]]`,
            {templateRef},
        )

    if (!name)
        name = templateBlock.uuid

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

function getView(body: string): InlineTemplate {
    const template = new InlineTemplate(body)

    if (template.isEmpty())
        throw new StateMessage(`[:p "Inline Template body is empty."]`, {body})

    return template
 }

/**
 * @ui show message to user
 */
function showInsideMacroNotification() {
    // We are probably inside the :macros from config.edn
    // And can't find the renderer macro to replace with rendered template

    logseq.UI.showMsg(
        `[:div
            [:p "Cannot find the appropriate " [:code "{{renderer :template, ...}}"]
                " content in block to replace it with rendered template."]
            [:p "The possible reason is you are using " [:code "🏛Full House Templates"]
                " with " [:code ":macros"] "."]
            [:p "Please use the " [:code ":template-view"] "command " [:u "instead"]
                [:code ":macros"] ", specially designed for this case." ]
            [:p [:b "See details " [:a
                {:href "https://stdword.github.io/logseq13-full-house-plugin/#/faq?id=using-with-macros"}
                "here"]]]
        ]`,
        'error', {timeout: 30000})
    return true
}

async function handleNestedRendering(
    templateBlock: BlockEntity,
    argsContext: ArgsContext,
    uuid: string,
    slot: string,
    rawCode: RendererMacro,
) {
    // prevent rendering if we are inside another template block

    const state = await isRecursiveOrNestedTemplate(uuid, templateBlock.id)

    // case: template rendering occurs inside itself (recursive)
    if (state === 'recursive') {
        const code = html`
            <i title="Rendering of this ${rawCode.name} was stopped due to recursion"
                >${rawCode.toString()}</i>
        `
        provideHTML(uuid, code, slot)
        return true
    }

    // case: template rendering occurs via standard Logseq way
    //       https://github.com/stdword/logseq13-full-house-plugin/discussions/18
    if (argsContext['delay-until-rendered'] && state === 'nested') {
        const code = html`
            <i title="Rendering of this ${rawCode.name} was delayed"
                >${rawCode.toString()}</i>
        `
        provideHTML(uuid, code, slot)
        return true
    }

    return false
 }

function provideHTML(blockUUID: string, htmlCode: string, slot: string) {
    const content = html`
        <span class="fh_template-view"
              data-uuid="${blockUUID}"
              data-on-click="editBlock"
            >${htmlCode}</span>
    `

    logseq.provideUI({
        key: `template-view_${slot}`,
        slot: slot,
        reset: true,
        template: content,
    })
 }


/**
 * @raises StateError: template doesn't exist
 * @raises StateMessage: template doesn't have any content (empty)
 * @raises RenderError: template rendering error
 */
export const renderTemplateInBlock =
    lockOn( ([uuid, ..._]) => uuid ) (
async (
    slot: string,
    uuid: string,
    templateRef: LogseqReference,
    rawCode: RendererMacro,
    args: string[],
) => {
    const argsContext = ArgsContext.create(templateRef.original, args)
    const template = await getTemplate(templateRef)

    const handled = await handleNestedRendering(template.block, argsContext, uuid, slot, rawCode)
    if (handled)
        return

    const context = await getCurrentContext(slot, template, uuid, argsContext)
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
                [:pre "${escapeForHiccup(message)}"]
            ]`,
            {template, error},
        )
    }

    let head: IBatchBlock
    let children: IBatchBlock[]
    if (template.includingParent)
        [ head, children ] = [ rendered, [] ]
    else
        [ head, ...children ] = rendered.children

    console.debug(p`Template rendered:`, {head, children})

    const toInsert = head.content
    const oldContent = context.currentBlock.content!
    const toReplace = rawCode.toPattern()
    const newContent = oldContent.replace(toReplace, toInsert)
    if (newContent === oldContent) {
        showInsideMacroNotification()

        console.warn(p`Cannot find renderer macro to replace it`, {
            uuid,
            oldContent,
            toReplace,
            toInsert,
        })
        return
    }

    // WARNING: it is important to call `.insertBatchBlock` before `.updateBlock`
    // due to @logseq/lib bug on batch inserting to empty block (content == '')
    if (head.children && head.children.length)
        await logseq.Editor.insertBatchBlock(
            uuid,
            head.children, {
            sibling: false,
        })

    await logseq.Editor.updateBlock(uuid, newContent)

    if (children.length)
        await logseq.Editor.insertBatchBlock(
            uuid,
            children, {
            sibling: true,
        })
})

/**
 * @raises StateError: template doesn't exist
 * @raises StateMessage: template doesn't have any content (empty)
 * @raises RenderError: template rendering error
 */
async function _renderTemplateView(
    slot: string,
    blockUUID: string,
    template: ITemplate,
    rawCode: RendererMacro,
    argsContext: ArgsContext,
) {
    const context = await getCurrentContext(slot, template, blockUUID, argsContext)
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
                [:i "${template.name}"] ": "
                [:pre "${escapeForHiccup(message)}"]
            ]`,
            {template, error},
        )
    }

    const compiled = await walkBlockTree(rendered, async (b, lvl) => {
        if (!b.content.trim())
            return ''

        return new LogseqMarkup(context).toHTML(b.content)
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
    console.debug(p`View folded:`, {view})

    provideHTML(blockUUID, view, slot)
}

export async function renderTemplateView(
    slot: string,
    blockUUID: string,
    templateRef: LogseqReference,
    rawCode: RendererMacro,
    args: string[] = [],
) {
    const template = await getTemplate(templateRef)
    const argsContext = ArgsContext.create(template.name, args)

    const handled = await handleNestedRendering(template.block, argsContext, blockUUID, slot, rawCode)
    if (handled)
        return

    await _renderTemplateView(slot, blockUUID, template, rawCode, argsContext)
 }

export async function renderView(
    slot: string,
    blockUUID: string,
    viewBody: string,
    rawCode: RendererMacro,
    args: string[] = [],
) {
    const template = getView(viewBody)
    const argsContext = ArgsContext.create(template.name, args)
    await _renderTemplateView(slot, blockUUID, template, rawCode, argsContext)
 }
