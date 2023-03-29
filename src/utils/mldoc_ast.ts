import { Mldoc } from 'mldoc'
import { ILogseqContext } from '../context'

import { html, p } from './other'


const MLDOC_OPTIONS = {
    'heading_number': false,
    'heading_to_list': false,
    'toc': false,
    'keep_line_break': true,
    'format': 'Markdown',
    'exporting_keep_properties': false,
    'parse_outline_only': false,
    'inline_type_with_pos': false,
    'export_md_remove_options': [],
    'hiccup_in_block': true,
}


type MLDOC_Node = [ type: string | null, data?: any, additional?: any ]
type MLDOC_Node_withPositions = [
    MLDOC_Node,
    { start_pos: number | null, end_pos: number | null },
]

function parseNode(node: MLDOC_Node_withPositions) {
    const [ [ type, data ], { start_pos, end_pos } ] = node
    return { type, data, start_pos, end_pos }
 }

function transformTextRelatedToNode(
    text: string,
    node: MLDOC_Node_withPositions,
    transforms: ((t: string) => string)[],
) {
    const text_utf8 = new TextEncoder().encode(text)

    const { start_pos, end_pos } = parseNode(node)
    let nodeText = new TextDecoder().decode(text_utf8.slice(start_pos!, end_pos!))

    for (const transform of transforms)
        nodeText = transform(nodeText)

    // Conversion forwards & backwards: performance issue?
    // return new TextDecoder().decode(
    //     new Uint8Array([
    //         ...text_utf8.subarray(0, start_pos!),
    //         ...new TextEncoder().encode(nodeText),
    //         ...text_utf8.subarray(end_pos!)
    //     ])
    // )

    return ''
        .concat(new TextDecoder().decode(text_utf8.subarray(0, start_pos!)))
        .concat(nodeText)
        .concat(new TextDecoder().decode(text_utf8.subarray(end_pos!)))
 }

async function walkNodes<T>(
    nodes: MLDOC_Node[],
    callback: (
        type: MLDOC_Node['0'],
        data: MLDOC_Node['1'],
        node: MLDOC_Node,
        process: (n: MLDOC_Node) => (Promise<T | null>),
    ) => Promise<T | null>
): Promise<T[]> {
    async function processNode(node: MLDOC_Node): Promise<T | null> {
        const [ type, data ] = node
        if (type === null)
            return null
        return await callback(type, data, node, processNode)
    }
    return (
        await Promise.all(nodes.map(processNode))
    ).filter((item) => item !== null) as T[]
 }


export class LogseqMarkup {
    context: ILogseqContext

    constructor(context: ILogseqContext) {
        this.context = context
    }

    async toHTML(text: string, nestingLevel: number = 0): Promise<string> {
        const unparsedNodes: string = Mldoc.parseInlineJson(
            text,
            JSON.stringify(MLDOC_OPTIONS),
        )

        let nodes: MLDOC_Node[] = []
        try {
            nodes = JSON.parse(unparsedNodes)
        } catch {
            console.debug(p`Failed to parse:`, {ast: unparsedNodes})
        }

        console.debug(p`Building AST for text:`, {text, nodes})

        // walkNodes(nodes, (type, data, node, processNode) => {
        //     if (type === 'Plain')
        //         node[1] = LogseqMarkup._transformUnorderedListsToAsteriskNotation(
        //             data as string)
        // })

        return await new MldocASTtoHTMLCompiler(this.context, nestingLevel).compile(nodes)
    }

    static _transformUnorderedListsToAsteriskNotation(text: string) {
        return text.replaceAll(/^(\s*)-(\s*)/gum, '$1*$2')
    }
}


class MldocASTtoHTMLCompiler {
    static maxNestingLevelForInlineBlockRefs = 6  // value from Logseq

    context: ILogseqContext
    nestingLevel: number

    constructor(context: ILogseqContext, nestingLevel: number = 0) {
        this.context = context
        this.nestingLevel = nestingLevel
    }

    async compile(ast: MLDOC_Node[]) {
        return (await walkNodes(ast, async (type, data, node, process): Promise<string> => {
            switch (type) {
                case 'Break_Line':  return '<br/>'
                case 'Plain':       return data as string
                case 'Inline_Html': return data as string
                // TODO: case 'Inline_Hiccup': return
                // TODO: case 'Footnote_Reference': return
                case 'Code':        return `<code>${data}</code>`
                case 'Export_Snippet': {
                    const [ _, snippet, code ] = node
                    switch (snippet) {
                        case 'html': return code as string
                        default:
                            console.warn(p`Unknown export snippet type:`, {snippet, code})
                    }
                    return (code ?? '') as string
                }
                case 'Emphasis': {
                    const [ [emphasis], [subNode] ] = data
                    const compiledValue = await process(subNode) as (string | null)
                    switch (emphasis) {
                        case 'Strike_through': return `<s>${compiledValue}</s>`
                        case 'Italic':         return `<i>${compiledValue}</i>`
                        case 'Bold':           return `<b>${compiledValue}</b>`
                        default:
                            console.warn(p`Unknown emphasis type:`, {emphasis, subNode, compiledValue, data})
                    }
                    return compiledValue ?? ''
                }
                case 'Link': {
                    let label = ''
                    if (data.label && data.label.length) {
                        const node = data.label[0]
                        // handle case when label is plain text: to reduce `process`` call
                        if (node && node.length && node[0] === 'Plain')
                            label = node.at(1) ?? ''
                        else
                            label = await process(node) as string
                    }

                    let url = ''
                    if (data.url && data.url.length) {
                        const [ type, url ] = data.url
                        switch (type)
                            { case 'Search': {
                                const term = url ?? ''
                                return this.createPageRef(term, label)
                            } case 'Page_ref': {
                                const name = url ?? ''
                                return this.createPageRef(name, label)
                            } case 'Block_ref': {
                                const uuid = url ?? ''
                                return await this.createBlockRef(uuid, label)
                            } case 'Complex': {
                                const { protocol, link } = url ?? {}
                                return this.createExternalLink(protocol, link, label)
                            }
                            default:
                                console.warn(p`Unknown link type:`, {type, url})
                        }
                    }
                }
                default:
                    console.warn(p`Unknown node type:`, {type, node})
            }
            return JSON.stringify(data ?? '')
        })).join('')
    }

    async createBlockRef(uuid: string, label: string): Promise<string> {
        const uuidLabel = `((${uuid}))`
        const block = await logseq.Editor.getBlock(uuid)
        if (!block)
            return html`
                <span title="Reference to non-existent block"
                      class="warning mr-1"
                    >${uuidLabel}</span>
            `

        label = label.trim()
        if (!label) {
            if (this.context.block.uuid === uuid)
                label = `((...))`  // self reference
            else {
                label = block.content.split('\n', 1)[0]
                if (this.nestingLevel <= MldocASTtoHTMLCompiler.maxNestingLevelForInlineBlockRefs)
                    // NOTE: recursion
                    label = await new LogseqMarkup(this.context).toHTML(label, this.nestingLevel + 1)
                else
                    label = html`
                        <span class="warning text-sm">Block reference nesting is too deep</span>
                    `
            }
        }

        return html`
            <div class="block-ref-wrap inline"
                 data-type="default"
                >
                <div style="display: inline;">
                    <span class="block-ref"
                          data-uuid="${uuid}"
                          data-on-click="clickBlockRef"
                        >${label}</span>
                </div>
            </div>
        `
    }
    createPageRef(name: string, label: string): string {
        label = label.trim()
        const nameID = name.toLowerCase()

        const { showBrackets } = this.context.config
        const wrapBrackets = (text: string) => (
                showBrackets
                ? `<span class="text-gray-500 bracket">${text}</span>`
                : '')

        return html`
            <span data-ref="${name}" class="page-reference">
                ${wrapBrackets('[[')}
                <div style="display: inline;">
                    <a class="page-ref"
                       data-ref="${nameID}"
                       data-on-click="clickRef"
                       >${label || name}</a>
                </div>
                ${wrapBrackets(']]')}
            </span>
        `
    }
    createExternalLink(protocol: string, link: string, label: string): string {
        label = label.trim()
        if (protocol)
            link = `${protocol}://${link}`

        // data-on-click is empty to prevent click event bubbling
        return html`
            <a href="${link}"
               target="_blank"
               class="external-link"
               data-on-click=""
                >${label}</a>
        `
    }
}
