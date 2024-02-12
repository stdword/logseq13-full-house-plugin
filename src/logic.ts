import '@logseq/libs'
import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { LogseqMarkup } from './extensions/mldoc_ast'
import { InlineTemplate, ITemplate, Template } from './template'
import {
    ILogseqContext, Context, PageContext, BlockContext,
    ArgsContext, ConfigContext, ILogseqCurrentContext, ILogseqCallContext,
} from './context'
import {
    p, IBlockNode, lockOn, sleep, LogseqReference, getPage, getBlock,
    LogseqReferenceAccessType, getPageFirstBlock, PropertiesUtils, RendererMacro,
    parseReference, walkBlockTree, isUUID, html, isRecursiveOrNestedTemplate,
    escapeForHiccup,
    coerceStringToBool,
} from './utils'
import { RenderError, StateError, StateMessage } from './errors'


async function getCurrentContext(
    blockUUID: string,
    mode: ILogseqCurrentContext['mode'],
): Promise<ILogseqCurrentContext | null> {
    if (!blockUUID) {
        // Where is uuid? It definitely should be here, but this is a bug:
        //   https://github.com/logseq/logseq/issues/8904
        console.debug(p`Assertion error: this case should be filtered out in "isInsideMacro"`)
        return null
    }

    const currentBlock = await logseq.Editor.getBlock(blockUUID)
    if (!currentBlock) {
        console.debug(p`logseq issue → rendering non-existed block / slot`)
        return null
    }

    const currentPage = await logseq.Editor.getPage(currentBlock.page.id) as PageEntity
    const currentPageContext = PageContext.createFromEntity(currentPage)
    const currentBlockContext = BlockContext.createFromEntity(currentBlock, { page: currentPageContext })

    return {
        mode,
        currentPage: currentPageContext,
        currentBlock: currentBlockContext,
    }
}

/**
 * @raises StateError: Arg `:page` doesn't exist or improperly specified
 * @raises StateError: Arg `:block` doesn't exist or improperly specified
 */
async function getCallContext(
    slot: string,
    template: ITemplate,
    argsContext: ArgsContext,
): Promise<ILogseqCallContext> {
    // fulfill args with template arg-props
    const argsProps = template.getArgProperties()
    for (const [ key, value ] of Object.entries(argsProps))
        if (key.startsWith(ArgsContext.propertyPrefix)) {
            const name = key.slice(ArgsContext.propertyPrefix.length)
            if (argsContext[name] === undefined) {
                const bool = coerceStringToBool(value)
                argsContext[name] = bool !== null ? bool : value
            }
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

    argsContext._hideUndefinedMode = true
    return {
        identity: new Context({ slot, key: slot.split('__', 2)[1].trim() }),
        config: await ConfigContext.get(),

        page: contextPage ? PageContext.createFromEntity(contextPage) : null,
        block: contextBlock ? BlockContext.createFromEntity(contextBlock) : null,
        args: argsContext,
    }
}

async function getContext(
    callContext: ILogseqCallContext,
    currentContext: ILogseqCurrentContext,
): Promise<ILogseqContext> {
    return {
        mode: currentContext.mode,
        identity: callContext.identity,
        config: callContext.config,

        page: callContext.page || currentContext.currentPage,
        currentPage: currentContext.currentPage,

        block: callContext.block || currentContext.currentBlock,
        currentBlock: currentContext.currentBlock,

        args: callContext.args,
    }
}


/**
 * @raises StateError: template doesn't exist
 */
export async function getTemplateBlock(
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

export async function getTemplate(ref: LogseqReference): Promise<Template> {
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

    const currentContext = await getCurrentContext(uuid, 'template')
    if (!currentContext)
        return

    const context = await getContext(
        await getCallContext(slot, template, argsContext),
        currentContext,
    )

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
        if (oldContent.search(/\{\{\s*\w+\s*.*?\}\}/g) !== -1)
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
 * @raises RenderError: template rendering error
 */
export async function compileTemplateView(
    slot: string,
    template: ITemplate,
    argsContext: ArgsContext,
    currentContext: ILogseqCurrentContext,
): Promise<string> {
    const context = await getContext(
        await getCallContext(slot, template, argsContext),
        currentContext,
    )

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

    let compiled = await walkBlockTree(rendered, async (b, lvl) => {
        const content = (b.content || '').toString()
        if (!content.trim())
            return ''

        return new LogseqMarkup(context).toHTML(content)
    })
    console.debug(p`Markup compiled:`, {data: compiled})

    if (compiled.content === '' && compiled.children.length === 1)
        compiled = compiled.children[0]

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

    return view
}

async function _renderTemplateView(
    slot: string,
    blockUUID: string,
    template: ITemplate,
    argsContext: ArgsContext,
) {
    const currentContext = await getCurrentContext(blockUUID, 'view')
    if (!currentContext)
        return

    const view = await compileTemplateView(slot, template, argsContext, currentContext)
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

    await _renderTemplateView(slot, blockUUID, template, argsContext)
}

export async function renderView(
    slot: string,
    blockUUID: string,
    viewBody: string,
    args: string[] = [],
) {
    const template = getView(viewBody)
    const argsContext = ArgsContext.create(template.name, args)
    await _renderTemplateView(slot, blockUUID, template, argsContext)
}

export async function templateMacroStringForBlock(uuid: string, isView: boolean = false): Promise<string> {
    const block = await logseq.Editor.getBlock(uuid)
    if (!block)
        return ''

    const templateName = PropertiesUtils.getProperty(
        block, PropertiesUtils.templateProperty
    ).text
    let templateRef = templateName
    if (!templateRef) {
        const uuidExisted = PropertiesUtils.hasProperty(block.content, PropertiesUtils.idProperty)
        if (!uuidExisted)
            await logseq.Editor.upsertBlockProperty(uuid, PropertiesUtils.idProperty, uuid)
        templateRef = `((${uuid}))`
    }

    const commandName = isView ? 'template-view' : 'template'
    let command = RendererMacro.command(commandName).arg(templateRef)

    const templateUsage = Template.getUsageString(block, {cleanMarkers: true})
    if (templateUsage)
        command = command.arg(templateUsage, {raw: true})

    return command.toString()
}
export async function templateMacroStringForPage(name: string, isView: boolean = false): Promise<string> {
    const pageRefString = `[[${name}]]`
    const pageRef = parseReference(pageRefString)!
    const page = await getPage(pageRef)
    if (!page)
        return ''

    const commandName = isView ? 'template-view' : 'template'
    let command = RendererMacro.command(commandName).arg(pageRefString)

    const block = await getPageFirstBlock(pageRef)
    if (block) {
        const templateUsage = Template.getUsageString(block, {cleanMarkers: true})
        if (templateUsage)
            command = command.arg(templateUsage, {raw: true})
    }

    return command.toString()
}
