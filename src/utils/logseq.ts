import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { indexOfNth, p } from './other'
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
): Promise<BlockEntity | null> {
    if (['page', 'tag'].includes(ref.type))
        return null

    if (['name', 'block?'].includes(ref.type)) {
        byProperty = byProperty.trim().toLowerCase()
        if (byProperty.startsWith(':'))
            byProperty = byProperty.slice(1)

        if (!byProperty)
            return null

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
                        p`Found multiple results block with property "${byProperty}:: ${ref.value}". Taken first`,
                        {results},
                    )

                if (!includeChildren)
                    return results[0]

                return await logseq.Editor.getBlock(
                    results[0].id,
                    {includeChildren: true},
                ) as BlockEntity
            }
        }
    }

    return await logseq.Editor.getBlock(ref.value, {includeChildren})
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

export enum LogseqViewType { page, block, journals }
export type LogseqView =
    { view: LogseqViewType.journals } |
    { view: LogseqViewType.page,  page: PageEntity } |
    { view: LogseqViewType.block, page: PageEntity, block: BlockEntity }

export async function getCurrentView(): Promise<LogseqView> {
    const current: PageEntity | BlockEntity | null = await logseq.Editor.getCurrentPage()
    if (!current)
        return {
            view: LogseqViewType.journals,
        }

    if (current.page) {
        return {
            view: LogseqViewType.block,
            page: await logseq.Editor.getPage(current.page.id) as PageEntity,
            block: current as BlockEntity,  // zoomed in block
        }
    }

    return {
        view: LogseqViewType.page,
        page: current as PageEntity,
    }
 }
