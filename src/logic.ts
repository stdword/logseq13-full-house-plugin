import '@logseq/libs'
import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { LogseqMarkup } from './extensions/mldoc_ast'
import { InlineTemplate, ITemplate, Template } from './template'
import {
    ILogseqContext, Context, PageContext, BlockContext,
    ArgsContext, ConfigContext, ILogseqCurrentContext, ILogseqCallContext,
    dayjs,
} from './context'
import {
    p, IBlockNode, lockOn, sleep, LogseqReference, getPage, getBlock,
    LogseqReferenceAccessType, getPageFirstBlock, PropertiesUtils, RendererMacro,
    parseReference, isUUID, html, isRecursiveOrNestedTemplate,
    escapeForHiccup,
    coerceStringToBool,
    mapBlockTree,
    getTreeNode,
    editBlockWithSelection,
    setEditingCursorSelection,
    walkBlockTree,
    getActualBlock,
    filterBlockTree,
    getEditingCursorSelection,
    getChosenBlocks,
    insertBatchBlockBefore,
    insertBatchBlockAfter,
    splitMacroArgs,
} from './utils'
import { RenderError, StateError, StateMessage } from './errors'


export type InsertAs = 'View' | 'Template' | 'Button'


async function getCurrentContext(
    blockOrPageUUID: string | null,
    mode: ILogseqCurrentContext['mode'],
): Promise<ILogseqCurrentContext | null> {
    // case: template insertion triggered by shortcut
    //   outside of edit mode and no blocks are selected
    if (blockOrPageUUID === null) {
        let page: PageEntity | null = null

        const currentPageOrBlock = await logseq.Editor.getCurrentPage()
        if (currentPageOrBlock)
            if (currentPageOrBlock.name)
                page = currentPageOrBlock as PageEntity
            else
                page = (
                    await logseq.Editor.getPage((currentPageOrBlock as BlockEntity).page.id)
                )!

        return {
            mode,
            currentPage: page ? PageContext.createFromEntity(page) : PageContext.empty(),
            currentBlock: BlockContext.empty(),
        }
    }

    if (blockOrPageUUID === '') {
        // Where is uuid? It definitely should be here, but this is a bug:
        //   https://github.com/logseq/logseq/issues/8904
        console.debug(p`Assertion error: this case should be filtered out in "isInsideMacro"`)
        return null
    }

    let currentPage: PageEntity | null
    const currentBlock = await logseq.Editor.getBlock(blockOrPageUUID)
    if (currentBlock)
        currentPage = await logseq.Editor.getPage(currentBlock.page.id)
    else {
        currentPage = await logseq.Editor.getPage(blockOrPageUUID)
        if (!currentPage) {
            console.debug(p`logseq issue → rendering non-existed block / slot`)
            return null
        }
    }

    const currentPageContext = PageContext.createFromEntity(currentPage!)
    const currentBlockContext = currentBlock
        ? BlockContext.createFromEntity(currentBlock, { page: currentPageContext })
        : BlockContext.empty()

    return {
        mode,
        currentPage: currentPageContext,
        currentBlock: currentBlockContext,
    }
}

export async function getArgsContext(
    template: ITemplate,
    args: string[],
    precedingTemplate?: ITemplate,
): Promise<ArgsContext> {
    const argsContext = ArgsContext.create(template.name, args)
    const argsProps = template.getArgProperties()

    // for handling template layouts
    if (precedingTemplate) {
        const precedingArgsProps = precedingTemplate.getArgProperties()
        Object.assign(argsProps, precedingArgsProps)
    } else {
        const blockID = argsContext['transcluded-from']
        if (blockID) {
            const block = await logseq.Editor.getBlock(Number(blockID))
            if (block) {
                const precedingArgsProps = Template.getArgProperties(block)
                Object.assign(argsProps, precedingArgsProps)
            }
        }
    }

    // fulfill args with template arg-props
    for (const [ key, value ] of Object.entries(argsProps))
        if (key.startsWith(ArgsContext.propertyPrefix)) {
            const name = key.slice(ArgsContext.propertyPrefix.length)
            if (argsContext._get(name) === undefined) {
                argsContext[name] = value
                if (name.endsWith('?')) {
                    const bool = coerceStringToBool(value)
                    if (bool !== null)
                        argsContext[name] = bool

                    // copy to arg without «?»
                    const name_ = name.slice(0, -1)
                    if (argsProps[name_] === undefined &&
                        argsContext._get(name_) === undefined
                    )
                        argsContext[name_] = argsContext[name]
                }
            }
        }

    return argsContext
}

/**
 * @raises StateError: Arg `:page` doesn't exist or improperly specified
 * @raises StateError: Arg `:block` doesn't exist or improperly specified
 */
async function getCallContext(
    slot: string,
    argsContext: ArgsContext,
    opts?: {
        config?: boolean,
    },
): Promise<ILogseqCallContext> {
    const config = opts?.config ?? true

    // @ts-expect-error
    const pageRef = typeof argsContext.page === 'string' ? argsContext.page : ''
    let contextPage: PageEntity | null = null
    if (pageRef) {
        const contextPageRef = parseReference(pageRef)!
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
    const blockRef = typeof argsContext.block === 'string' ? argsContext.block : ''
    let contextBlock: BlockEntity | null = null
    if (blockRef) {
        const contextBlockRef = parseReference(blockRef)!
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

    return {
        config: config ? await ConfigContext.get() : null,
        identity: new Context({ slot, key: slot ? slot.split('__', 2)[1].trim() : '' }),

        page: contextPage ? PageContext.createFromEntity(contextPage) : null,
        block: contextBlock ? BlockContext.createFromEntity(contextBlock) : null,
    }
}

async function assembleContext(
    callContext: ILogseqCallContext,
    currentContext: ILogseqCurrentContext,
    argsContext: ArgsContext,
): Promise<ILogseqContext> {
    return {
        mode: currentContext.mode,
        identity: callContext.identity,
        config: callContext.config,

        page: callContext.page || currentContext.currentPage,
        currentPage: currentContext.currentPage,

        block: callContext.block || currentContext.currentBlock,
        currentBlock: currentContext.currentBlock,

        args: argsContext,
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

export async function getTemplate(ref: LogseqReference, opts?: {accessedViaUI: boolean}): Promise<Template> {
    let [ templateBlock, name, accessedVia ] = await getTemplateBlock(ref)
    if (opts?.accessedViaUI)
        accessedVia = 'name'

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

async function getTemplateForSingleBlock(uuid: string): Promise<Template | null> {
    const block = await getActualBlock(uuid, {includeChildren: false})
    if (!block)
        throw new StateError(
            `[:p "There's no such block with UUID: " [:i "${uuid}"] ]`,
            {uuid},
        )

    block.children = []

    const name: string | undefined = '__this__'
    const includingParent = true
    const accessedVia: LogseqReferenceAccessType = 'block'

    const template = new Template(block, {name, includingParent, accessedVia})
    await template.init()
    if (template.isEmpty())
        return null

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
                ", specially designed for this case." ]
            [:p [:b "See details " [:a
                {:href "https://stdword.github.io/logseq13-full-house-plugin/#/alt__macros"}
                "here"]]]
        ]`,
        'error', {timeout: 30000})
    return true
}

async function handleNestedRendering(
    templateBlock: BlockEntity,
    args: string[],
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
    if (args.includes(':delay-until-rendered') && state === 'nested') {
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
 * @raises StateError: template is not instant
 * @raises StateMessage: template doesn't have any content (empty)
 */
export async function renderTemplateButtonInBlock(
    slot: string,
    uuid: string,
    templateRef: LogseqReference,
    rawCode: RendererMacro,
    args: string[],
) {
    const template = await getTemplate(templateRef)
    const handled = await handleNestedRendering(template.block, args, uuid, slot, rawCode)
    if (handled)
        return

    if (!template.instant) {
        const html = `
            <span title="Template '${template.name}' is not instant" class="warning"
                >${rawCode}</span>
        `.trim()
        provideHTML(uuid, html, slot)

        throw new StateError(
            `[:p "Template " [:i "${template.name}"] " is not instant. "
                 "Remove cursor markers from it's " [:code "template-usage::"]
                 " property in order to use it with " [:code "🏛️button"]
            ]`,
            {template},
        )
    }

    const argsContext = ArgsContext.create(`button: ${template.name}`, args)

    // here are parsing of block & page refs and checks for its existence
    const callContext = await getCallContext(slot, argsContext, {config: false})

    const title = argsContext['title'] || template.name
    const destinationUUID = callContext.block?.uuid || callContext.page?.uuid || ''
    const isPageDestination = !callContext.block?.uuid && (!!destinationUUID || argsContext['page'])

    const defaultAction = 'append'
    let action = argsContext['action']
    action = (typeof action === 'string' ? action : defaultAction).toLowerCase()
    if (!['append', 'prepend', 'replace', 'call'].includes(action)) {
        const code = html`
            <span title="Unsupported button action: '${action}'"
                  class="warning"
                >${rawCode}</span>
        `.trim()
        provideHTML(uuid, code, slot)

        throw new StateError(
            `[:p "Unsupported button action. Use one of: " [:br]
                 [:code "append"] ", " [:code "prepend"] ", "
                 [:code "replace"] ", "  [:code "call"] "."
            ]`,
            {action},
        )
    }

    if (action === 'replace' && isPageDestination) {
        const code = html`
            <span title="The 'replace' action is not available with page as destination"
                  class="warning"
                >${rawCode}</span>
        `.trim()
        provideHTML(uuid, code, slot)

        throw new StateError(
            `[:p "The " [:code "replace"] " action is not available with "
                 [:b "page"] " as destination"
            ]`,
        )
    }

    if (action === 'replace' && !destinationUUID) {
        const code = html`
            <span title="The 'replace' action is not available without destination block"
                  class="warning"
                >${rawCode}</span>
        `.trim()
        provideHTML(uuid, code, slot)

        throw new StateError(
            `[:p "The " [:code "replace"] " action is not available without destination "
                 [:b "block"]
            ]`,
        )
    }

    delete argsContext['title']
    delete argsContext['action']
    const restArgs = argsContext.toCallString()

    logseq.provideUI({
        key: `${slot}`,
        reset: true,
        slot: slot,
        template: `
            <button class="fht-button"
                data-on-click="insertTemplate"
                data-button-uuid="${uuid}"
                data-template-ref="${templateRef.original}"
                data-title="${title}"
                data-destination-uuid="${destinationUUID}"
                data-action-type="${action}"
                data-args="${restArgs}"
            >${title}</button>
        `.trim(),
    })
}

export async function handleButtonClick(
    buttonUUID: string,
    buttonTitle: string,
    templateRef: string,
    destinationUUID: string | null,
    action: string,
    args: string[],
) {
    destinationUUID = destinationUUID || buttonUUID

    const ref = parseReference(templateRef)!
    const template = await getTemplate(ref)

    const argsContext = ArgsContext.create('', args)
    if (argsContext['page'] && typeof argsContext['page'] === 'boolean') {
        // @ts-expect-error
        const name = dayjs().toPage()

        argsContext['page'] = name
        destinationUUID = ( await logseq.Editor.getPage(name) )!.uuid
    }
    args = splitMacroArgs(argsContext.toCallString())

    if (action === 'replace')
        await renderTemplateInBlockInstantly(destinationUUID, template, {args, ignoreEditingMode: true})
    else if (action === 'call')
        await renderTemplateInNewBlockInstantly(null, template, args)
    else if (action === 'append')
        await renderTemplateInNewBlockInstantly(destinationUUID, template, args, {before: false})
    else if (action === 'prepend')
        await renderTemplateInNewBlockInstantly(destinationUUID, template, args, {before: true})
}


/**
 * @raises StateError: template doesn't exist
 * @raises StateMessage: template doesn't have any content (empty)
 * @raises RenderError: template rendering error
 */
export const renderTemplateInBlock =
    lockOn( ([__, uuid, ..._]) => uuid ) (
async (
    slot: string,
    uuid: string,
    templateRef: LogseqReference,
    rawCode: RendererMacro,
    args: string[],
) => {
    const template = await getTemplate(templateRef)
    const handled = await handleNestedRendering(template.block, args, uuid, slot, rawCode)
    if (handled)
        return

    const currentContext = await getCurrentContext(uuid, 'template')
    if (!currentContext)
        return

    const result = await renderTemplate(slot, template, args, currentContext)
    const {rendered, headTail: [head, tail], context} = result

    const headProps = PropertiesUtils.getPropertiesFromString(head.content ?? '')
    Object.assign(headProps, head.properties)

    const oldContent = context.currentBlock.content!
    const toReplace = rawCode.toPattern()
    const toInsert = PropertiesUtils.deleteAllProperties(head.content ?? '')
    const newContent = oldContent.replace(toReplace, toInsert)
    if (newContent === oldContent) {
        if (oldContent.search(/\{\{\s*\w+\s*.*?\}\}/g) !== -1)
            showInsideMacroNotification()

        console.warn(p`Cannot find renderer macro to replace it`, {
            uuid, oldContent, toReplace, toInsert})
        return
    }

    const positions = getCursorPositionsInTree(rendered)
    await handleInsertion(uuid, oldContent, newContent, headProps, head.children, tail, !!positions)
    if (positions)
        await handleSetCursorPosition(
            uuid,
            template.includingParent,
            positions.cursorPath,
            positions.selectionPositions,
            oldContent.search(toReplace),
        )
})

export async function renderThisBlockAsTemplate(uuid: string) {
    const template = await getTemplateForSingleBlock(uuid)
    if (!template)
        return

    const currentContext = await getCurrentContext(uuid, 'template')
    if (!currentContext)
        return

    const result = await renderTemplate('', template, [], currentContext)
    const {rendered, headTail: [head, tail], context} = result

    const headProps = PropertiesUtils.getPropertiesFromString(head.content ?? '')
    Object.assign(headProps, head.properties)

    let oldContent = (await logseq.Editor.getEditingBlockContent()) ?? context.currentBlock.content!
    const propUUID = PropertiesUtils.getPropertyFromString(oldContent, PropertiesUtils.idProperty)
    if (propUUID)
        oldContent = PropertiesUtils.deletePropertyFromString(oldContent, PropertiesUtils.idProperty)

    if (head.content === undefined)
        return
    const newContent = PropertiesUtils.deleteAllProperties(head.content ?? '')
    if (newContent === oldContent)
        return

    const selection = getEditingCursorSelection()
    if (selection) {
        const [start] = selection
        selection.length = 0

        // try to keep cursor position

        // check left prefix
        if (
            start < oldContent.length &&
            oldContent.slice(0, start) === newContent.slice(0, start)
        )
            selection.push(start)

        // check right suffix
        const rightIndex = start - oldContent.length
        if (
            start < oldContent.length &&
            oldContent.slice(start) === newContent.slice(rightIndex)
        )
            selection.push(rightIndex)
    }

    const positions = getCursorPositionsInTree(rendered)
    await handleInsertion(
        uuid, oldContent, newContent, headProps, head.children, tail, !!positions, selection,
    )
    if (positions)
        await handleSetCursorPosition(
            uuid,
            template.includingParent,
            positions.cursorPath,
            positions.selectionPositions,
        )
}

export async function renderTemplateInBlockInstantly(
    uuid: string | null,
    template: Template,
    opts?: {
        args?: string[],
        ignoreEditingMode?: boolean,
    },
) {
    const ignoreEditingMode = opts?.ignoreEditingMode

    if (!template.instant)
        return

    const currentContext = await getCurrentContext(uuid, 'template')
    if (!currentContext)
        return

    // if args are specified — we have the possibility to specify them,
    // so no need to use default ones from template-usage::
    // otherwise if they are not specified — we don't have the possibility to specify them
    // so use default ones
    // merging args will break the meaning of template-usage::
    const args = opts?.args ? opts.args : template.args
    const result = await renderTemplate('', template, args, currentContext)
    let {rendered, headTail: [head, tail], context} = result

    const headProps = PropertiesUtils.getPropertiesFromString(head.content ?? '')
    Object.assign(headProps, head.properties)

    let oldContent = ignoreEditingMode
        ? context.currentBlock.content!
        : (await logseq.Editor.getEditingBlockContent()) ?? context.currentBlock.content!
    let newContent = head.content === undefined
        ? undefined
        : PropertiesUtils.deleteAllProperties(head.content)

    const selection = getEditingCursorSelection()
    const editingUUID = await logseq.Editor.checkEditing()
    const contentStart = (selection && !ignoreEditingMode) ? selection[0] : 0
    if (selection && !ignoreEditingMode) {
        const [start, end] = selection

        const uuid = PropertiesUtils.getPropertyFromString(oldContent, PropertiesUtils.idProperty)
        if (uuid)
            oldContent = PropertiesUtils.deletePropertyFromString(oldContent, PropertiesUtils.idProperty)

        if (newContent !== undefined) {
            selection.length = 0
            selection.push(start + newContent.length)
        }

        newContent = oldContent.slice(0, start)
            + (newContent !== undefined ? newContent : oldContent.slice(start, end))
            + oldContent.slice(end)
            + (uuid ? `\n${PropertiesUtils.idProperty}:: ${uuid}` : '')
    }

    if (!uuid)
        return

    const positions = getCursorPositionsInTree(rendered)
    await handleInsertion(
        uuid, oldContent, newContent, headProps, head.children, tail,
        !!positions, selection, editingUUID ? editingUUID as string : '',
    )
    if (positions)
        await handleSetCursorPosition(
            uuid,
            template.includingParent,
            positions.cursorPath,
            positions.selectionPositions,
            contentStart,
        )
}

export async function renderTemplateInNewBlockInstantly(
    blockOrPageUUID: string | null,
    template: Template,
    args: string[],
    opts?: {
        before: boolean,
    },
) {
    const before = opts?.before ?? false

    if (!template.instant)
        return

    let destinationBlock: BlockEntity | PageEntity | null = null
    let isPageDestination = false
    if (blockOrPageUUID) {
        destinationBlock = await logseq.Editor.getBlock(blockOrPageUUID, {includeChildren: true})
        if (!destinationBlock) {
            destinationBlock = await logseq.Editor.getPage(blockOrPageUUID)
            if (!destinationBlock)
                throw new StateError(
                    `[:p "Block or page" [:code "${blockOrPageUUID}"] " doesn't exist. "
                         "Can't find the place to insert the " [:code "🏛️template"]
                         [:i "${template.name}"] "."
                    ]`,
                    {template},
                )

            // @ts-expect-error
            destinationBlock.children = await logseq.Editor.getPageBlocksTree(blockOrPageUUID)
            isPageDestination = true
        }
    }

    const currentContext = await getCurrentContext(blockOrPageUUID, 'template')
    if (!currentContext)
        return

    const result = await renderTemplate('', template, args, currentContext)
    let {rendered, headTail: [head, tail], context} = result
    const blocks = [head, ...tail] as IBatchBlock[]

    if (!destinationBlock)
        return


    const positions = getCursorPositionsInTree(rendered)


    // handle insertion
    const selection = getEditingCursorSelection()
    const editingUUID = await logseq.Editor.checkEditing()
    if (selection)
        await logseq.Editor.exitEditingMode()

    let insertedHead: BlockEntity
    if (!destinationBlock.children?.length) {
        await insertBatchBlockAfter(destinationBlock, blocks, {keepUUID: true, sibling: false})
        if (!isPageDestination)
            insertedHead = (await logseq.Editor.getBlock(destinationBlock.uuid, {includeChildren: true}))!
                .children![0] as BlockEntity
        else
            insertedHead = (await logseq.Editor.getPageBlocksTree(destinationBlock.uuid))[0]
    }
    else {
        if (before) {
            const firstChild = destinationBlock.children![0] as BlockEntity
            await insertBatchBlockBefore(firstChild, blocks, {keepUUID: true})

            let current = firstChild
            for (let i = 0; i < blocks.length; i++)
                current = ( await logseq.Editor.getPreviousSiblingBlock(current.uuid) )!
            insertedHead = current
        }
        else {
            const lastChild = destinationBlock.children!.at(-1) as BlockEntity
            await insertBatchBlockAfter(lastChild, blocks, {keepUUID: true, sibling: true})
            insertedHead = (await logseq.Editor.getNextSiblingBlock(lastChild.uuid))!
        }
    }

    // restoring the cursor position (if need be)
    if (editingUUID && !positions) {
        await sleep(20)
        editBlockWithSelection(editingUUID as string, selection ?? [])
    }

    if (positions) {
        await sleep(20)
        await handleSetCursorPosition(
            insertedHead.uuid,
            template.includingParent,
            positions.cursorPath,
            positions.selectionPositions,
        )
    }
}

async function handleInsertion(
    uuid: string,
    oldContent: string,
    content: string | undefined,
    props: Record<string, any>,
    children: IBlockNode[],
    tail: IBlockNode[],
    setCursorWillOccur: boolean,
    newEditingCursorSelection: number[] | null = null,
    newEditingCursorBlockUUID: string = '',
) {
    // 1) inserting head's children stage

    const block = await logseq.Editor.getBlock(uuid)

    // WARNING: it is important to call `.insertBatchBlock` before `.updateBlock`
    // due to Logseq BUG on batch inserting to empty block (content == '')
    if (children && children.length)
        await insertBatchBlockAfter(
            block!, children as IBatchBlock[], { sibling: false, keepUUID: true })
        // await logseq.Editor.insertBatchBlock(
            // uuid, children as IBatchBlock[], { sibling: false, keepUUID: true })


    // 2) inserting tail trees
    if (tail.length)
        await insertBatchBlockAfter(
            block!, tail as IBatchBlock[], { sibling: true, keepUUID: true })
        // await logseq.Editor.insertBatchBlock(
        //     uuid, tail as IBatchBlock[], { sibling: true, keepUUID: true })


    // 3) updating head stage
    if (content !== undefined) {
        // WARNING: this is workaround for Logseq BUG
        //   issue: updating of currently edited block with properties, leads to properties get lost
        //   how to avoid: exit editing mode & return after updating
        if (Object.keys(props).length && newEditingCursorSelection) {
            await logseq.Editor.exitEditingMode()
            await sleep(20)
        }

        await logseq.Editor.updateBlock(uuid, content, {properties: props})

        // restoring the cursor position (if need be)
        if (newEditingCursorSelection && !setCursorWillOccur) {
            await sleep(20)
            editBlockWithSelection(newEditingCursorBlockUUID || uuid, newEditingCursorSelection)
        }
    }
}

function getCursorPositionsInTree(tree: IBlockNode) {
    let cursorPath: number[] | undefined
    let selectionPositions: number[] = []

    walkBlockTree(tree, (b, lvl, path) => {
        const data = b.data ?? {}
        if (data.selectionPositions) {
            cursorPath = Array.from(path)
            selectionPositions = data.selectionPositions
            return true
        }
        return false
    })

    if (!cursorPath)
        return null

    return { cursorPath, selectionPositions }
}

async function handleSetCursorPosition(
    uuid: string,
    templateIncludingParent: boolean,
    cursorPath: number[],
    selectionPositions: number[],
    shiftPositionForHeadBlock: number = 0,
) {
    // 1) find the appropriate block tree with block with cursor positioning

    let currentUUID = uuid  // head

    // the root of cursor block can be the head block or any block from the tail
    const headTailIndex = cursorPath.shift()!
    if (!templateIncludingParent && headTailIndex !== 0) {
        for (let i = 0; i < headTailIndex; i++) {
            const next = await logseq.Editor.getNextSiblingBlock(currentUUID)
            if (!next) {
                console.warn('(Assertion Error) Cannot find just inserted block')
                return null
            }

            currentUUID = next.uuid
        }
    }

    // 2) find the appropriate inserted block with cursor positioning

    let cursorBlockUUID: string
    // if cursor in head block — there is no need for API call
    if (currentUUID === uuid && cursorPath.length === 0)
        cursorBlockUUID = uuid
    else {
        // retrieve appropriate inserted block with all children
        const blockTree = (await logseq.Editor.getBlock(currentUUID, {includeChildren: true}))!

        // get the cursor block
        const cursorBlock = getTreeNode(blockTree as IBlockNode, cursorPath) as BlockEntity
        if (!cursorBlock) {
            console.warn('(Assertion Error) Cannot find cursor block that is exist')
            return null
        }

        cursorBlockUUID = cursorBlock.uuid
    }


    // 3) position cursor

    // cursor is positioned to head block
    if (cursorBlockUUID === uuid)
        selectionPositions = selectionPositions.map(p => shiftPositionForHeadBlock + p)

    editBlockWithSelection(cursorBlockUUID, selectionPositions)
}

export async function insertTemplateButton(destinationUUID: string, templateUUID: string) {
    const ref = parseReference(templateUUID)!
    const template = await getTemplate(ref, {accessedViaUI: true})

    let content = RendererMacro
        .command(':template-button')
        .arg(template.name)
        .arg(`:title ${template.name}`)
        .arg(`:action ${Template.carriagePositionMarker}append | prepend | replace | call${Template.carriagePositionMarker}`)
        .arg(template.usage, {raw: true})
        .toString()

    const selectionPositions = [] as number[]
    content = Template.getSelectionPositions(content, selectionPositions)

    const checked = await logseq.Editor.checkEditing()
    const isEditingState = !!checked && checked === destinationUUID
    const isSelectedState = !isEditingState

    if (isSelectedState) {
        await logseq.Editor.updateBlock(destinationUUID, content)
        editBlockWithSelection(destinationUUID, selectionPositions)
        return
    }

    const currentPosition = (await logseq.Editor.getEditingCursorPosition())!.pos
    await logseq.Editor.insertAtEditingCursor(content)
    if (selectionPositions.length === 0)
        return

    if (selectionPositions.length === 1)
        selectionPositions.push(selectionPositions[0])

    setEditingCursorSelection(
        currentPosition + selectionPositions[0],
        currentPosition + selectionPositions[1],
    )
}

export async function insertTemplate(
    templateUUID: string,
    opts?: {
        destinationUUID?: string,
        insertAs?: InsertAs,
        denyInstant?: boolean,
    }
) {
    const ref = parseReference(templateUUID)!
    const template = await getTemplate(ref, {accessedViaUI: true})

    let destinationUUID = opts?.destinationUUID ?? null
    let insertAs = opts?.insertAs
    const denyInstant = opts?.denyInstant ?? false

    if (insertAs === 'Button')
        throw new Error('(Assertion Error) Use insertTemplateButton method instead')

    if (['View', 'Template'].includes(template.label)) {
        if (insertAs && template.label !== insertAs)
            await logseq.UI.showMsg(
                `[:p "Forcing insertion as " [:code "🏛️${template.label.toLowerCase()}"]
                     " because of the " [:code "${PropertiesUtils.templateListAsProperty}::"] " property"]`,
                'warning',
                {timeout: 10000},
            )

        insertAs = template.label as InsertAs  // force
    } else
        if (!insertAs)
            insertAs = 'Template'

    const isInstantInsertion = !denyInstant && insertAs === 'Template' && template.instant

    let isSelectedState: boolean
    if (destinationUUID) {
        const uuid = await logseq.Editor.checkEditing()
        const isEditingState = !!uuid && uuid === destinationUUID
        isSelectedState = !isEditingState
    } else {
        const [blocks, isSelectedState_] = await getChosenBlocks()
        if (!blocks.length) {
            if (!isInstantInsertion) {
                logseq.UI.showMsg(
                    `[:p "Start editing block or select one to insert "
                         [:code "${insertAs}"]]`,
                    'warning',
                    {timeout: 5000},
                )
                return
            }

            destinationUUID = null
            isSelectedState = false
        }
        else
            destinationUUID = blocks[0].uuid
            isSelectedState = isSelectedState_
    }


    if (isInstantInsertion) {
        await renderTemplateInBlockInstantly(destinationUUID, template)
        return
    }

    if (!destinationUUID)
        throw new Error('destinationUUID should be empty only when isInstantInsertion is true')


    const typeToCommandMap = {
        'Template': 'template',
        'View': 'template-view',
    }
    let content = RendererMacro.command(typeToCommandMap[insertAs])
        .arg(template.name)
        .arg(template.usage, {raw: true})
        .toString()

    const selectionPositions = [] as number[]
    content = Template.getSelectionPositions(content, selectionPositions)

    if (isSelectedState) {
        await logseq.Editor.updateBlock(destinationUUID, content)
        editBlockWithSelection(destinationUUID, selectionPositions)
        return
    }

    const currentPosition = (await logseq.Editor.getEditingCursorPosition())!.pos
    await logseq.Editor.insertAtEditingCursor(content)
    if (selectionPositions.length === 0)
        return

    if (selectionPositions.length === 1)
        selectionPositions.push(selectionPositions[0])

    setEditingCursorSelection(
        currentPosition + selectionPositions[0],
        currentPosition + selectionPositions[1],
    )
}

/**
 * @raises StateError: template doesn't exist
 * @raises StateMessage: template doesn't have any content (empty)
 * @raises RenderError: template rendering error
 */
export async function renderTemplate(
    slot: string,
    template: ITemplate,
    args: string[],
    currentContext: ILogseqCurrentContext,
    argsContext?: ArgsContext,
): Promise<{rendered: IBlockNode, headTail: [IBlockNode, IBlockNode[]], context: ILogseqContext}> {
    if (!argsContext)
        argsContext = await getArgsContext(template, args)

    const context = await assembleContext(
        await getCallContext(slot, argsContext),
        currentContext,
        argsContext,
    )

    let rendered: IBlockNode
    try {
        rendered = await template.render(context)
    }
    catch (error) {
        const message = (error as Error).message
        throw new RenderError(
            `[:p "Cannot render template "
                [:i "${template.name}"] ": "
                [:pre "${escapeForHiccup(message)}"]
            ]`,
            {template, error},
        )
    }

    let head: IBlockNode
    let tail: IBlockNode[]
    if (template.includingParent)
        [ head, tail ] = [ rendered, [] ]
    else
        [ head, ...tail ] = rendered.children

    // console.debug(p`Template rendered:`, {head, tail})

    return {rendered, headTail: [head, tail], context}
}

/**
 * @raises RenderError: template rendering error
 */
export async function compileTemplateView(
    slot: string,
    template: ITemplate,
    args: string[],
    currentContext: ILogseqCurrentContext,
    argsContext?: ArgsContext,
): Promise<string> {
    if (!argsContext)
        argsContext = await getArgsContext(template, args)

    const context = await assembleContext(
        await getCallContext(slot, argsContext),
        currentContext,
        argsContext,
    )

    let rendered: IBlockNode
    try {
        rendered = await template.render(context)
        // console.debug(p`Template rendered:`, {data: rendered})
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

    let compiled = await mapBlockTree(rendered, async (b, lvl) => {
        const content = (b.content || '').toString()
        if (!content.trim())
            return ''

        return new LogseqMarkup(context).toHTML(content)
    })
    // console.debug(p`Markup compiled:`, {data: compiled})

    if (!template.includingParent && compiled.children.length === 1)
        compiled = compiled.children[0]

    const htmlFold = (node: IBlockNode, level = 0): string => {
        const children = () => node.children.map(
            (n) => htmlFold(n as IBlockNode, level + 1)
        ).join('')

        if (level === 0) {
            if (node.children.length === 0)
                return node.content!

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
    // console.debug(p`View folded:`, {view})

    return view
}

async function _renderTemplateView(
    slot: string,
    blockUUID: string,
    template: ITemplate,
    args: string[],
) {
    const currentContext = await getCurrentContext(blockUUID, 'view')
    if (!currentContext)
        return

    const view = await compileTemplateView(slot, template, args, currentContext)
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
    const handled = await handleNestedRendering(template.block, args, blockUUID, slot, rawCode)
    if (handled)
        return

    await _renderTemplateView(slot, blockUUID, template, args)
}

export async function renderView(
    slot: string,
    blockUUID: string,
    viewBody: string,
    args: string[] = [],
) {
    const template = getView(viewBody)
    await _renderTemplateView(slot, blockUUID, template, args)
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
