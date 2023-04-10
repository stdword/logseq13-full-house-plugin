import '@logseq/libs'
import { BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { BlockContext, Context, dayjs, Dayjs, ILogseqContext, PageContext }  from './context'

import { getBlock, getPage, IBlockNode, isEmptyString, isObject, isUUID, LogseqMarkup, LogseqReference, MLDOC_Node, p, parseReference, resolveAssetsLink, unquote, walkBlockTree } from './utils'


const isoDateFromat = 'YYYY-MM-DD'

type ITemplateTagsContext = {
    ref: Function
    bref: Function
    embed: Function

    empty: Function
    when: Function
    fill: Function
    zeros: Function

    yesterday: string
    today: string
    tomorrow: string
    time: string

    dev: {
        parseMarkup: (text: string) => MLDOC_Node[]
        toHTML: (text: string) => string
        asset: (name: string) => string
        color: (value: string) => string
    }

    query: {
        links: Function
    }

    date: {
        yesterday: Dayjs
        today: Dayjs
        now: Dayjs
        tomorrow: Dayjs

        from: Function
    }
}


// These template tags could be used in raw javascript template code
// → type declarations could be violated
// → use this protection where necessary
function _arg(v: any): string {
    v ??= ''
    return v.toString()
 }

function _tryAsDateString(item: string): string | null {
    const day = dayjs(item, isoDateFromat, true)  // strict mode
    if (day.isValid()) {
        // @ts-expect-error
        return day.toPage()
    }
    return null
 }
function _ref(name: string): string {
    name = _arg(name)
    return `[[${name}]]`
 }
function _bref(uuid: string): string {
    uuid = _arg(uuid)
    return `((${uuid}))`
 }

function ref(item: string | BlockContext | PageContext | Dayjs): string {
    item = item ?? ''

    if (item instanceof dayjs) {
        // @ts-expect-error
        item = item.toPage() as string
        return _ref(item)
    }

    if (item instanceof BlockContext) {
        if (item.uuid)
            return _bref(item.uuid)

        // @ts-expect-error
        const block = top!.logseq.api.get_block(item.id)
        return _bref(block?.uuid ?? '')
    }

    if (item instanceof PageContext) {
        if (item.name)
            return _ref(item.name)

        // TODO: need async support for filter function in «eta»
        // const page = await getPage({type: 'id', value: item.id} as LogseqReference)

        // @ts-expect-error
        const page = top!.logseq.api.get_page(item.id)
        return _ref(page?.originalName ?? '')
    }

    let str = item as string
    if (isUUID(str))
        return _bref(str)

    // check for the case `ref(today)`
    const date = _tryAsDateString(str)
    if (date)
        return _ref(date)

    if (str.startsWith('[[') && str.endsWith(']]'))
        str = str.slice(2, -2)

    return _ref(str)
 }
function bref(item: string | BlockContext | PageContext | Dayjs): string {
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
function empty(obj: string | any, fallback: string = ''): string {
    obj = _arg(obj)
    if (isEmptyString(obj))
        return fallback
    return obj
 }
function when(obj: boolean | any, result: string | any): string {
    const condition = !!obj

    if (condition) {
        obj = _arg(obj)
        return _arg(result)
            .replaceAll('${_}', obj)
            .replaceAll('${}', obj)
            .replaceAll('$1', obj)
    }

    return ''
 }
function fill(value: string | number, char: string, width: number): string {
    value = _arg(value)
    char = _arg(char)
    width = Number(_arg(width))
    const count = Math.max(0, width - value.length)
    return char.repeat(count) + value
 }
function zeros(value: string | number, width: number = 2): string {
    return fill(value, '0', width)
 }

/* dev */
function parseMarkup(context: ILogseqContext, text: string): MLDOC_Node[] {
    text = text.toString()
    return new LogseqMarkup(context).parse(text)
 }
function toHTML(context: ILogseqContext, text: string): string {
    text = text.toString()
    return new LogseqMarkup(context).toHTML(text)
 }
function asset(context: ILogseqContext, name: string): string {
    name = name.toString()
    const [ protocol, link ] = resolveAssetsLink(context, 'assets', name)
    return `${protocol}://${link}`
 }
function color(value: string): string {
    // TODO: rgb(r, g, b) & others support
    value = _arg(value)
    value = unquote(value)
    if (!value.startsWith('#'))
        value = `#${value}`
    return value
 }
function get(context: ILogseqContext, path: string): string {
    function getByPath(obj: any, parts: string[]) {
        while (parts.length)
            if (typeof obj == 'object')
                obj = obj[parts.shift() as string]
            else return undefined
        return obj
    }

    path = _arg(path)

    const parts = path.split('.')
    if (parts[0] === 'c')
        parts.shift()

    return getByPath(context, parts) ?? ''
 }

/* search */
//   where: source
//   how: tree-path-spec, by prop, by ancestor?
//   what:
//     links (external, local, assets, images) — how: labeled, with-meta, inclusion
//     pages, tag-pages, ref-pages
//     blocks

async function* links(
    context: ILogseqContext,
    source: string | PageContext | BlockContext,
    criteria?: (protocol: string, link: string) => boolean,
    path: string = '',
) {
    if (source instanceof PageContext)
        source = source.name_!

    if (source instanceof BlockContext)
        source = source.uuid!

    source = source.toString()
    const sourceRef = parseReference(source)
    if (!sourceRef)
        return

    let blocks: BlockEntity[] = []
    if (['uuid', 'block'].includes(sourceRef.type)) {
        const [ block ] = await getBlock(sourceRef, { includeChildren: true })
        if (block)
            blocks = [ block ]
    } else
        blocks = await logseq.Editor.getPageBlocksTree(sourceRef.value as string) ?? []

    for (const block of blocks) {
        const linksInBlock: string[] = []
        await walkBlockTree(block as IBlockNode, async (b, lvl) => {
            const ast = new LogseqMarkup(context).parse(b.content)
            for (const node of ast) {
                if (node[0] === 'Link') {
                    const url = (node[1] ?? {}).url
                    if (url[0] === 'Complex') {
                        const { protocol, link } = url[1]
                        linksInBlock.push(`${protocol}://${link}`)
                    }
                }
            }
        })

        yield* linksInBlock
    }
 }


export function getTemplateTagsContext(context: ILogseqContext): ITemplateTagsContext {
    const todayObj = dayjs()
    const yesterdayObj = todayObj.subtract(1, 'day').startOf('day')
    const tomorrowObj = todayObj.add(1, 'day').startOf('day')

    const yesterday = yesterdayObj.format(isoDateFromat)
    const today = todayObj.format(isoDateFromat)
    const tomorrow = tomorrowObj.format(isoDateFromat)
    const time = dayjs().format('HH:mm')

    return {
        ref, bref, embed,
        empty, when, fill, zeros,
        yesterday, today, tomorrow, time,

        query: {
            links: links.bind(null, context),
        },
        dev: new Context({
            parseMarkup: parseMarkup.bind(null, context),
            toHTML: toHTML.bind(null, context),
            asset: asset.bind(null, context),
            color,
            get: get.bind(null, context),
        }) as unknown as ITemplateTagsContext['dev'],
        date: {
            yesterday: yesterdayObj,
            today: todayObj.startOf('day'),
            now: todayObj,
            tomorrow: tomorrowObj,
            from: dayjs,
        },
    }
 }
