import { Mldoc } from 'mldoc'

import { ArgsContext, ILogseqContext } from '../context'
import { cleanMacroArg, Macro, RendererMacro } from '../utils/logseq'
import { html, p } from '../utils/other'


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


export type MLDOC_Node = [
    type: string | null,
    data?: any,
    additional?: any,
]

async function walkNodes_async<T>(
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

function walkNodes<T>(
    nodes: MLDOC_Node[],
    callback: (
        type: MLDOC_Node['0'],
        data: MLDOC_Node['1'],
        node: MLDOC_Node,
        process: (n: MLDOC_Node) => T | null,
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
    parse(text: string): MLDOC_Node[] {
        if (!text.trim())
            return []

        const unparsedNodes: string = Mldoc.parseInlineJson(text,
            JSON.stringify(MLDOC_OPTIONS))

        let nodes: MLDOC_Node[] = []
        try {
            nodes = JSON.parse(unparsedNodes)
        } catch {
            console.debug(p`Failed to parse:`, {ast: unparsedNodes})
            return []
        }

        return this._prepareAST(nodes)
    }
    _prepareAST(nodes: MLDOC_Node[]): MLDOC_Node[] {
        let skip: MLDOC_Node | null = null
        return walkNodes(nodes, (type, data, node, process) => {
            if (skip && skip[0] === type && skip[1] === data) {
                skip = null
                return null
            }

            switch (type) {
                case 'Code': {
                    if (data.startsWith('`')) {
                        const m = data.match(/^`(?<header>[^\n]*)\n(?<body>.*?)\n$/su)
                        if (m) {
                            const header = m.groups.header.trim()
                            const body = m.groups.body

                            const m2 = header.match(/(?<schema>[^:]*):?(?<header>.*)/u)

                            node[0] = 'Code_Block'
                            node[1] = {
                                schema: m2.groups.schema.trim(),
                                header: m2.groups.header.trim(),
                                body,
                            }
                        } else
                            node[1] = data.slice(1)

                        skip = ['Plain', '`']
                    }
                    break
                }
                case 'Link': {
                    data.interpolation = data.full_text.startsWith('!') ? '!' : ''

                    if ( !(data.url && data.url.length) )
                        break

                    const [ url_type, url ] = data.url
                    switch (url_type) {
                        case 'Search': {
                            const [ protocol, link ] = resolveAssetsLink(this.context, '', url)
                            if (protocol)
                                data.url = [ 'Complex', { protocol, link } ]
                            break
                        }
                        case 'Complex': {
                            let protocol = url.protocol
                            let link = url.link
                            ;[ protocol, link ] = resolveAssetsLink(this.context, protocol, link)
                            data.url[1] = { protocol, link }
                            break
                        }
                    }
                    break
                }
            }

            return node
        })
    }
    toHTML(text: string, nestingLevel: number = 0): string {
        const nodes: MLDOC_Node[] = this.parse(text)
        console.debug(p`Markup parsed`, {nodes})
        return new MldocASTtoHTMLCompiler(this.context, nestingLevel).compile(nodes)
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
    compile(ast: MLDOC_Node[]) {
        // Logseq Markup parsing: https://github.com/logseq/logseq/blob/master/src/main/frontend/components/block.cljs#L3102
        // Mldoc AST schema: https://github.com/logseq/logseq/pull/8829/files
        return (walkNodes(ast, (type, data, node, process): string => {
            switch (type) {
                case 'Break_Line':         return '<br/>'
                case 'Plain':              return data as string
                case 'Inline_Html':        return data as string
                case 'Inline_Hiccup':      return data as string  // TODO?: support hiccup
                case 'Footnote_Reference': return `<sup>${data.name || data.id}</sup>`
                case 'Code':               return `<code>${data}</code>`
                case 'Code_Block':         return `<pre><code>${data.body.replaceAll('\n', '<br/>')}</code></pre>`
                case 'Macro': {
                    const { name, arguments: args } = data
                    const macro = new Macro(name).args(args).toString()
                    return `<code>${macro}</code>`
                }
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
                    const meta: string = data.metadata ?? ''

                    let label = ''
                    if (data.label && data.label.length) {
                        const node = data.label[0]
                        // handle case when label is plain text: to reduce `process` call
                        if (node && node.length && node[0] === 'Plain')
                            label = node.at(1) ?? ''
                        else
                            label = process(node) as string
                    }

                    if (data.url && data.url.length) {
                        const [ type, url ] = data.url
                        switch (type)
                            { case 'Search': {
                                const term = url ?? ''
                                const [ protocol, link ] = resolveAssetsLink(this.context, '', term)
                                return this.createPageRef(term, label)
                            } case 'Page_ref': {
                                const name = url ?? ''
                                return this.createPageRef(name, label)
                            } case 'Block_ref': {
                                const uuid = url ?? ''
                                return this.createBlockRef(uuid, label)
                            } case 'Complex': {
                                const protocol = (url ?? {}).protocol ?? ''
                                const link = (url ?? {}).link ?? ''
                                if (data.interpolation === '!')
                                    return this.createImageLink(protocol, link, label, meta)
                                return this.createLink(protocol, link, label)
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

    createBlockRef(uuid: string, label: string): string {
        const uuidLabel = `((${uuid}))`
        // @ts-expect-error
        const block = top!.logseq.api.get_block(uuid)
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
                    label = new LogseqMarkup(this.context).toHTML(label, this.nestingLevel + 1)
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
    createLink(protocol: string, link: string, label: string): string {
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
    createImageLink(protocol: string, link: string, label: string, meta: string): string {
        if (meta.startsWith('{'))
            meta = meta.slice(1)
        if (meta.endsWith('}'))
            meta = meta.slice(0, -1)

        const argsMeta_ = meta.split(',').map(a => cleanMacroArg(a, {escape: false, unquote: true}))
        const argsMeta = ArgsContext.parse(argsMeta_)
        const { width, height } = Object.fromEntries(argsMeta)

        label = label.trim()
        const link_ = link
        if (protocol)
            link = `${protocol}://${link}`

        return html`
                <div class="asset-container">
                    <img class="rounded-sm relative" loading="lazy" src="${link}" ${label ? `title="${label}"` : ''} ${height ? `height="${height}"` : ''} ${width ? `width="${width}"` : ''} />
                    <div class="asset-overlay"></div>
                    <div class="asset-action-bar" aria-hidden="true">
                        <div class="flex"></div>
                        <a class="asset-action-btn" href="${link}" title="${link}" data-on-click="" tabindex="-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-external-link" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                               <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                               <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5"></path>
                               <path d="M10 14l10 -10"></path>
                               <path d="M15 4l5 0l0 5"></path>
                            </svg>
                        </a>
                    </div>
                    </div>
                </div>
        `
    }
}


export function resolveAssetsLink(context: ILogseqContext, protocol: string, link: string) {
    let needExpand = true
    if (link.startsWith('/')) {
        protocol = 'assets'
        needExpand = false
    }

    const prefix = '../assets'
    if (link.startsWith(prefix)) {
        link = link.slice(prefix.length)
        protocol = 'assets'
    }

    if (protocol === 'assets') {
        protocol = 'file'
        if (needExpand)
            // @ts-expect-error
            link = top!.LSPlugin.pluginHelpers.path.join(
                context.config.graph.path, 'assets', link)
    }

    return [protocol, link]
 }
