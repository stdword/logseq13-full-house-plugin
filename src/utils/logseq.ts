import { IBatchBlock, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { indexOfNth, p } from './other'
import { toCamelCase } from './parsing'


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

export function isCommand(name: string, command: string) {
    if (name.startsWith(':'))
        name = name.slice(1)

    name = name.toLowerCase().trim()
    return name === command
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
