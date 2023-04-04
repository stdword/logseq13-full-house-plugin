import { log } from 'console'
import { BlockContext, Context, dayjs, Dayjs, ILogseqContext, PageContext }  from './context'

import { getPage, isEmptyString, isObject, isUUID, LogseqMarkup, LogseqReference, MLDOC_Node, p, resolveAssetsLink } from './utils'


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
function when(condition: boolean | any, obj: string | any): string {
    condition = !!condition
    obj ??= ''
    obj = obj.toString()

    if (condition)
        return obj

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


export function getTemplateTagsContext(context: ILogseqContext): ITemplateTagsContext {
    const todayObj = dayjs()
    const yesterdayObj = todayObj.subtract(1, 'day').startOf('day')
    const tomorrowObj = todayObj.add(1, 'day').startOf('day')

    const yesterday = yesterdayObj.format(isoDateFromat)
    const today = todayObj.format(isoDateFromat)
    const tomorrow = tomorrowObj.format(isoDateFromat)
    const time = dayjs().format('HH:mm')

    function parseMarkup(text: string): MLDOC_Node[] {
        text = text.toString()
        return new LogseqMarkup(context).parse(text)
    }
    function toHTML(text: string): string {
        text = text.toString()
        return new LogseqMarkup(context).toHTML(text)
    }
    function asset(name: string) {
        name = name.toString()
        const [ protocol, link ] = resolveAssetsLink(context, 'assets', name)
        return `${protocol}://${link}`
    }

    return {
        ref, bref, embed,
        empty, when, fill, zeros,
        yesterday, today, tomorrow, time,
        dev: new Context({
            parseMarkup,
            toHTML,
            asset,
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
