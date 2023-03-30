import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { f, indexOfNth, p, sleep } from './other'
import { isEmptyString, isInteger, isUUID, unquote } from './parsing'


export type IBlockNode = { content: string, children: IBlockNode[] }

export async function walkBlockTree(
    root: IBatchBlock,
    callback: (b: IBatchBlock, lvl: number) => Promise<string | void>,
    level: number = 0,
): Promise<IBlockNode> {
    return {
        content: (await callback(root, level)) ?? '',
        children: await Promise.all(
            (root.children || []).map(
                async (b) => await walkBlockTree(b as IBlockNode, callback, level + 1)
        ))
    }
 }

export async function insertContent(
    content: string,
    options: { positionOnArg?: number, positionOnText?: string } = {},
): Promise<boolean> {
    // Bug-or-feature with Command Palette modal: Logseq exits editing state when modal appears
    // To handle this: use selected blocks — the editing block turns to selected

    const selected = (await logseq.Editor.getSelectedBlocks()) ?? []
    const editing = await logseq.Editor.checkEditing()
    if (!editing && selected.length === 0) {
        console.warn(p`Attempt to insert content while not in editing state and no one block is selected`)
        return false
    }

    // TODO: logseq needs API to set selection in editing state
    // to implement feature like sublime text snippets: placeholders switched by TAB
    // text ${1:arg1} snippet ${2:arg2}

    const { positionOnArg, positionOnText } = options

    let position = 0
    if (positionOnArg) {
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
    else if (positionOnText)
        position = content.indexOf(positionOnText)

    const isSelectedState = selected.length !== 0
    const uuid = isSelectedState ? selected[0].uuid : editing as string

    if (isSelectedState) {
        await logseq.Editor.updateBlock(uuid, content)
        await logseq.Editor.editBlock(uuid, { pos: position })
    } else {
        await logseq.Editor.insertAtEditingCursor(content)

        // need delay before getting cursor position
        await sleep(20)
        const posInfo = await logseq.Editor.getEditingCursorPosition()

        const relativePosition = posInfo!.pos - content.length + position
        console.debug(
            p`Calculating arg position`,
            posInfo!.pos, '-', content.length, '+', position, '===', relativePosition,
        )

        // need to exit to perform entering on certain position
        await logseq.Editor.exitEditingMode()
        await sleep(20)
        await logseq.Editor.editBlock(uuid, { pos: relativePosition })
    }

    return true
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

    if (value.length > 1 && '+-'.indexOf(value[0]) >= 0) {
        const first = value[0]

        // escaping to reference pages started with + or -
        if (!value.startsWith(option.repeat(2))) {
            option = first
            value = value.slice(1)
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

        const query = `
            [:find (pull ?b [*])
             :where
                [?b :block/properties ?props]
                [(get ?props :${byProperty}) ?name]
                [(= ?name "${ref.value}")]
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
            await logseq.Editor.getBlock(
                results[0].id,
                {includeChildren: true},
            ) as BlockEntity,
            'name',
        ]
    }

    return [
        await logseq.Editor.getBlock(ref.value, {includeChildren}),
        'block',
    ]
 }

export async function getPageFirstBlock(
    ref: LogseqReference,
    { includeChildren = false }: { includeChildren?: boolean }
): Promise<BlockEntity | null> {
    if (!['page', 'tag', 'name', 'uuid', 'id'].includes(ref.type))
        return null

    let idField = ':block/name'
    let idValue = `"${ref.value}"`
    if (ref.type === 'uuid')
        idField = ':block/uuid'
    else if (ref.type === 'id') {
        idField = ':db/id'
        idValue = ref.value.toString()
    }

    const query = `
        [:find (pull ?b [${includeChildren ? ':db/id' : '*'}])
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
    if (!includeChildren)
        return block

    return await logseq.Editor.getBlock(block.id, {includeChildren: true})
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

    // To deal with XSS: escape dangerous (for datascript raw queries) chars
    const escapeMap = {
        '"': '\\"',
    }

    const chars = Object.keys(escapeMap).join('')
    arg = arg.replaceAll(new RegExp(`[${chars}]`, 'g'), (ch) => escapeMap[ch])
    return arg
 }


type LogseqProperty = { name: string, text: string, refs: string[] }

export type Properties     = {[index: string]: string  }
export type PropertiesRefs = {[index: string]: string[]}

export class PropertiesUtils {
    // TODO?: org-mode properties
    // TODO?: front-matter properties

    // list of built-in properties:
    //   https://github.com/logseq/logseq/blob/master/deps/graph-parser/src/logseq/graph_parser/property.cljs

    static readonly idProperty = 'id'
    static readonly titleProperty = 'title'
    static readonly templateProperty = 'template'
    static readonly includingParentProperty = 'template-including-parent'

    static propertyContentFormat = f`\n?^[^\\S]*${'name'}::.*$`
    static propertyRestrictedChars = '\\s:;,^@#~"`/|\\(){}[\\]'

    static toCamelCase(text: string): string {
        text = text.toLowerCase()
        text = text.replaceAll(/(?<=-)(\w)/g, (m, ch) => ch.toUpperCase())
        text = text.replaceAll(/(?<=_)(\w)/g, (m, ch) => ch.toUpperCase())
        text = text.replaceAll('-', '')
        text = text.replaceAll('_', '')
        text = text[0].toLowerCase() + text.slice(1)
        return text
    }

    static getProperty(obj: BlockEntity | PageEntity, name: string): LogseqProperty {
        const nameCamelCased = PropertiesUtils.toCamelCase(name)

        let refs: string[] = []
        if (obj.properties) {
            const val = obj.properties[nameCamelCased]
            refs = Array.isArray(val) ? val : []
        }

        let text: string = ''
        if (obj.propertiesTextValues)
            text = obj.propertiesTextValues[nameCamelCased] ?? ''

        return {
            name: nameCamelCased,
            text,
            refs,
        }
    }
    static deleteProperty(block: BlockEntity, name: string): void {
        const nameCamelCased = PropertiesUtils.toCamelCase(name)

        if (block.properties)
            delete block.properties[nameCamelCased]
        if (block.propertiesTextValues)
            delete block.propertiesTextValues[nameCamelCased]

        // case when properties in content use different style of naming
        //   logseq-prop-name
        //   logseq_prop_name
        //   logseq_prop-name
        // all this names is the same for logseq → we should erase all
        for (const n of [name, name.replaceAll('-', '_'), name.replaceAll('_', '-')]) {
            const propRegexp = PropertiesUtils.propertyContentFormat({name: n})
            block.content = block.content.replaceAll(new RegExp(propRegexp, 'gim'), '')
        }
    }
    static getPropertyNames(text: string): string[] {
        const propertyNames: string[] = []
        const propertyLine = new RegExp(PropertiesUtils.propertyContentFormat({
            name: `([^${PropertiesUtils.propertyRestrictedChars}]+)`
        }), 'gim')
        text.replaceAll(propertyLine, (m, name) => {propertyNames.push(name); return m})
        return propertyNames
    }
    static getProperties(obj: BlockEntity | PageEntity) {
        const values: Properties = {}
        const refs: PropertiesRefs = {}

        const names = !!obj.content
            ? PropertiesUtils.getPropertyNames(obj.content)
            : Object.keys(obj.properties ?? {})

        for (const name of names) {
            const p = PropertiesUtils.getProperty(obj, name)
            values[name] = values[p.name] = p.text
            refs[name] = refs[p.name] = p.refs
        }

        return {values, refs}
    }
}


export class RendererMacro {
    public name: string
    public arguments: string[]

    static command(name: string | null) {
        return new RendererMacro(name)
    }

    constructor(name: string | null) {
        name = name ?? ''
        name = name.trim()
        if (name.startsWith(':'))
            name = name.slice(1)
        name = name.toLowerCase().trim()

        this.name = name
        this.arguments = []
    }
    clone() {
        return Object.assign(
            Object.create(Object.getPrototypeOf(this)),
            structuredClone(this),
        )
    }
    arg(value: string) {
        value = value ?? ''
        if (!value)
            return this

        const obj = this.clone()
        obj.arguments.push(value)
        return obj
    }
    args(values: string[]) {
        values = values ?? []
        if (!values.length)
            return this

        const obj = this.clone()
        obj.arguments.push(...values)
        return obj
    }
    toString({useColon = true} = {}) {
        return '{{renderer ' +
            (useColon ? ':' : '') +
            [this.name].concat(this.arguments).map(a => a.toString()).join(', ') +
        '}}'
    }
 }
