import { log } from 'console'
import { BlockContext, dayjs, Dayjs, PageContext }  from './context'

import { getPage, isEmptyString, isObject, isUUID, LogseqReference, p } from './utils'


const isoDateFromat = 'YYYY-MM-DD'

type ITemplateTagsContext = {
    ref: Function
    bref: Function
    embed: Function

    empty: Function
    fill: Function
    zeros: Function

    yesterday: string
    today: string
    tomorrow: string
    time: string

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
// → use .toString() where necessary

function _tryAsDateString(item: string): string | null {
    const day = dayjs(item, isoDateFromat, true)  // strict mode
    if (day.isValid()) {
        // @ts-expect-error
        return day.toPage()
    }
    return null
 }
function _ref(name: string): string {
    name = name.toString()
    return `[[${name}]]`
 }
function _bref(uuid: string): string {
    uuid = uuid.toString()
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

    const str = item as string
    if (isUUID(str))
        return _bref(str)

    // check for the case `ref(today)`
    const date = _tryAsDateString(str)
    return _ref(date ?? str)
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
function empty(obj: string | undefined, fallback: string = ''): string {
    obj ??= ''
    obj = obj.toString()

    if (isEmptyString(obj))
        return fallback
    return obj
 }
function fill(value: string | number, char: string, width: number): string {
    value = value.toString()
    const count = Math.max(0, width - value.length)
    return char.repeat(count) + value
 }
function zeros(value: string | number, width: number = 2): string {
    return fill(value, '0', width)
 }

export function getTemplateTagsContext(): ITemplateTagsContext {
    const todayObj = dayjs()
    const yesterdayObj = todayObj.subtract(1, 'day').startOf('day')
    const tomorrowObj = todayObj.add(1, 'day').startOf('day')

    const yesterday = yesterdayObj.format(isoDateFromat)
    const today = todayObj.format(isoDateFromat)
    const tomorrow = tomorrowObj.format(isoDateFromat)
    const time = dayjs().format('HH:mm')

    return {
        ref, bref, embed,
        empty, fill, zeros,
        yesterday, today, tomorrow, time,
        date: {
            yesterday: yesterdayObj,
            today: todayObj.startOf('day'),
            now: todayObj,
            tomorrow: tomorrowObj,
            from: dayjs,
        },
    }
 }
