import { BlockContext, dayjs, Dayjs, PageContext }  from './context'

import { isEmptyString, p } from './utils'


const isoDateFromat = 'YYYY-MM-DD'

const todayObj = dayjs()
const yesterdayObj = todayObj.subtract(1, 'day').startOf('day')
const tomorrowObj = todayObj.add(1, 'day').startOf('day')

const yesterday = yesterdayObj.format(isoDateFromat)
const today = todayObj.format(isoDateFromat)
const tomorrow = tomorrowObj.format(isoDateFromat)
const time = dayjs().format('HH:mm')


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
function _ref(item: string): string {
    const name = item.toString()
    return `[[${name}]]`
 }
function _bref(item: string): string {
    const uuid = item.toString()
    return `((${uuid}))`
 }

function ref(item: string | BlockContext | PageContext | Dayjs): string {
    if (item instanceof dayjs) {
        // @ts-expect-error
        item = item.toPage()
    }
    else if (item instanceof BlockContext)
        return _bref(item.uuid)
    else if (item instanceof PageContext)
        item = item.name ?? ''  // TODO: name may be absent: request page by .id then
    else {
        // check for the case `ref(today)`
        const date = _tryAsDateString(item as string)
        item = date ?? item
    }

    return _ref(item as string)
 }
function bref(item: string | BlockContext | PageContext | Dayjs): string {
    if (item instanceof dayjs) {
        // @ts-expect-error
        return _ref(item.toPage())
    }
    else if (item instanceof PageContext)
        return _ref(item.name ?? '')   // TODO: name may be absent: request page by .id then
    else if (item instanceof BlockContext)
        item = item.uuid

    return _bref(item as string)
 }
function embed(item: string | BlockContext | PageContext | Dayjs): string {
    let id: string = ''

    if (item instanceof dayjs)
        id = ref(item)
    else if (item instanceof PageContext)
        id = _ref(item.name || '')   // TODO: name may be absent: request page by .id then
    else if (item instanceof BlockContext)
        id = _bref(item.uuid)
    else  {
        // check for the case `embed(today)`
        const date = _tryAsDateString(item as string)
        if (date)
            id = _ref(date)
        else
            id = _bref(item as string)
    }

    id = id.toString()
    return `{{embed ${id}}}`
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
function zeros(value: string | number, width: number): string {
    return fill(value, '0', width)
 }


export function getTemplateTagsContext(): ITemplateTagsContext {
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
