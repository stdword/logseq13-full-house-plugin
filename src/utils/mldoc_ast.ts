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


type MLDOC_Node = [ type: string | null, data?: any ]
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

function walkNodes<T>(
    nodes: MLDOC_Node[],
    callback: (
        type: MLDOC_Node['0'],
        data: MLDOC_Node['1'],
        node: MLDOC_Node,
        process: (n: MLDOC_Node) => (T | null),
    ) => T | null
): T[] {
    function processNode(node: MLDOC_Node): T | null {
        const [ type, data ] = node
        if (type === null)
            return null
        return callback(type, data, node, processNode)
    }
    return nodes.map(processNode).filter((item) => item !== null) as T[]
 }


export class LogseqMarkup {
    context: ILogseqContext

    constructor(context: ILogseqContext) {
        this.context = context
    }

    toHTML(text: string): string {
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

        walkNodes(nodes, (type, data, node, processNode) => {
            if (type === 'Plain')
                node[1] = LogseqMarkup._transformUnorderedListsToAsteriskNotation(
                    data as string)
        })

        return new MldocASTtoHTMLCompiler(this.context).compile(nodes)
    }

    static _transformUnorderedListsToAsteriskNotation(text: string) {
        return text.replaceAll(/^(\s*)-(\s*)/gum, '$1*$2')
    }
}


class MldocASTtoHTMLCompiler {
    context: ILogseqContext

    constructor(context: ILogseqContext) {
        this.context = context
    }

    compile(ast: MLDOC_Node[]) {
        return walkNodes(ast, (type, data, node, process): string => {
            switch (type) {
                case 'Break_Line': return '<br/>'
                case 'Plain':      return data as string
                case 'Emphasis': {
                    const [ [emphasis], [subNode] ] = data
                    const compiledValue = process(subNode) as (string | null)
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
                            label = process(node) as string
                    }

                    let url = ''
                    if (data.url && data.url.length) {
                        const [ type, url ] = data.url
                        switch (type) {
                            case 'Page_ref':
                                const name = data.url.at(1) ?? ''
                                return this.createPageRef(name, label)
                            case 'Block_ref':
                                const uuid = data.url.at(1) ?? ''
                                return this.createBlockRef(uuid, label)
                        }
                    }
                }
                default:
                    console.warn(p`Unknown node type:`, {type, node})
            }
            return JSON.stringify(data ?? '')
        }).join('')
    }

    createBlockRef(uuid: string, label: string) {
        label = label.trim()
        if (!label) {
            if (this.context.block.uuid === uuid)
                label = `((...))`  // self reference
            else {
                //
                const block = top!.logseq.api.get_block(uuid)
                label = block.content.split('\n', 1)[0]
                // new MldocASTtoHTMLCompiler(this.context)
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

        // inline block (without label)
        // return html`
        //     <div data-type="default" class="block-ref-wrap inline">
        //         <div style="display: inline;">
        //             <span class="block-ref">
        //                 <div id="block-content-${uuid}"
        //                      blockid="${uuid}"
        //                      data-type="default"
        //                      class="block-content inline"
        //                      style="width: 100%;"
        //                     >
        //                     <div class="flex flex-row justify-between block-content-inner">
        //                         <div class="flex-1 w-full">${ref}</div>
        //                     </div>
        //                 </div>
        //             </span>
        //         </div>
        //     </div>
        // `
    }

    createPageRef(name: string, label: string) {
        label = label.trim()
        const nameID = name.toLowerCase()

        const { showBrackets } = this.context.config
        const wrapBrackets = (text: string) =>
            (showBrackets ? `<span class="text-gray-500 bracket">${text}</span>` : '')

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
}
