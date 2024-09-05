import '@logseq/libs'
import { BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import * as Sherlock from 'sherlockjs'
import { neatJSON } from 'neatjson'

import { LogseqDayjsState } from './extensions/dayjs_logseq_plugin'
import {
    LogseqMarkup, MLDOC_Node, MldocASTtoHTMLCompiler,
    resolveAssetsLink, walkNodes,
} from './extensions/mldoc_ast'
import {
    ArgsContext, BlockContext, Context,
    dayjs, Dayjs,
    ILogseqContext as C, ILogseqCurrentContext,
    PageContext,
}  from './context'
import {
    cleanMacroArg,
    coerceStringToBool,
    editBlockWithSelection,
    escape,
    escapeForHTML,
    escapeMacroArg,
    functionSignature,
    getBlock, getChosenBlocks, getCSSVars, getEditingCursorSelection,
    getPage, getTreeNode, IBlockNode, isEmptyString, isObject, isUUID,
    LogseqReference, p, parseReference, RendererMacro,
    rgbToHex,
    sleep,
    splitMacroArgs, unquote, walkBlockTree, walkBlockTreeAsync,
} from './utils'
import {
    getArgsContext, getTemplate, getTemplateBlock,
    renderTemplate, compileTemplateView,
} from './logic'
import { StateError } from './errors'
import { ITemplate, prepareRenderedNode, Template } from './template'
import { PagesQueryBuilder } from './query'
import { query_table_no_save_state, query_table_save_state } from './ui/query-table'
import { updateBlocksAction } from './utils/actions'


const isoDateFromat = 'YYYY-MM-DD'


// These template tags could be used in raw javascript template code
// → type declarations could be violated
// → use this protection where necessary
function _asString(v: any): string {
    v ??= ''
    return v.toString()
}

function _withLabel(item: string, label: string) {
    return `[${label}](${item})`
}
function _asDateString(item: string): Dayjs | null {
    const day = dayjs(item, isoDateFromat, true)  // strict mode
    if (day.isValid())
        return day
    return null
}
function _ref(name: string, label: string | null = null): string {
    const item = `[[${name}]]`
    if (label !== null)
        return _withLabel(item, label)
    return item
}
function _is_ref(item: string): boolean {
    return item.startsWith('[[') && item.endsWith(']]')
}
function _tag(name: string): string {
    if (!(name.startsWith('[[') && name.endsWith(']]')) && name.search(/\s/) !== -1)
        name = `[[${name}]]`
    return '#' + name
}
function _is_tag(item: string): boolean {
    return item.startsWith('#')
}
function _bref(uuid: string, label: string | null = null): string {
    const item = `((${uuid}))`
    if (label !== null)
        return _withLabel(item, label)
    return item
}
function _is_bref(item: string): boolean {
    return item.startsWith('((') && item.endsWith('))')
}

export function ref(item: string | BlockContext | PageContext | Dayjs, label: string | null = null): string {
    item = item ?? ''

    if (item instanceof dayjs) {
        // @ts-expect-error
        item = item.toPage() as string
        return _ref(item, label)
    }

    if (item instanceof BlockContext) {
        if (item.uuid)
            return _bref(item.uuid, label)

        // @ts-expect-error
        const block = top!.logseq.api.get_block(item.id)
        return _bref(block?.uuid ?? '', label)
    }

    if (item instanceof PageContext) {
        if (item.name)
            return _ref(item.name, label)

        // @ts-expect-error
        const page = top!.logseq.api.get_page(item.id)
        return _ref(page?.originalName ?? '', label)
    }

    const str = _asString(item).trim()
    if (_is_ref(str))
        if (label === null)
            return str
        else
            return _withLabel(str, label)

    if (_is_bref(str) && isUUID(str.slice(2, -2)))
        if (label === null)
            return str
        else
            return _withLabel(str, label)

    if (isUUID(str))
        return _bref(str, label)

    // check for the case `ref(today)` or `ref('YYYY-MM-DD')`
    const date = _asDateString(str)
    if (date)
        return _ref(date.format('page'), label)

    return _ref(str, label)
}
function tag(item: string | PageContext | Dayjs): string {
    item = item ?? ''

    if (item instanceof dayjs) {
        // @ts-expect-error
        item = item.toPage() as string
        return _tag(item)
    }

    if (item instanceof PageContext) {
        if (item.name)
            return _tag(item.name)

        // @ts-expect-error
        const page = top!.logseq.api.get_page(item.id)
        return _tag(page?.originalName ?? '')
    }

    const str = _asString(item).trim()
    if (_is_tag(str))
        return str
    if (_is_ref(str))
        return _tag(str.slice(2, -2))

    // check for the case `ref(today)` or `ref('YYYY-MM-DD')`
    const date = _asDateString(str)
    if (date)
        return _tag(date.format('page'))

    return _tag(str)
}
function bref(item: any): string {
    // @ts-expect-error
    top!.logseq.api.show_msg(
        '"bref" is deprecated. Please use "ref" instead',
        'warning', {timeout: 5000}
    )
    console.warn(p`"bref" is deprecated. Please use "ref" instead`)

    return ref(item)
}
bref.obsolete = true
function embed(item: string | BlockContext | PageContext | Dayjs): string {
    const r = ref(item)
    return `{{embed ${r}}}`
}


/* «include» & «layout» namespaces */
function _clean_include_args(name: string, args?: string[] | string) {
    const ref = parseReference(name ?? '')

    if (args !== undefined && !Array.isArray(args))
        args = splitMacroArgs(args.toString())
    args = args as string[] | undefined

    if (args)  // runtime protection
        args = args.map((arg) => arg.toString())

    return {ref, args}
}
async function _show_lazy_mode_restriction_message_for_views() {
    console.warn(p`Lazy inclusion is not supported for views`)
    await logseq.UI.showMsg(
        '[:p "Lazy inclusion is not supported for " [:b "views"] ". Please ' +
        'use " [:code ":template"] " command instead or " [:code "include"] " template tag."]',
        'warning', {timeout: 5000}
    )
}

async function _include__lazy(
    context: C,
    commandName: string,
    layoutMode: boolean,
    name: string,
    args_?: string[] | string,
): Promise<string> {
    if (context.mode === 'view') {
        await _show_lazy_mode_restriction_message_for_views()
        return ''
    }

    let {ref, args} = _clean_include_args(name, args_)
    if (!ref)
        return ''

    let block: BlockEntity
    try {
        [block, ] = await getTemplateBlock(ref)
    } catch (error) {  // StateError
        return ''
    }

    let command = RendererMacro.command(commandName).arg(ref.value as string)

    if (!args)
        args = Template.getUsageArgs(block)
    if (layoutMode)
        args.push(`:transcluded-from ${context.template!.block.id}`)
    command = command.args(args)

    return command.toString()
}
async function _include__runtime(
    context: C,
    layoutMode: boolean,
    name: string,
    args_?: string[] | string,
): Promise<string> {
    let {ref, args} = _clean_include_args(name, args_)
    if (!ref)
        return ''

    let template: Template
    try {
        template = await getTemplate(ref)
    } catch (error) {  // StateMessage
        return ''
    }

    if (!args)
        args = Template.getUsageArgs(template.block)

    const argsContext = layoutMode
        ? await getArgsContext(template, args, context.template!._obj)
        : undefined

    // @ts-expect-error
    const slot = context.identity.slot
    const renderArgs = [slot, template, args, context, argsContext
        ] as [string, ITemplate, string[], ILogseqCurrentContext, ArgsContext | undefined]

    if (context.mode === 'view')
        return await compileTemplateView(...renderArgs)

    if (context.mode !== 'template') {
        console.debug(p`Unknown rendering mode: ${context.mode}`)
        return ''
    }

    // handling template inclusion
    const {headTail: [head, tail]} = await renderTemplate(...renderArgs)

    // if included template head contains cursor positions
    const selectedPositions = (head as IBlockNode).data?.selectionPositions
    if (selectedPositions) {
        // return them back to be handled again by outer template
        while (selectedPositions.length) {
            const pos = selectedPositions.pop()
            head.content = head.content!.slice(0, pos)
                + Template.carriagePositionMarker
                + head.content!.slice(pos)

            cursor(context)  // mark block with cursor position flag
        }
    }

    // spawn possible blocks around head
    for (const block of head.children ?? [])
        blocks_spawn__tree(context, block as IBlockNode)
    for (const block of tail)
        blocks_append__tree(context, block as IBlockNode)

    return head.content ?? ''
}

async function include(context: C, name: string, args?: string[] | string) {
    return await _include__runtime(context, false, name, args)
}
async function include__template(context: C, name: string, args_?: string[] | string) {
    return await _include__lazy(context, 'template', false, name, args_)
}
async function include__view(context: C, name: string, args_?: string[] | string) {
    return await _include__lazy(context, 'template-view', false, name, args_)
}
async function include__inlineView(context: C, body: string, args_?: string[]) {
    if (context.mode === 'view') {
        await _show_lazy_mode_restriction_message_for_views()
        return ''
    }

    const {args} = _clean_include_args('', args_)

    // force usage of single quotes to avoid messing up with logseq escaping
    body = body.replaceAll('"', "'")

    body = escapeMacroArg(body, {quote: true, escape: false})

    // inline view doesn't support curly brackets, but string
    // characters need to be escaped to avoid messing up with logseq escaping
    body = body.replaceAll('{', '\\u007B')
    body = body.replaceAll('}', '\\u007D')

    const command = RendererMacro.command('view')
        .arg(body)
        .args(args)
    return command.toString()
}

async function layout(context: C, name: string, args?: string[] | string) {
    return await _include__runtime(context, true, name, args)
}
async function layout__template(context: C, name: string, args_?: string[] | string) {
    return await _include__lazy(context, 'template', true, name, args_)
}
function layout__args(context: C, ...argNames: (string | [string, string | boolean] | {string: string | boolean})[]) {
    if (argNames.length === 0) {
        // use all available (in context) args names
        let index = 1
        argNames = context.args._args.map(([key, _]) => (key ? key : `$${index++}`))
    }

    const args = Object.fromEntries(context.args._args)
    return argNames
        // @ts-expect-error
        .flatMap(x => (isObject(x) ? Object.entries(x) : x))
        .map((n) => {
            let name: string
            let value: string | boolean | undefined
            let positional: number | undefined

            // every item could have form [name, value]
            if (Array.isArray(n)) {
                let val: any
                [name, val] = n
                // force value to be boolean or string
                value = typeof val === 'boolean' ? val : val.toString()
            } else
                name = n as string

            if (name.startsWith(':'))
                name = name.slice(1)
            const name_ = ':' + name

            if (value === undefined) {
                if (name.startsWith('$'))
                    positional = Number(name.slice(1))
                if (positional !== undefined && positional < 1)
                    return null

                if (positional !== undefined)
                    value = context.args._args
                        .filter(([key, val]) => key === '')
                        .map(([key, val]) => val)
                        .at(positional - 1)
                else
                    value = args[name]

                if (value === undefined)
                    return null
            }

            if (typeof value === 'string') {
                if (positional === undefined)
                    if (value)
                        value = `${name_} ${value}`
                    else
                        return `${name_} ""`  // no escape
                return escapeMacroArg(value, {quote: true, escape: true})
            }

            // assume value is boolean
            return value ? name_ : name_ + ' ""'
        })
        .filter((v) => v !== null)
        .join(', ')
}


function empty(obj: any, fallback: any = '') {
    if (obj === null || obj === undefined)
        return fallback

    if (Array.isArray(obj) && obj.length === 0)
        return fallback

    if (isObject(obj) && Object.keys(obj).length === 0)
        return fallback

    const strObj = _asString(obj)
    if (isEmptyString(strObj))
        return fallback

    return obj
}
function bool(value: string, fallback: any = '') {
    if (typeof value !== 'string')
        return fallback
    return coerceStringToBool(value) ?? fallback
}
function when(obj: any, result: any, fallback: any = '') {
    const condition = !!obj

    if (condition) {
        if (typeof result !== 'string')
            return result

        const strObj = _asString(obj)
        return result
            .replaceAll('${_}', strObj)
            .replaceAll('${}', strObj)
            .replaceAll('$1', strObj)
    }

    return fallback
}
function fill(
    value: string | number,
    char: string,
    width: number,
    align: 'left' | 'right' | 'center' = 'right',
): string {
    value = _asString(value)
    char = _asString(char)
    width = Number(_asString(width))
    const count = Math.max(0, width - value.length)

    const filler = char.repeat(count)
    if (align === 'left')
        return value + filler
    else if (align === 'right')
        return filler + value

    const half = Math.floor(count / 2)
    const remainder = count % 2
    return char.repeat(half + remainder) + value + char.repeat(half)
}
function zeros(value: string | number, width: number) {
    return fill(value, '0', width)
}
function spaces(value: string | number, width: number, align: 'left' | 'right' | 'center' = 'right') {
    return fill(value, ' ', width, align)
}


/* «date» namespace  */
function date_nlp(context: C, query: string, now: Dayjs | string = 'now'): Dayjs | null {
    if (now === 'now')
        Sherlock._setNow(null)
    else if (now === 'page')
        Sherlock._setNow(context.currentPage.day?.toDate() || null)
    else {
        const day = dayjs(now)
        Sherlock._setNow(day.isValid() ? day.toDate() : null)
    }

    const parsed = Sherlock.parse(query)
    const { isAllDay, eventTitle, startDate, endDate } = parsed
    if (startDate) {
        const day = dayjs(startDate)
        return day.isValid() ? day : null
    }
    return null
}
function date_from_journal(day: number | string | Dayjs): Dayjs | null {
    if (day instanceof dayjs)
        return day
    day = day.toString()
    const obj = PageContext.parseDay(day)
    if (!obj.isValid())
        return null
    return obj
}


/* «query» namespace  */
function query_pages() {
    return new PagesQueryBuilder()
}
function query_refsCount(context: C, page: PageContext | string = '') {
    let name = context.page.name!
    if (page instanceof PageContext)
        name = page.name!
    else if (page)
        name = _asString(page)
    name = escape(name.toLowerCase(), ['"'])

    // @ts-expect-error
    const refs = top!.logseq.api.datascript_query(`
      [:find (pull ?b [:block/uuid])
         :where
            [?b :block/refs ?r]
            [?r :block/name ?rn]
            [(= ?rn "${name}")]
      ]
    `.trim())
    if (!refs)
        return 0

    return refs.length
}

function _queryRefs(
    context: C,
    page: PageContext | string = '',
    only: 'journals' | 'pages' | '' = '',
    withProps: boolean = false,
) {
    let name = context.page.name!
    if (page instanceof PageContext)
        name = page.name!
    else if (page)
        name = _asString(page)
    name = escape(name.toLowerCase(), ['"'])

    let filterOnly = ''
    if (only === 'journals')
        filterOnly = '[?p :block/journal? true]'
    else if (only === 'pages')
        filterOnly = '[?p :block/journal? false]'

    // @ts-expect-error
    let refs = top!.logseq.api.datascript_query(`
      [:find (pull ?b [
          {:block/page [
            [:block/journal-day :as :day]
            [:block/original-name :as :name]
          ]}
          ${withProps ? '[:block/properties :as :props]' : ''}
        ])
          :where
            [?b :block/refs ?r]
            [?r :block/name ?rn]
            [(= ?rn "${name}")]
            [?b :block/page ?p]
            ${filterOnly}
      ]
    `.trim())
    if (!refs || refs.length === 0)
        return []

    refs = refs.flat()

    if (only === 'journals')
        refs.sort((a, b) => b.page.day - a.page.day)

    for (let r of refs) {
        if (r.page && r.page.day)
            r.page.day = PageContext.parseDay(r.page.day)
    }

    return refs.map((r) => {
        if (only === 'pages' && !withProps)
            return r.name

        if (only === 'journals' && !withProps)
            return r.page.day

        return {
            day: r.page.day,
            name: r.page.name,
            props: r.props,
        }
    })
}
function query_journalRefs(context: C, page: PageContext | string = '', withProps: boolean = false) {
    return _queryRefs(context, page, 'journals', withProps)
}
function query_pageRefs(context: C, page: PageContext | string = '', withProps: boolean = false) {
    return _queryRefs(context, page, 'pages', withProps)
}


/* «dev» namespace  */
function dev_dump(obj: any) {
    obj = neatJSON(obj, {
        indent: '\t',
        wrap: 30,
        afterComma: 1,
        afterColon: 1,
        // short: true,
    })
    return '<pre>' + obj + '</pre>'
}
function dev_uuid(shortForm: boolean = false, forBlock: boolean = false) {
    if (shortForm) {
        let value = Math.random().toString(36).slice(2)
        if (value.length < 11)
            value += '0'
        return value
    }

    if (!forBlock)
        return crypto.randomUUID()

    // prevent uuid collisions with existed blocks & pages
    let uuid: string
    while (true) {
        uuid = crypto.randomUUID()

        // @ts-expect-error
        const block = top!.logseq.api.get_block(uuid)
        if (block)
            continue

        // @ts-expect-error
        const page = top!.logseq.api.get_page(uuid)
        if (page)
            continue

        break
    }
    return uuid
}
function dev_parseMarkup(context: C, text: string): MLDOC_Node[] {
    text = _asString(text)
    return new LogseqMarkup(context).parse(text)
}
function dev_compileMarkup(context: C, nodes: MLDOC_Node[]) {
    return new MldocASTtoHTMLCompiler(context).compile(nodes)
}
export function dev_toHTML(context: C, text: string): string {
    text = _asString(text)
    return new LogseqMarkup(context).toHTML(text)
}
function dev_asset(context: C, name: string): string {
    name = _asString(name)
    let originalProtocol: string
    try {
        const url = new URL(name)
        originalProtocol = url.protocol.replace(/:$/, '')
        name = name.slice((originalProtocol + '://').length)
    }
    catch (error) {
        originalProtocol = ''
    }

    const [ protocol, link ] = resolveAssetsLink(context, originalProtocol || 'assets', name)
    return `${protocol}://${link}`
}
function dev_color(value: string): string {
    value = _asString(value)
    value = unquote(value)
    if (!value)
        return ''

    if (value.startsWith('#'))
        value = value.slice(1)

    if (/^(?:[0-9a-f]{3}){1,2}$/i.test(value))
        return '#' + value

    const div = document.createElement('div')
    div.style.color = value

    const color = div.style.color
    const rgb = color.slice(4, -1).split(', ').map(x => Number(x))
    return rgbToHex(...rgb as [number, number, number])
}
export function dev_get(context: C, path: string, obj?: any): string {
    path = _asString(path)

    function getByPath(obj: any, parts: string[]) {
        while (parts.length) {
            if (typeof obj !== 'object')
                return undefined

            let attr = parts.shift() as string

            if (attr === '@') {
                if (!parts.length) {
                    obj = obj['props'] ?? obj['properties-text-values']
                    continue
                }

                let token = parts.at(0)  // @token1
                const refs = (obj['propsRefs'] ?? obj['properties'])[token as string]

                if (refs === undefined || refs.length === 0) {
                    obj = obj['props'] ?? obj['properties-text-values']
                    continue
                }

                token = parts.at(1)  // @token1.token2
                if (token === undefined) {
                    // fallback to props text values
                    obj = obj['props'] ?? obj['properties-text-values']
                    continue
                }

                parts.shift()  // release token1
                parts.shift()  // release token2

                let index = Number(token)
                if (Number.isNaN(index)) {
                    // get all refs
                    obj = refs.map((r) => `[[${r}]]`)
                    break
                }

                // get ref at index
                index = Math.min(index, refs.length - 1)
                obj = `[[${refs.at(index)}]]`

                continue
            }

            obj = obj[attr]
        }

        return obj
    }

    path = path.replaceAll('@', '.@.')
    const parts = path.split('.').filter(p => p !== '')

    if (parts[0] === 'c' && obj === undefined)
        parts.shift()

    if (!parts.length)
        return ''

    obj = obj !== undefined ? obj : context
    return getByPath(obj, parts) ?? ''
}

function dev_links(context: C, text: string, withLabels: boolean = false): any[] {
    const links: any[] = []

    const nodes = new LogseqMarkup(context).parse(text)
    walkNodes(nodes, (type, data, node, process) => {
        if (type === 'Link') {
            let label = data.label
            const [ type, url ] = data.url
            if (type === 'Complex') {
                const { protocol, link } = url
                const result = `${protocol}://${link}`
                links.push([result, parse_cleanMarkup(context, label)])
            }
        }
        else if (type === 'Emphasis') {
            const [ [emphasis], subNodes ] = data
            subNodes.map(process)
        }
    })

    if (withLabels)
        return links
    return links.map(([x, l]) => x)
}
function dev_refs(context: C, text: string, withLabels: boolean = false,
    filterItems: ('page' | 'tag' | 'block')[] = [],
): any[] {
    let refs: any[] = []

    const nodes = new LogseqMarkup(context).parse(text)
    walkNodes(nodes, (type, data, node, process) => {
        if (type === 'Tag') {
            const ref = parse_cleanMarkup(context, [[type, data]], {cleanRefs: true})
            refs.push(['tag', ref, ''])
        }
        else if (type === 'Link') {
            const labelNode = data.label ?? ''
            const label = labelNode.length ? parse_cleanMarkup(context, labelNode) : ''

            const [ type, url ] = data.url
            if (type === 'Page_ref')
                refs.push(['page', url, label])
            else if (type === 'Block_ref')
                refs.push(['block', url, label])
        }
        else if (type === 'Emphasis') {
            const [ [emphasis], subNodes ] = data
            subNodes.map(process)
        }
    })

    if (filterItems.length)
        refs = refs.filter(([t]) => filterItems.includes(t))
    if (withLabels)
        return refs
    return refs.map(([t, r, l]) => [t, r])
}
function dev_refs__blocks(context: C, text: string, withLabels?: boolean) {
    return dev_refs(context, text, withLabels, ['block'])
        .map(([t, ...xs]) => withLabels ? xs : xs[0])
}
function dev_refs__pages(context: C, text: string, withLabels?: boolean) {
    return dev_refs(context, text, withLabels, ['page', 'tag'])
        .map(([t, ...xs]) => withLabels ? xs : xs[0])
}
function dev_refs__pagesOnly(context: C, text: string, withLabels?: boolean) {
    return dev_refs(context, text, withLabels, ['page'])
        .map(([t, ...xs]) => withLabels ? xs : xs[0])
}
function dev_refs__tagsOnly(context: C, text: string, withLabels?: boolean) {
    return dev_refs(context, text, withLabels, ['tag'])
        .map(([t, ...xs]) => withLabels ? xs : xs[0])
}

const dev_tree_walk__old = async function (root, callback) {
    logseq.UI.showMsg(
        '"dev.walkTree" is deprecated. Please use "dev.tree.walkAsync" instead',
        'warning', {timeout: 15000}
    )
    console.warn(p`"dev.walkTree" is deprecated. Please use "dev.tree.walkAsync" instead`)

    return walkBlockTreeAsync(root, callback)
}
dev_tree_walk__old.obsolete = true


/* «parse» namespace */
type ParseSource = string | PageContext | PageEntity | BlockContext | BlockEntity
type Parser = (context: C, text: string, withLabels?: boolean) => any[]
async function _parse_items(context: C, parser: Parser, source: ParseSource, withLabels: boolean): Promise<any[]> {
    if (typeof source === 'string')
        return parser(context, source, withLabels)

    if (source['name'])  // PageContext or PageEntity
        source = `[[${source['name']}]]`

    if (source['content'])  // BlockContext or BlockEntity
        source = `((${source['uuid']}))`

    const sourceRef = parseReference(source as string)
    if (!sourceRef)
        return []

    let blocks: BlockEntity[] = []
    if (['uuid', 'block'].includes(sourceRef.type)) {
        const [ block ] = await getBlock(sourceRef, { includeChildren: true })
        if (block)
            blocks = [ block ]
    } else
        blocks = await logseq.Editor.getPageBlocksTree(sourceRef.value as string) ?? []

    const items: ReturnType<typeof parser> = []
    for (const block of blocks) {
        walkBlockTree(block as IBlockNode, (b) => {
            for (const item of parser(context, b.content!, withLabels))
                items.push(item)
        })
    }

    return items
}

async function parse_links(context: C, source: ParseSource, withLabels: boolean = false): Promise<string[][]> {
    return await _parse_items(context, dev_links, source, withLabels)
}
async function parse_refs(context: C, source: ParseSource, withLabels: boolean = false): Promise<string[][]> {
    return await _parse_items(context, dev_refs, source, withLabels)
}
async function parse_refs__blocks(context: C, source: ParseSource, withLabels: boolean = false): Promise<string[][]> {
    return await _parse_items(context, dev_refs__blocks, source, withLabels)
}
async function parse_refs__pages(context: C, source: ParseSource, withLabels: boolean = false): Promise<string[][]> {
    return await _parse_items(context, dev_refs__pages, source, withLabels)
}
async function parse_refs__pages_only(context: C, source: ParseSource, withLabels: boolean = false): Promise<string[][]> {
    return await _parse_items(context, dev_refs__pagesOnly, source, withLabels)
}
async function parse_refs__tags_only(context: C, source: ParseSource, withLabels: boolean = false): Promise<string[][]> {
    return await _parse_items(context, dev_refs__tagsOnly, source, withLabels)
}

function parse_cleanMarkup(context: C, obj: string | MLDOC_Node[], opts?: {cleanRefs?: boolean, cleanLabels?: boolean}) {
    if (Array.isArray(obj))
        return (new LogseqMarkup(context).cleanAST(obj, opts)).join('')
    return new LogseqMarkup(context).clean(obj, opts)
}


/* internal */
function array_zip(...arrs: any[][]) {
    return Array(
        Math.min(...arrs.map(a => a.length))
    )
    .fill(undefined)
    .map((_, i) => arrs.map(a => a[i]))
}
function array_zipWith(...arrs: any[][]) {
    // @ts-expect-error
    return array_zip(this, ...arrs)
}
function array_unique() {
    // @ts-expect-error
    return [...new Set(this)]
}
function array_groupby(key: Function, wrapToObject: boolean = true) {
    // @ts-expect-error
    const grouped = Object.groupBy(this, key)
    if (wrapToObject)
        return grouped
    return Object.entries(grouped)
}
function array_countby(key: Function, wrapToObject: boolean = true) {
    // @ts-expect-error
    const counted = this.groupby(key, false)
        .map(([key, items]) => [key, (items as any[]).length])
    if (wrapToObject)
        return Object.fromEntries(counted)
    return counted
}
export function array_sorted(key: Function) {
    // @ts-expect-error
    return this
        .map((x) => [(key ? key(x) : x), x])
        .sort((a, b) => {
            a = a[0]; b = b[0];
            if (!Array.isArray(a)) a = [a];
            if (!Array.isArray(b)) b = [b];
            for (let i = 0; i < a.length; i++) {
                const xa = (a[i] ?? '').toString()
                const xb = (b[i] ?? '').toString()
                const d = xa.localeCompare(xb, 'en', {numeric: true})
                if (d !== 0) return d;
            }
            return 0
        })
        .map((p) => p[1])
}


/* «cursor» namespace */
function cursor(context: C) {
    const env = _env(context)
    env.state({cursorPosition: true})
    return Template.carriagePositionMarker
}


/* «blocks» namespace */
async function blocks_selected(context: C, opts?: {treatSingleBlockAsChildrenList?: boolean}) {
    const [ blocks ] = await getChosenBlocks(opts)
    return blocks
}
function blocks_uuid(context: C) {
    // no need to set uuid for block while rendering view
    // it is always single block
    if (context.mode === 'view')
        return context.currentBlock.uuid!

    const isHeadTemplateBlock = context.template!.includingParent
        ? context.template!.block.id === context.self!.id
        : (context.template!.block.children![0] as BlockEntity).id === context.self!.id

    const uuid = isHeadTemplateBlock
        ? context.currentBlock.uuid!
        : dev_uuid(false, true)

    const env = _env(context)
    env.state({setUUID: uuid})

    return uuid
}

function _blocks_insert_single(
    context: C, isSibling: boolean, content: string, properties?: Record<string, any>,
    opts?: {cursorPosition?: true, setUUID?: string},
) {
    const env = _env(context)
    const attr = isSibling ? 'appendedBlocks' : 'spawnedBlocks'
    const blocks = env.state()[attr] ?? []

    const node: IBlockNode = { content, children: [] }
    if (properties && Object.keys(properties).length)
        node.properties = properties

    prepareRenderedNode(node, opts)

    blocks.push(node)
    env.state({[attr]: blocks})
}
function _blocks_insert_multiple(context: C, isSibling: boolean, root: IBlockNode) {
    const env = _env(context)
    const attr = isSibling ? 'appendedBlocks' : 'spawnedBlocks'
    const blocks = env.state()[attr] ?? []

    walkBlockTree(root, (node) => {
        prepareRenderedNode(node)
    })

    blocks.push(root)
    env.state({[attr]: blocks})
}
function blocks_spawn(context: C, content: string, properties?: Record<string, any>, opts?: {cursorPosition?: true}) {
    _blocks_insert_single(context, false, content, properties, opts)
}
function blocks_spawn__tree(context: C, root: IBlockNode) {
    _blocks_insert_multiple(context, false, root)
}
function blocks_append(context: C, content: string, properties?: Record<string, any>, opts?: {cursorPosition?: true}) {
    _blocks_insert_single(context, true, content, properties, opts)
}
function blocks_append__tree(context: C, root: IBlockNode) {
    _blocks_insert_multiple(context, true, root)
}

export function blocks_skip(context: C, opts?: {self?: boolean, children?: boolean}) {
    const env = _env(context)

    opts = opts ?? {}

    if (opts.children === undefined)
        opts.children = false

    if (opts.self === undefined)
        opts.self = true

    if (opts.self)
        env.state({skip: true})

    if (opts.children)
        env.state({skipChildren: true})
}


function _env(context: C) {
    // @ts-expect-error
    return context.__env
}


class ContextBinder {
    private context: C

    constructor(context: C) {
        this.context = context
    }

    bindFunction(f) {
        const signature = functionSignature(f)
        if (!signature)
            return f

        const { args, whole } = signature
        const prefixArg = 'context'
        const prefixArgs = prefixArg + ', '
        if (!args.startsWith(prefixArgs) && args !== prefixArg)
            return f

        const func = f.bind(null, this.context)
        func.toString = () => whole
            .replace('(' + prefixArg + ')', '()')
            .replace('(' + prefixArgs, '(')
        return func
    }
    createNamespace(f?: Function, items: Record<string, Function | TagsNamespace | string> = {}) {
        f = f ? this.bindFunction(f) : undefined

        const itemsEntries = Object
            .entries(items ?? {})
            .map(([k, v]) => {
                if (!( v instanceof TagsNamespace ))
                    v = this.bindFunction(v)
                return [k, v]
            })
        return new TagsNamespace(f, Object.fromEntries(itemsEntries))
    }
}


export class TagsNamespace extends Function {
    public __self__?: Function
    // @ts-expect-error
    public data: Record<string, Function | TagsNamespace | string>

    constructor(f?: Function, data: Record<string, Function | TagsNamespace | string> = {}) {
        super('...args', 'return this.call(...args)')

        const self = this.bind(this, [f])

        self.__self__ = f
        self.data = data
        Object.assign(self, data)

        return self
    }

    call([func, data], ...args: any[]) {
        if (!func)
            throw new TypeError('This namespace cannot be called')
        return func(...args)
    }
    filterForDisplaying() {
        const self = this.__self__ ? Context.filterForDisplaying_function(this.__self__) : ''

        const data = Object
            .entries(this.data)
            .filter(([k, v]) => !k.startsWith('_'))
            // @ts-expect-error
            .filter(([k, v]) => !v.obsolete)

        if (!data.length)
            return self

        const result = {}
        if (self)
            result['()'] = self

        const displayData = data.map(([k, v]) => {
            if (v instanceof TagsNamespace)
                return [k, v.filterForDisplaying()]
            return [k, Context.filterForDisplaying_function(v)]
        })
        return Object.assign(result, Object.fromEntries(displayData))
    }
    toString() {
        const value = this.filterForDisplaying()
        if (typeof value === 'string')
            return value

        // pretty print whole namespace body
        const obj = JSON.stringify(value, null, '\t')
        return '<pre>' + obj + '</pre>'
    }
}


function _initContext() {
    // @ts-expect-error
    Array.zip = array_zip
    // @ts-expect-error
    Array.prototype.zipWith = array_zipWith

    // @ts-expect-error
    Array.prototype.unique = array_unique
    // @ts-expect-error
    Array.prototype.groupby = array_groupby
    // @ts-expect-error
    Array.prototype.countby = array_countby
    // @ts-expect-error
    Array.prototype.sorted = array_sorted
}

export function getTemplateTagsDatesContext() {
    const todayObj = dayjs().startOf('second')
    const yesterdayObj = todayObj.subtract(1, 'day').startOf('day')
    const tomorrowObj = todayObj.add(1, 'day').startOf('day')

    const yesterday = yesterdayObj.format(isoDateFromat)
    const today = todayObj.format(isoDateFromat)
    const tomorrow = tomorrowObj.format(isoDateFromat)
    const time = dayjs().format('HH:mm')

    return {
        yesterday, today, tomorrow, time,

        date: new Context({
            yesterday: yesterdayObj,
            today: todayObj.startOf('day'),
            now: todayObj,
            tomorrow: tomorrowObj,

            from: dayjs,
        }),
    }
}
export function getTemplateTagsContext(context: C) {
    const datesContext = getTemplateTagsDatesContext()
    const cb = new ContextBinder(context)

    return cb.createNamespace(undefined, {
        __init: _initContext,

        sleep,
        ref, bref, tag, embed,
        empty, bool, when, fill, zeros, spaces,

        yesterday: datesContext.yesterday,
        today: datesContext.today,
        tomorrow: datesContext.tomorrow,
        time: datesContext.time,

        date: cb.createNamespace(undefined,
            Object.assign(datesContext.date, {
                nlp: date_nlp,
                fromJournal: date_from_journal,
            } as Record<string, Function>),
        ),

        include: cb.createNamespace(include, {
            template: include__template,
            view: include__view,
            inlineView: include__inlineView,
        }),
        layout: cb.createNamespace(layout, {
            template: layout__template,
            args: layout__args,
        }),

        cursor: cb.createNamespace(cursor, {
            selection: getEditingCursorSelection,
        }),

        blocks: cb.createNamespace(undefined, {
            uuid: blocks_uuid,
            skip: blocks_skip,
            selected: blocks_selected,
            edit: editBlockWithSelection,

            spawn: cb.createNamespace(blocks_spawn, {
                tree: blocks_spawn__tree,
            }),
            append: cb.createNamespace(blocks_append, {
                tree: blocks_append__tree,
            }),

            actions: cb.createNamespace(undefined, {
                update: updateBlocksAction,
            }),
        }),

        parse: cb.createNamespace(undefined, {
            cleanMarkup: parse_cleanMarkup,
            links: parse_links,
            refs: cb.createNamespace(parse_refs, {
                blocks: parse_refs__blocks,
                pages: parse_refs__pages,
                pagesOnly: parse_refs__pages_only,
                tagsOnly: parse_refs__tags_only,
            }),
        }),

        query: cb.createNamespace(undefined, {
            table: query_table_no_save_state,
            table_: query_table_save_state,
            pages: query_pages,
            refs: cb.createNamespace(undefined, {
                count: query_refsCount,
                journals: query_journalRefs,
                pages: query_pageRefs,
            }),
        }),

        dev: cb.createNamespace(undefined, {
            dump: dev_dump,
            uuid: dev_uuid,

            parseMarkup: dev_parseMarkup,
            compileMarkup: dev_compileMarkup,
            toHTML: dev_toHTML,

            asset: dev_asset,
            color: dev_color,
            cssVars: getCSSVars,

            get: dev_get,
            links: dev_links,
            refs: cb.createNamespace(dev_refs, {
                blocks: dev_refs__blocks,
                pages: dev_refs__pages,
                pagesOnly: dev_refs__pagesOnly,
                tagsOnly: dev_refs__tagsOnly,
            }),

            walkTree: dev_tree_walk__old,
            tree: cb.createNamespace(undefined, {
                walk: function (root, callback) { return walkBlockTree(root, callback) },
                walkAsync: async function (root, callback) { return walkBlockTreeAsync(root, callback) },
                getNode: getTreeNode,
            }),

            context: cb.createNamespace(undefined, {
                page: function (entity) { return PageContext.createFromEntity(entity) },
                block: function (entity) { return BlockContext.createFromEntity(entity) },
            }),
        }),
    })
}

export const _private = {
    ref, tag, embed, empty, bool, when, fill, zeros, spaces,
}
