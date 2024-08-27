import { IBatchBlock, BlockEntity, PageEntity, BlockIdentity, EntityID } from '@logseq/libs/dist/LSPlugin.user'

import { escape, escapeForRegExp, f, indexOfNth, p, sleep } from './other'
import { isEmptyString, isInteger, isUUID, unquote } from './parsing'


export const isMacOS = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0


// source: https://gist.github.com/xyhp915/d1a6d151a99f31647a95e59cdfbf4ddc
const shortcutNamesMap = {
  'shift': ['Shift', '⇧'],
  'ctrl': ['Ctrl', '^'],
  'alt': ['Alt', '⌥'],
  'mod': ['Mod', '⌘'],
  'meta': ['Meta', '⌘'],
  'win': 'Win',

  'backspace': ['Backspace','⌫'],
  'delete': ['Del', '⌦'],
  'tab': ['Tab', '⇥'],
  'enter': ['Enter', '↩︎'],

  'insert': 'Ins',
  'context': 'Context',

  'pause': '⏸',
  'caps-lock': ['CapsLock', '⇪'],
  'esc': ['Esc', '⎋'],

  'pg-up': ['PgUp', '⇞'],
  'pg-down': ['PgDown', '⇟'],
  'end': ['End', '↘'],
  'home': ['Home', '↖'],
  'left': '←',
  'up': '↑',
  'right': '→',
  'down': '↓',
  'space': '␣',

  'semicolon': ';',
  'equals': '=',
  'dash': '-',

  'open-square-bracket': '[',
  'close-square-bracket': ']',
  'single-quote': "'",
}


export type IBlockNode = {
    content: string | void,
    children: IBlockNode[],
    properties?: Record<string, any>
    data?: {
        setUUID?: string,
        selectionPositions?: number[],
        spawnedBlocks?: IBlockNode[],
        appendedBlocks?: IBlockNode[],
        skip?: boolean,
        skipChildren?: boolean,
    },
}


export function humanizeShortcut(shortcut: string) {
    function get(sh) {
        const display = shortcutNamesMap[sh]
        if (!display)
            return sh
        if (typeof display === 'string')
            return display
        if (isMacOS)
            return display[1]
        return display[0]
    }

    if (!shortcut)
        return null

    return shortcut
        .split(' ')
        .map(
            (s) => s.split('+').map(get).join(isMacOS ? '' : '+')
        )
}

export async function mapBlockTree(
    root: IBlockNode,
    callback: (b: IBlockNode, lvl: number, data?: any) => Promise<string | void>,
    level: number = 0,
): Promise<IBlockNode> {
    const data = root.data ?? {}
    const content = await callback(root, level, data)

    const children = [] as IBlockNode[]
    for (let child of root.children)
        children.push(
            await mapBlockTree(child, callback, level + 1)
        )

    return { data, content, children }
}

export async function filterBlockTree(
    root: IBlockNode,
    criteria: (b: IBlockNode, lvl: number, filteredChildren: (IBlockNode | null)[]) => Promise<boolean>,
    level: number = 0,
): Promise<IBlockNode | null> {
    if (!root.children.length) {
        const flag = await criteria(root, level, [])
        if (flag)
            return root
        return null
    }

    const children = [] as (IBlockNode | null)[]
    for (const child of root.children)
        children.push(
            await filterBlockTree(child, criteria, level + 1)
        )
    const flag = await criteria(root, level, children)
    if (flag) {
        root.children = children.filter((n) => !!n)
        return root
    }
    return null
}

export async function walkBlockTreeAsync(
    root: IBlockNode,
    callback: (b: IBlockNode, lvl: number, path: number[]) => Promise<void>,
    level: number = 0,
    path: number[] = [],
): Promise<void> {
    path = path.length !== 0 ? path : []
    await callback(root, level, path)

    await Promise.all(
        (root.children ?? []).map(async (b, i) => {
            const childPath = Array.from(path)
            childPath.push(i)
            return await walkBlockTreeAsync(b, callback, level + 1, childPath)
        })
    )
}

export function walkBlockTree(
    root: IBlockNode,
    callback: (b: IBlockNode, lvl: number, path: number[]) => boolean | void,
    level: number = 0,
    path: number[] = [],
): boolean | void {
    path = path.length !== 0 ? path : []
    const stop = callback(root, level, path)
    if (stop)
        return stop

    for (const [i, node] of (root.children ?? []).entries()) {
        const childPath = Array.from(path)
        childPath.push(i)
        const stop = walkBlockTree(node, callback, level + 1, childPath)
        if (stop)
            return stop
    }
}


export function getTreeNode(root: IBlockNode, path: number[]): IBlockNode | null {
    path = Array.from(path)
    let node = root
    while (path.length) {
        const index = path.shift()!
        const children = node.children ?? []
        if (index < 0 || index >= children.length)
            return null

        node = children[index]
    }
    return node
}

export function insertTreeNodes(root: IBlockNode, path: number[], nodes: IBlockNode[]): boolean {
    if (!path.length)
        return false

    const parent = getTreeNode(root, path.slice(0, -1))
    if (!parent)
        return false

    parent.children.splice(path.at(-1)! + 1, 0, ...nodes)
    return true
}

/**
 * @returns pair [[BlockEntity obj], false] in case of currently editing block
 * @returns pair [[BlockEntity objs], true] in case of selected block (outside of editing mode)
 * @returns pair [[], false] in case of none of the blocks are selected (outside of editing mode)
 */
export async function getChosenBlocks(): Promise<[BlockEntity[], boolean]> {
    const selected = await logseq.Editor.getSelectedBlocks()
    if (selected)
        return [selected, true]

    const uuid = await logseq.Editor.checkEditing()
    if (!uuid)
        return [[], false]

    const editingBlock = await logseq.Editor.getBlock(uuid as string) as BlockEntity

    // to get ahead of Logseq block content saving process
    editingBlock.content = await logseq.Editor.getEditingBlockContent()

    return [ [editingBlock], false ]
}

export async function insertContent(
    content: string,
    options: {
        positionOnArg?: number,
        positionOnNthText?: {count: number, text: string},
        positionBeforeText?: string,
        positionAfterText?: string,
        positionIndex?: number
    } = {},
): Promise<boolean> {
    // Bug-or-feature with Command Palette modal: Logseq exits editing state when modal appears
    // To handle this: use selected blocks — the editing block turns to selected

    const [ blocks, isSelectedState ] = await getChosenBlocks()
    if (!blocks.length) {
        console.warn(p`Attempt to insert content while not in editing state and no one block is selected`)
        return false
    }
    const uuid = blocks[0].uuid

    const { positionOnArg, positionOnNthText, positionBeforeText, positionAfterText, positionIndex } = options
    let position: number | undefined
    if (positionOnNthText) {
        const { text, count } = positionOnNthText
        position = indexOfNth(content, text, count) ?? content.length
    }
    else if (positionOnArg) {
        let index = indexOfNth(content, ',', positionOnArg)
        if (!index)  // fallback to first arg
            index = indexOfNth(content, ',', 1)
        if (!index)  // no args at all
            index = content.length
        else
            index++ // shift 1 char from «,»

        // consume spaces
        while (/\s/.test(content[index]))
            index++

        position = index
    }
    else if (positionBeforeText) {
        const index = content.indexOf(positionBeforeText)
        if (index !== -1)
            position = index
    }
    else if (positionAfterText) {
        const index = content.indexOf(positionAfterText)
        if (index !== -1)
            position = index + positionAfterText.length
    }
    else if (positionIndex) {
        const adjustedIndex = adjustIndexForLength(positionIndex, content.length)
        if (adjustedIndex < content.length)  // skip adjustedIndex == content.length
            position = adjustedIndex
    }

    if (isSelectedState) {
        await logseq.Editor.updateBlock(uuid, content)
        if (position !== undefined)
            await logseq.Editor.editBlock(uuid, { pos: position })
    } else {
        await logseq.Editor.insertAtEditingCursor(content)

        if (position !== undefined) {
            // need delay before getting cursor position
            await sleep(20)
            const posInfo = await logseq.Editor.getEditingCursorPosition()

            const relativePosition = posInfo!.pos - content.length + position
            console.debug(
                p`Calculating arg position`,
                posInfo!.pos, '-', content.length, '+', position, '===', relativePosition,
            )

            // try non-API way
            const done = setEditingCursorPosition(relativePosition)
            if (!done) {
                // API way: need to exit to perform entering on certain position
                await logseq.Editor.exitEditingMode()
                await sleep(20)

                await logseq.Editor.editBlock(uuid, { pos: relativePosition })
            }
        }
    }

    return true
}

/**
 * Sets the current editing block cursor position.
 * There is no need to check boundaries.
 * Negative indexing is supported.
 *
 * @param `pos`: new cursor position
 * @usage
 *  setEditingCursorPosition(0) — set to the start
 *  setEditingCursorPosition(-1) — set to the end
 *  setEditingCursorPosition(-2) — set before the last char
 */
export function setEditingCursorPosition(pos: number) {
    return setEditingCursorSelection(pos, pos)
}

function adjustIndexForLength(i, len) {
    if (typeof i !== 'number')
        return null

    if (i > len)
        i = len
    if (i < (-len - 1))
        i = -len - 1
    if (i < 0)
        i += len + 1
    return i
}

export function setEditingCursorSelection(start: number, end: number) {
    const editorElement = top!.document.getElementsByClassName('editor-wrapper')[0] as HTMLDivElement
    if (!editorElement)
        return false
    const textAreaElement = top!.document.getElementById(
        editorElement.id.replace(/^editor-/, '')
    ) as HTMLTextAreaElement
    if (!textAreaElement)
        return false

    const length = textAreaElement.value.length
    start = adjustIndexForLength(start, length)
    end = adjustIndexForLength(end, length) ?? start

    textAreaElement.selectionStart = start
    textAreaElement.selectionEnd = end
    return true
}

export function getEditingCursorSelection() {
    const editorElement = top!.document.getElementsByClassName('editor-wrapper')[0] as HTMLDivElement
    if (!editorElement)
        return null

    const textAreaElement = top!.document.getElementById(
        editorElement.id.replace(/^editor-/, '')
    ) as HTMLTextAreaElement
    if (!textAreaElement)
        return null

    return [textAreaElement.selectionStart, textAreaElement.selectionEnd]
}

export async function editBlockWithSelection(uuid: string, selectionPositions: number[]) {
    if (selectionPositions.length === 0)
        return

    const checked = await logseq.Editor.checkEditing()
    if (checked && checked === uuid) {
        setEditingCursorSelection(...selectionPositions as [number, number])
        return
    }

    if (selectionPositions.length === 1 || selectionPositions[0] === selectionPositions[1]) {
        await logseq.Editor.editBlock(uuid, { pos: selectionPositions[0] })
    }
    else {
        await logseq.Editor.editBlock(uuid, { pos: selectionPositions[0] })
        await sleep(20)
        setEditingCursorSelection(...selectionPositions as [number, number])
    }
}


export type LogseqReference = {
    type:
        'page'   |  // [[text]]
        'tag'    |  // #text or #[[text]]
        'block'  |  // ((uuid))
        'block?' |  // ((text))
        'uuid'   |  // uuid: page, block or smth else
        'name'   |  // text
        'id',       // int
    value: string | number,
    original: string,
    option: string,
}
export type LogseqReferenceAccessType = 'page' | 'block' | 'name'

export function parseReference(ref: string): LogseqReference | null {
    ref = ref.trim()
    if (ref === '')
        return null

    let type_  = 'name'
    let value: string | number = ref
    let option = ''

    const first = value[0]
    if (value.length > 1 && ['+', '-'].includes(first)) {
        // escaping to handle case: reference pages started with + or -
        if (!value.startsWith(first.repeat(2))) {
            option = first
            value = value.slice(1).trim()
        }
    }

    if (value.startsWith('[[') && value.endsWith(']]')) {
        type_ = 'page'
        value = value.slice(2, -2)
    }
    else if (value.startsWith('#')) {
        type_ = 'tag'
        value = value.slice(1)

        if (value.startsWith('[[') && value.endsWith(']]'))
            value = value.slice(2, -2)
    }
    else if (value.startsWith('((') && value.endsWith('))')) {
        type_ = 'block'
        value = value.slice(2, -2)
        if (!isUUID(value))
            type_ = 'block?'
    }
    else if (isUUID(value))
        type_ = 'uuid'
    else if (isInteger(value)) {
        type_ = 'id'
        value = Number(value)
    }

    if (type_ != 'id')
        value = (value as string).trim()

    return { type: type_, value, option, original: ref } as LogseqReference
}

export async function getPage(ref: LogseqReference): Promise<PageEntity | null> {
    if (['block', 'block?'].includes(ref.type))
        return null

    return await logseq.Editor.getPage(ref.value)
}

export async function getBlock(
    ref: LogseqReference, {
    byProperty = '',
    includeChildren = false }: { byProperty?: string, includeChildren?: boolean }
): Promise<[BlockEntity | null, LogseqReferenceAccessType]> {
    if (['page', 'tag'].includes(ref.type))
        return [ null, 'page' ]

    if (['name', 'block?'].includes(ref.type)) {
        byProperty = byProperty.trim().toLowerCase()
        if (byProperty.startsWith(':'))
            byProperty = byProperty.slice(1)

        if (!byProperty)
            return [ null, 'name' ]

        const name = escape(ref.value.toString(), ['"'])

        const query = `
            [:find (pull ?b [*])
             :where
                [?b :block/properties ?props]
                [?b :block/page]
                [(get ?props :${byProperty}) ?name]
                [(= ?name "${name}")]
            ]
        `.trim()

        const ret = await logseq.DB.datascriptQuery(query)
        if (!ret || ret.length === 0)
            return [ null, 'name' ]

        const results = ret.flat()
        if (results.length > 1)
            console.info(
                p`Found multiple blocks with property "${byProperty}:: ${ref.value}". Taken first`,
                {results},
            )

        if (!includeChildren)
            return [ results[0], 'name' ]

        return [
            await getActualBlock(results[0].uuid, {includeChildren: true}),
            'name',
        ]
    }

    if (typeof ref.value === 'number')
        return [
            await logseq.Editor.getBlock(ref.value, {includeChildren}),
            'block',
        ]

    return [
        await getActualBlock(ref.value as string, {includeChildren}),
        'block',
    ]
 }

export async function getActualBlock(uuid: string, opts?: {includeChildren?: boolean }) {
    const includeChildren = opts?.includeChildren ?? false

    const block = await logseq.Editor.getBlock(uuid, {includeChildren})
    if (!block)
        return null

    const checked = await logseq.Editor.checkEditing()
    if (checked && checked === uuid)
        block.content = await logseq.Editor.getEditingBlockContent()

    return block
}

export async function getPageFirstBlock(
    ref: LogseqReference,
    opts: { includeChildren?: boolean } = { includeChildren: false }
): Promise<BlockEntity | null> {
    if (!['page', 'tag', 'uuid', 'id'].includes(ref.type))
        return null

    let idValue = ref.value.toString().toLowerCase()
    if (ref.type !== 'id') {
        idValue = escape(idValue, ['"'])
        idValue = `"${idValue}"`
    }

    let idField = ':block/name'
    if (ref.type === 'uuid')
        idField = ':block/uuid'
    else if (ref.type === 'id')
        idField = ':db/id'

    const includeChildren = opts.includeChildren
    const query = `
        [:find (pull ?b [:db/id])
         :where
            [?b :block/page ?p]
            [?b :block/parent ?p]
            [?b :block/left ?p]
            [?p ${idField} ${idValue}]
        ]
    `.trim()
    const ret = await logseq.DB.datascriptQuery(query)
    if (!ret || ret.length === 0)
        return null

    const block = ret.flat()[0]
    return await logseq.Editor.getBlock(block.id, {includeChildren})
}

export function escapeMacroArg(
    arg: string, opts = {
    quote: true,
    escape: true,
}): string {
    let needQuote = false
    if (opts.quote && arg.includes(',') && !(arg.startsWith('"') && arg.endsWith('"')))
        needQuote = true

    if (opts.escape) {
        // To deal with XSS: escape dangerous (for datascript raw queries) chars
        const escapeMap = {
            '"': '\\"',
        }

        const chars = Object.keys(escapeMap).join('')
        arg = arg.replaceAll(new RegExp(`[${chars}]`, 'g'), (ch) => escapeMap[ch])
    }

    if (needQuote)
        arg = `"${arg}"`

    return arg
}
export function cleanMacroArg(
    arg: string | null | undefined, opts = {
    escape: true,
    unquote: false,
}): string {
    arg ??= ''
    arg = arg.trim()

    if (arg.includes(',') && arg.startsWith('"') && arg.endsWith('"')) {
        // «"» was used to escape «,» in logseq, so trim them
        arg = arg.slice(1, -1)
    } else if (opts.unquote)
        arg = unquote(arg, '""')

    if (!opts.escape)
        return arg

    return escapeMacroArg(arg, {quote: false, escape: true})
}
export function splitMacroArgs(args: string) {
    // source: https://stackoverflow.com/a/53774647
    return args
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((arg) => arg.trim())
        .map((arg) => cleanMacroArg(arg, {escape: false, unquote: false}))
}

type LogseqProperty = { name: string, text: string, refs: string[] }

export type Properties     = {[index: string]: string  }
export type PropertiesRefs = {[index: string]: string[]}

export class PropertiesUtils {
    // list of built-in properties:
    //   https://github.com/logseq/logseq/blob/master/deps/graph-parser/src/logseq/graph_parser/property.cljs

    static readonly idProperty = 'id'
    static readonly titleProperty = 'title'
    static readonly filtersProperty = 'filters'
    static readonly templateProperty = 'template'
    static readonly templateListAsProperty = 'template-list-as'
    static readonly templateUsageProperty = 'template-usage'
    static readonly templateShortcutProperty = 'template-shortcut'
    static readonly templateIncludingParentProperty = 'template-including-parent'

    static propertyContentFormat = f`\n?^[^\\S]*${'name'}::(.*)$`
    static propertyRestrictedChars = '\\s:;,^@#~"`/|\\(){}[\\]'

    static toCamelCase(text: string): string {
        text = text.toLowerCase()
        text = text.replaceAll(/(?<=-)(\w)/g, (m, ch) => ch.toUpperCase())
        text = text.replaceAll(/(?<=_)(\w)/g, (m, ch) => ch.toUpperCase())
        text = text.replaceAll('-', '')
        text = text.replaceAll('_', '')
        if (text)
            text = text[0].toLowerCase() + text.slice(1)
        return text
    }
    static fromCamelCase(text: string): string {
        return text.replaceAll(
            /\p{Uppercase_Letter}\p{Lowercase_Letter}/gu,
            (m) => '-' + m.toLowerCase(),
        )
    }
    static fromCamelCaseAll(properties: Record<string, any> | undefined) {
        return Object.fromEntries(
            Object.entries(properties ?? {})
                .map(([k, v]) => [PropertiesUtils.fromCamelCase(k), v])
        )
    }

    static getProperty(obj: BlockEntity | PageEntity, name: string): LogseqProperty {
        const nameCamelCased = PropertiesUtils.toCamelCase(name)

        let refs: string[] = []
        if (obj.properties) {
            const val = obj.properties[nameCamelCased] ?? obj.properties[name]
            refs = Array.isArray(val) ? val : []
        }

        let text: string = ''
        const textContainer = obj.propertiesTextValues || obj['properties-text-values']
        if (textContainer)
            text = textContainer[nameCamelCased] ?? textContainer[name] ?? ''

        return {
            name: nameCamelCased,
            text,
            refs,
        }
    }
    static hasProperty(blockContent: string, name: string): boolean {
        // case when properties in content use different style of naming
        //   logseq-prop-name
        //   logseq_prop_name
        //   logseq_prop-name
        // all this names is the same for logseq
        for (const n of [name, name.replaceAll('-', '_'), name.replaceAll('_', '-')]) {
            const propRegexp = PropertiesUtils.propertyContentFormat({name: n})
            const exists = new RegExp(propRegexp, 'gim').test(blockContent)
            if (exists)
                return true
        }
        return false
    }
    static deleteProperty(block: BlockEntity, name: string): void {
        const nameCamelCased = PropertiesUtils.toCamelCase(name)

        if (block.properties)
            delete block.properties[nameCamelCased]
        if (block.propertiesTextValues)
            delete block.propertiesTextValues[nameCamelCased]

        block.content = PropertiesUtils.deletePropertyFromString(block.content, name)
    }
    static deletePropertyFromString(content: string, name: string): string {
        // case when properties in content use different style of naming
        //   logseq-prop-name
        //   logseq_prop_name
        //   logseq_prop-name
        // all this names is the same for logseq → we should erase all
        for (const n of [name, name.replaceAll('-', '_'), name.replaceAll('_', '-')]) {
            const propRegexp = PropertiesUtils.propertyContentFormat({name: n})
            content = content.replaceAll(new RegExp(propRegexp, 'gim'), '')
        }
        return content
    }
    static deleteAllProperties(content: string): string {
        for (const name of PropertiesUtils.getPropertyNames(content))
            content = PropertiesUtils.deletePropertyFromString(content, name)
        return content
    }
    static getPropertyNames(text: string): string[] {
        const propertyNames: string[] = []
        const propertyLine = new RegExp(PropertiesUtils.propertyContentFormat({
            name: `([^${PropertiesUtils.propertyRestrictedChars}]+)`
        }), 'gim')
        text.replaceAll(propertyLine, (m, name) => {propertyNames.push(name); return m})
        return propertyNames
    }
    static getProperties(obj: BlockEntity | PageEntity, prefixedWith: string = '') {
        if (prefixedWith) {
            if (!prefixedWith.endsWith('-'))
                throw new Error('Dash at the end is required to be a property prefix')
        }
        const prefixReal = prefixedWith
        const prefixCamel = PropertiesUtils.toCamelCase(prefixedWith)

        const values: Properties = {}
        const refs: PropertiesRefs = {}

        const names = !!obj.content
            ? PropertiesUtils.getPropertyNames(obj.content as string)
            : Object.keys(obj.properties ?? {})

        for (const name of names) {
            const p = PropertiesUtils.getProperty(obj, name)

            let prefixed = !prefixedWith
            if (!prefixed) {
                if (name.startsWith(prefixReal))
                    prefixed = true
                else if (p.name.startsWith(prefixCamel)) {
                    const nextLetter: string = p.name[prefixCamel.length]
                    if (nextLetter.toUpperCase() === nextLetter)
                        prefixed = true
                }
            }

            if (prefixed) {
                values[name] = values[p.name] = p.text
                refs[name] = refs[p.name] = p.refs
            }
        }

        return {values, refs}
    }
    static getPropertyFromString(text: string, name: string): string | null {
        for (const n of [name, name.replaceAll('-', '_'), name.replaceAll('_', '-')]) {
            const propRegexp = new RegExp(PropertiesUtils.propertyContentFormat({name: n}), 'gim')
            const m = propRegexp.exec(text)
            if (m)
                return m[1]
        }
        return null
    }
    static getPropertiesFromString(text: string): Record<string, any> {
        const props: Record<string, any> = {}
        const propertyLine = new RegExp(PropertiesUtils.propertyContentFormat({
            name: `([^${PropertiesUtils.propertyRestrictedChars}]+)`
        }), 'gim')
        text.replaceAll(propertyLine, (m, name, value) => {props[name] = value.trim(); return m})
        return props
    }
}


export class Macro {
    public type: string
    public arguments: string[]

    constructor(type: string) {
        this.type = type
        this.arguments = []
    }
    clone() {
        return Object.assign(
            Object.create(Object.getPrototypeOf(this)),
            structuredClone(this),
        )
    }
    arg(value: string, opts: {raw: boolean} = {raw: false}) {
        value = value ?? ''
        if (!value)
            return this

        if (!opts.raw)
            value = escapeMacroArg(value, {quote: true, escape: false})

        const obj = this.clone()
        obj.arguments.push(value)
        return obj
    }
    args(values: string[], opts: {raw: boolean} = {raw: false}) {
        values = values ?? []
        if (!values.length)
            return this

        if (!opts.raw)
            values = values.map((value) => {
                return escapeMacroArg(value, {quote: true, escape: false})
            })

        const obj = this.clone()
        obj.arguments.push(...values)
        return obj
    }
    _prepareArguments(): string {
        const fill = this.arguments.length ? ' ' : ''
        return fill + this.arguments.map(a => a.toString()).join(', ')
    }
    toString(): string {
        const args = this._prepareArguments()
        return `{{${this.type}${args}}}`
    }
    _prepareArgumentsPattern(): string {
        return this.arguments.map(a => escapeForRegExp(a.toString())).join(',\\s*')
    }
    toPattern(): RegExp {
        const argsPattern = this._prepareArgumentsPattern()
        return new RegExp(`\\{\\{${this.type}\\s*` + argsPattern + '\\s*\\}\\}', 'u')
    }
 }

export class RendererMacro extends Macro {
    static command(name: string): RendererMacro {
        return new RendererMacro(name)
    }

    constructor(name: string) {
        super('renderer')

        name = name.trim()
        if (name.startsWith(':'))
            name = name.slice(1)
        name = name.toLowerCase().trim()

        this.arguments.push(name)
    }
    _prepareArguments(): string {
        const args = super._prepareArguments().trimStart()
        const fill = this.arguments.length ? ' :' : ''
        return fill + args
    }
    _prepareArgumentsPattern(): string {
        const pattern = super._prepareArgumentsPattern()
        return ':?' + pattern
    }
    get name(): string {
        return this.arguments[0]
    }
 }

export async function isRecursiveOrNestedTemplate(
    blockID: BlockIdentity | EntityID,
    templateID: EntityID,
): Promise<'recursive' | 'nested' | null> {
    if (!blockID)
        return null

    const block = await logseq.Editor.getBlock(blockID)
    if (!block)
        return null

    if (block.id === templateID)
        return 'recursive'

    const isInsideTemplate =
        block.properties &&
        block.properties[PropertiesUtils.templateProperty] !== undefined

    const parentResult =
        block.parent.id !== block.page.id
        ? await isRecursiveOrNestedTemplate(block.parent.id, templateID)
        : null

    if (parentResult === 'recursive')
        return 'recursive'
    if (parentResult === 'nested')
        return 'nested'

    // parentResult === null
    return isInsideTemplate ? 'nested' : null
 }

/**
 * Given real page name or one of it's alias (empty pages) return a real page name
 **/
export async function resolvePageAliases(ref: string): Promise<string | null> {
    const query = `
        [:find (pull ?pa [:block/name])
         :where
            [?p :block/name "${ref.toLowerCase()}"]
            (or-join [?p ?pa]
                [?p :block/alias ?pa]
                [?pa :block/alias ?p]
                (and
                    [?p :block/alias ?pb]
                    [?pb :block/alias ?pa]
                )
                (and
                    [?pa :block/alias ?pb]
                    [?pb :block/alias ?p]
                )
            )
            [?b :block/parent ?pa]
         ]
    `.trim()
    const ret = await logseq.DB.datascriptQuery(query)
    if (!ret || ret.length === 0)
        return null

    return ret.flat()[0].name
}

export function filterOutChildBlocks(blocks: BlockEntity[]): BlockEntity[] {
    const filtered: BlockEntity[] = []

    const uuids: string[] = []
    for (const block of blocks) {
        if (uuids.includes(block.uuid))
            continue

        walkBlockTree(block as IBlockNode, (b, level) => {
            const block = b as BlockEntity
            if (!uuids.includes(block.uuid))
                uuids.push(block.uuid)
        })

        filtered.push(block)
    }

    return filtered
}

export function findPropertyInTree(tree: IBlockNode, propertyName: string): IBlockNode[] {
    const found: IBlockNode[] = []
    walkBlockTree(tree, (node, level) => {
        if (PropertiesUtils.hasProperty(node.content ?? '', propertyName))
            found.push(node)
    })
    return found
}

export async function findBlockReferences(uuid: string): Promise<Number[]> {
    const results = await logseq.DB.datascriptQuery(`
        [:find (pull ?b [:db/id])
         :where
            [?b :block/content ?c]
            [(clojure.string/includes? ?c "((${uuid}))")]
        ]`)
    if (!results)
        return []
    return results.flat().map((item) => item.id)
}

export async function getBlocksWithReferences(root: BlockEntity): Promise<BlockEntity[]> {
    const blocksWithPersistedID = findPropertyInTree(root as IBlockNode, PropertiesUtils.idProperty)
    const blocksAndItsReferences = (await Promise.all(
        blocksWithPersistedID.map(async (b): Promise<[BlockEntity, Number[]]> => {
            const block = b as BlockEntity
            const references = await findBlockReferences(block.uuid)
            return [block, references]
        })
    ))
    const blocksWithReferences = blocksAndItsReferences.filter(([b, rs]) => (rs.length !== 0))
    return blocksWithReferences.map(([b, rs]) => {
        b._references = rs
        return b
    })
}

/**
 * Reason: logseq bug — `before: true` doesn't work for batch inserting
 */
export async function insertBatchBlockBefore(
    srcBlock: BlockEntity,
    blocks: IBatchBlock | IBatchBlock[],
    opts?: Partial<{
        keepUUID: boolean;
    }>
) {
    // logseq bug: two space cut off from 2, 3, ... lines of all inserting blocks
    //    so add fake two spaces to every line
    // issue: https://github.com/logseq/logseq/issues/10730
    let tree = blocks
    if (Array.isArray(blocks))
        tree = {content: '', children: blocks}
    walkBlockTree(tree as IBlockNode, (b, level) => {
        b.content = (b.content ?? '').trim().replaceAll(/\n^/gm, '\n  ')})

    // first block in a page
    if (srcBlock.left.id === srcBlock.page.id) {
        // there is bug with first block in page: use pseudo block
        // issue: https://github.com/logseq/logseq/issues/10871
        const first = ( await logseq.Editor.insertBlock(
            srcBlock.uuid, 'ø', {before: true, sibling: true}) )!
        const result = await logseq.Editor.insertBatchBlock(
            first.uuid, blocks, {before: false, sibling: true, ...opts})
        await logseq.Editor.removeBlock(first.uuid)
        return result
    }

    const prev = await logseq.Editor.getPreviousSiblingBlock(srcBlock.uuid)
    if (prev) {
        // special handling for numbering
        // issue: https://github.com/logseq/logseq/issues/10729
        let numbering = undefined
        let properties = {}
        if (prev.properties) {
            numbering = prev.properties[PropertiesUtils.numberingProperty]
            delete prev.properties[PropertiesUtils.numberingProperty]
            properties = PropertiesUtils.fromCamelCaseAll(prev.properties)
        }
        if (numbering)
            await logseq.Editor.removeBlockProperty(prev.uuid, PropertiesUtils.numberingProperty_)

        const inserted = await logseq.Editor.insertBatchBlock(
            prev.uuid, blocks, {before: false, sibling: true, ...opts})

        if (numbering)
            await logseq.Editor.upsertBlockProperty(prev.uuid, PropertiesUtils.numberingProperty_, numbering)

        return inserted
    }

    // first block for parent
    const parent = ( await logseq.Editor.getBlock(srcBlock.parent.id) )!

    // special handling for numbering
    // issue: https://github.com/logseq/logseq/issues/10729
    let numbering = undefined
    let properties = {}
    if (parent.properties) {
        numbering = parent.properties[PropertiesUtils.numberingProperty]
        delete parent.properties[PropertiesUtils.numberingProperty]
        properties = PropertiesUtils.fromCamelCaseAll(parent.properties)
    }
    if (numbering)
        await logseq.Editor.removeBlockProperty(parent.uuid, PropertiesUtils.numberingProperty_)

    const inserted = await logseq.Editor.insertBatchBlock(
        parent.uuid, blocks, {before: true, sibling: false, ...opts})

    if (numbering)
        await logseq.Editor.upsertBlockProperty(parent.uuid, PropertiesUtils.numberingProperty_, numbering)

    return inserted
}
