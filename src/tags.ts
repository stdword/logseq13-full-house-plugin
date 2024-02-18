import '@logseq/libs'
import { BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import * as Sherlock from 'sherlockjs'

import { LogseqDayjsState } from './extensions/dayjs_logseq_plugin'
import { LogseqMarkup, MLDOC_Node, resolveAssetsLink } from './extensions/mldoc_ast'
import { ArgsContext, BlockContext, Context, dayjs, Dayjs, ILogseqContext, ILogseqCurrentContext, PageContext }  from './context'
import {
    cleanMacroArg,
    coerceStringToBool,
    escape,
    escapeMacroArg,
    getBlock, getPage, IBlockNode, isEmptyString, isObject, isUUID,
    LogseqReference, p, parseReference, RendererMacro, splitMacroArgs, unquote, walkBlockTree
} from './utils'
import { compileTemplateView, getArgsContext, getTemplate, getTemplateBlock, templateMacroStringForBlock } from './logic'
import { StateError } from './errors'
import { ITemplate, Template } from './template'
import { PagesQueryBuilder } from './query'


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

function ref(item: string | BlockContext | PageContext | Dayjs, label: string | null = null): string {
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
function embed(item: string | BlockContext | PageContext | Dayjs): string {
    const r = ref(item)
    return `{{embed ${r}}}`
}

async function _include__template(context: ILogseqContext, layoutMode: boolean, ref: LogseqReference, args?: string[]): Promise<string> {
    let block: BlockEntity
    try {
        [block, ] = await getTemplateBlock(ref)
    } catch (error) {  // StateError
        return ''
    }

    let command = RendererMacro.command('template').arg(ref.value as string)

    if (!args)
        args = Template.getUsageArgs(block)
    if (layoutMode)
        args.push(`:transcluded-from ${context.template!.block.id}`)
    command = command.args(args)

    return command.toString()
}
async function _include__view(context: ILogseqContext, layoutMode: boolean, ref: LogseqReference, args?: string[]): Promise<string> {
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

    return await compileTemplateView(
        // @ts-expect-error
        context.identity.slot,
        template,
        args,
        context as ILogseqCurrentContext,
        argsContext,
    )
}
async function _include(context: ILogseqContext, layoutMode: boolean, name: string, args?: string[] | string) {
    const ref = parseReference(name ?? '')
    if (!ref)
        return ''

    if (args !== undefined && !Array.isArray(args))
        args = splitMacroArgs(args.toString())
    args = args as string[] | undefined

    if (args)  // runtime protection
        args = args.map((arg) => arg.toString())

    if (context.mode === 'template')
        return await _include__template(context, layoutMode, ref, args)
    else if (context.mode === 'view')
        return await _include__view(context, layoutMode, ref, args)

    console.debug(p`Unknown rendering mode: ${context.mode}`)
    return ''
}
async function include(context: ILogseqContext, name: string, args?: string[] | string) {
    return await _include(context, false, name, args)
}
async function layout(context: ILogseqContext, name: string, args?: string[] | string) {
    return await _include(context, true, name, args)
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


/* date */
function date_nlp(context: ILogseqContext, query: string, now: Dayjs | string = 'now'): Dayjs | null {
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


/* query */
function query_pages() {
    return new PagesQueryBuilder()
}
function query_random_block() {

}

function query_refsCount(context: ILogseqContext, page: PageContext | string = '') {
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

function queryRefs(
    context: ILogseqContext,
    page: PageContext | string = '',
    only: 'journals' | 'pages' | '' = '',
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
      [:find (pull ?p [
        [:block/journal-day :as :day]
        [:block/original-name :as :name] ])
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
        refs.sort((a, b) => b['day'] - a['day'])

    return refs.map((r) => {
        if (only === 'pages')
            return r.name

        if (r.day)
            r.day = PageContext.parseDay(r.day)
        if (only === 'journals')
            return r.day
        return r
    })
}
function query_journalRefs(context: ILogseqContext, page: PageContext | string = '') {
    return queryRefs(context, page, 'journals')
}
function query_pageRefs(context: ILogseqContext, page: PageContext | string = '') {
    return queryRefs(context, page, 'pages')
}


/* dev */
function dev_uuid(shortForm: boolean = false) {
    if (shortForm) {
        let value = Math.random().toString(36).slice(2)
        if (value.length < 11)
            value += '0'
        return value
    }
    return crypto.randomUUID()
}
function parseMarkup(context: ILogseqContext, text: string): MLDOC_Node[] {
    text = _asString(text)
    return new LogseqMarkup(context).parse(text)
 }
function toHTML(context: ILogseqContext, text: string): string {
    text = _asString(text)
    return new LogseqMarkup(context).toHTML(text)
 }
function asset(context: ILogseqContext, name: string): string {
    // TODO: expand '/test.png'
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
function color(value: string): string {
    // TODO: rgb(r, g, b) & others support
    value = _asString(value)
    value = unquote(value)
    if (!value.startsWith('#'))
        value = `#${value}`
    return value
 }
function get(context: ILogseqContext, path: string): string {
    path = _asString(path)

    function getByPath(obj: any, parts: string[]) {
        while (parts.length)
            if (typeof obj == 'object')
                obj = obj[parts.shift() as string]
            else return undefined
        return obj
    }

    path = path.replaceAll('@', '.props.')
    const parts = path.split('.')

    if (parts[0] === 'c')
        parts.shift()

    if (!parts.length)
        return ''

    return getByPath(context, parts) ?? ''
}

function parseLinks(context: ILogseqContext, text: string): string[] {
    const links: string[] = []

    const ast = new LogseqMarkup(context).parse(text)
    for (const [ type, node ] of ast)
        if (type === 'Link') {
            const [ type, url ] = node.url
            if (type === 'Complex') {
                const { protocol, link } = url
                links.push(`${protocol}://${link}`)
            }
        }

    return links
}

async function links(
    context: ILogseqContext,
    source: string | PageContext | BlockContext,
    includeChildren: boolean = false,
): Promise<string[]> {
    if (typeof source === 'string')
        return parseLinks(context, source)

    if (source instanceof PageContext)
        source = source.name_!

    if (source instanceof BlockContext)
        source = source.uuid!

    source = _asString(source)
    const sourceRef = parseReference(source)
    if (!sourceRef)
        return []

    let blocks: BlockEntity[] = []
    if (['uuid', 'block'].includes(sourceRef.type)) {
        const [ block ] = await getBlock(sourceRef, { includeChildren })
        if (block)
            blocks = [ block ]
    } else
        blocks = await logseq.Editor.getPageBlocksTree(sourceRef.value as string) ?? []

    const linksInBlock: string[] = []
    for (const block of blocks)
        await walkBlockTree(block as IBlockNode, async (b, lvl) => {
            for (const link of parseLinks(context, b.content))
                linksInBlock.push(link)
        })

    return linksInBlock
}


/* internal */
function array_zip(...arr: any[]) {
    return Array(
        Math.min(...arr.map(a => a.length))
    )
    .fill(undefined)
    .map((_, i) => arr.map(a => a[i]))
}
function array_unique() {
    // @ts-expect-error
    return [...new Set(this)]
}
function array_groupby(key: Function) {
    // @ts-expect-error
    return Object.groupBy(this, key)
}
function array_sorted(key: Function) {
    // @ts-expect-error
    return this
        .map((x) => [(key ? key(x) : x), x])
        .sort((a, b) => {
            a = a[0]; b = b[0];
            if (!Array.isArray(a)) a = [a];
            if (!Array.isArray(b)) b = [b];
            for (let i = 0; i < a.length; i++) {
                const xa = a[i].toString()
                const xb = b[i].toString()
                const d = xa.localeCompare(xb, 'en', {numeric: true})
                if (d !== 0) return d;
            }
            return 0
        })
        .map((p) => p[1])
}


function bindContext(f, context) {
    const func = f.bind(null, context)
    const signature = f.toString().replace('context, ', '')
    func.toString = () => signature
    return func
}
function _initContext() {
    // @ts-expect-error
    Array.zip = array_zip
    // @ts-expect-error
    Array.prototype.unique = array_unique
    // @ts-expect-error
    Array.prototype.groupby = array_groupby
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
export function getTemplateTagsContext(context: ILogseqContext) {
    const datesContext = getTemplateTagsDatesContext()

    return new Context({
        _: {
            init: _initContext,
            array_zip,
        },

        ref, bref, tag, embed,
        empty, bool, when, fill, zeros, spaces,

        yesterday: datesContext.yesterday,
        today: datesContext.today,
        tomorrow: datesContext.tomorrow,
        time: datesContext.time,

        include: bindContext(include, context),
        layout: bindContext(layout, context),

        query: new Context({
            pages: query_pages,
            refs: new Context({
                count: bindContext(query_refsCount, context),
                journals: bindContext(query_journalRefs, context),
                pages: bindContext(query_pageRefs, context),
        })}),

        dev: new Context({
            uuid: dev_uuid,
            parseMarkup: bindContext(parseMarkup, context),
            toHTML: bindContext(toHTML, context),
            asset: bindContext(asset, context),
            color,
            get: bindContext(get, context),
            links: bindContext(parseLinks, context),
            walkTree: async function (root, callback, level) { return walkBlockTree(root, callback, level) },
            context: new Context({
                page: function (entity) { return PageContext.createFromEntity(entity) },
                block: function (entity) { return BlockContext.createFromEntity(entity) },
            }),
        }),
        date: Object.assign(datesContext.date, {
            nlp: bindContext(date_nlp, context),
        }),
    })
}

export const _private = {
    ref, tag, embed, empty, bool, when, fill, zeros, spaces,
}
