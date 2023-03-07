import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { f, indexOfNth, p } from './other'
import { isInteger, isUUID, toCamelCase } from './parsing'


export type IBlockNode = Required<Pick<IBatchBlock, 'content' | 'children'>>
export function walkBlockTree(
    root: IBlockNode,
    callback: ((b: IBlockNode) => string),
): IBlockNode {
    return {
        content: callback(root),
        children: (root.children || []).map(b => walkBlockTree(b as IBlockNode, callback)),
    }
 }


export async function insertContent(
    content: string,
    options: { positionOnArg?: number, positionOnText?: string } = {},
) {
    const cursor = await logseq.Editor.getEditingCursorPosition()
    if (!cursor) {
        console.warn(p`Attempt to insert content while not in editing state`)
        return
    }

    // TODO: logseq needs API to set selection in editing state
    // to implement feature like sublime text snippets: placeholders switched by TAB
    // text ${1:arg1} snippet ${2:arg2}

    const { positionOnArg, positionOnText } = options
    if (!positionOnArg && !positionOnText) {
        logseq.Editor.insertAtEditingCursor(content)
        return
    }

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
    else
        position = content.indexOf(positionOnText!)

    const block = await logseq.Editor.getCurrentBlock()
    await logseq.Editor.exitEditingMode()
    await logseq.Editor.updateBlock(block!.uuid, content)
    logseq.Editor.editBlock(block!.uuid, { pos: position })
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
 }
export type LogseqReferenceAccessType = 'page' | 'block' | 'name'

export function parseReference(ref: string): LogseqReference | null {
    ref = ref.trim()
    if (ref === '')
        return null

    let type_  = 'name'
    let value: string | number = ref

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

    return { type: type_, value, original: ref } as LogseqReference
 }

export async function getPage(ref: LogseqReference): Promise<PageEntity | null> {
    if (['block', 'block?'].includes(ref.type))
        return null

    return await logseq.Editor.getPage(ref.value)
 }

export async function getBlock(
    ref: LogseqReference,
    {
        byProperty = '',
        includeChildren = false,
    }: { byProperty?: string, includeChildren?: boolean }
): Promise<[BlockEntity | null, LogseqReferenceAccessType]> {
    if (['page', 'tag'].includes(ref.type))
        return [ null, 'page']

    if (['name', 'block?'].includes(ref.type)) {
        byProperty = byProperty.trim().toLowerCase()
        if (byProperty.startsWith(':'))
            byProperty = byProperty.slice(1)

        if (!byProperty)
            return [ null, 'name']

        const query = `
            [:find (pull ?b [*])
             :where
                [?b :block/properties ?props]
                [(get ?props :${byProperty}) ?name]
                [(= ?name "${ref.value}")]
            ]
        `.trim()

        const ret = await logseq.DB.datascriptQuery(query)
        if (ret) {
            const results = ret.flat()
            if (results.length !== 0) {
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
        }
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


export function cleanMacroArg(arg: string | null | undefined): string {
    arg ??= ''
    arg = arg.trim()

    if (arg.includes(',') && arg.startsWith('"') && arg.endsWith('"')) {
        // «"» was used to escape «,» in logseq, so trim them
        arg = arg.slice(1, -1)
    }

    // To deal with XSS: escape dangerous (for datascript raw queries) chars
    const escapeMap = {
        '"': '\\"',
    }

    const chars = Object.keys(escapeMap).join('')
    arg = arg.replaceAll(new RegExp(`[${chars}]`, 'g'), (ch) => escapeMap[ch])
    return arg.trim()
 }

export function isCommand(name: string, command: string) {
    if (name.startsWith(':'))
        name = name.slice(1)

    name = name.toLowerCase().trim()
    return name === command
 }


type LogseqProperty = { name: string, text: string, refs: string[] }

export type Properties     = {[index: string]: string  }
export type PropertiesRefs = {[index: string]: string[]}

export class PropertiesUtils {
    static propertyContentFormat = f`^${'pattern'}::[^\\n]*?\\n?$`
    static propertyRestrictedChars = ':;,^@#~"`/|\\(){}[\\]'

    static getProperty(obj: BlockEntity | PageEntity, name: string): LogseqProperty {
        const nameCamelCased = toCamelCase(name)

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
        const nameCamelCased = toCamelCase(name)

        if (block.properties)
            delete block.properties[nameCamelCased]
        if (block.propertiesTextValues)
            delete block.propertiesTextValues[nameCamelCased]

        block.content = block.content.replaceAll(
            new RegExp(PropertiesUtils.propertyContentFormat({pattern: name}), 'gim'),
            '',
        )
    }
    static getPropertyNames(text: string): string[] {
        const propertyNames: string[] = []
        const propertyLine = new RegExp(PropertiesUtils.propertyContentFormat({
            pattern: `([^${PropertiesUtils.propertyRestrictedChars}]+)`
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
