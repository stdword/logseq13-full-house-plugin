import '@logseq/libs'
import { BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import dayjs, { Dayjs }  from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import advancedFormat    from 'dayjs/plugin/advancedFormat'
import weekday           from 'dayjs/plugin/weekday'
import dayOfYear         from 'dayjs/plugin/dayOfYear'
import weekOfYear        from 'dayjs/plugin/weekOfYear'
import quarterOfYear     from 'dayjs/plugin/quarterOfYear'
import duration          from 'dayjs/plugin/duration'
import UTC               from 'dayjs/plugin/utc'
import updateLocale      from 'dayjs/plugin/updateLocale'
import logseqPlugin      from './utils/dayjs_logseq_plugin'

import { f, isEmptyString, p, toCamelCase } from './utils'
import { type } from 'os'

export { dayjs }
dayjs.extend(customParseFormat)
dayjs.extend(advancedFormat)
dayjs.extend(weekday)
dayjs.extend(dayOfYear)
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)

dayjs.extend(duration)

dayjs.extend(UTC)
dayjs.extend(updateLocale)

dayjs.extend(logseqPlugin)


export class Context {
    constructor(data: {[index: string]: any} = {}) {
        Object.assign(this, data)
    }
    filterForDisplaying() {
        const result = {}
        for (let [ field, value ] of Object.entries(this)) {
            if (field.startsWith('_'))
                continue

            if (value instanceof Context)
                value = value.filterForDisplaying()
            else if (Array.isArray(value))
                value = value.map(item => {
                    if (item instanceof Context)
                        return item.filterForDisplaying()
                    return item
                })
            result[field] = value
        }
        return result
    }
    toString() {
        // pretty print whole context body
        return (
            '```json\n' +
            JSON.stringify(this.filterForDisplaying(), null, 4) +
            '\n```'
        )
    }
}

export class PageContext extends Context {
    private _page?: PageEntity

    public id: number
    public uuid?: string
    public name?: string  // original
    public name_?: string  // id: lowercased
    public isJournal?: boolean
    public day?: Dayjs
    public file?: any
    public propsRefs?: PropertiesRefs

    static createFromEntity(page: PageEntity) {
        const obj = new PageContext(page.id, page.originalName)
        obj._page = page

        obj.uuid = page.uuid
        obj.file = page.file   // TODO: construct file

        const props = PropertiesUtils.getProperties(page)
        obj.propsRefs = (new Context(props.refs)) as unknown as PageContext['propsRefs']

        obj.isJournal = page['journal?']

        const day = page.journalDay?.toString()
        if (day)
            obj.day = dayjs(day, 'YYYYMMDD').startOf('day')
        return obj
    }

    constructor(id: number, name: string) {
        super()

        this.id = id
        if (name) {
            this.name = name
            this.name_ = name.toLowerCase()
        }
    }
}

export class BlockContext extends Context {
    private _block: BlockEntity

    public id: number
    public uuid: string
    public content: string

    public props: Properties
    public propsRefs: PropertiesRefs

    public page: PageContext
    public parentBlock: {id: number} | null
    public prevBlock: {id: number} | null
    public level: number

    public children: ({} | BlockContext)[]
    public refs: {id: number}[]

    constructor(block: BlockEntity, args: {
        page?: PageEntity | PageContext,
        level?: number,
    } = {}) {
        super()
        this._block = block ;

        ({
            id: this.id,
            uuid: this.uuid,
            content: this.content,
            refs: this.refs,
        } = block)

        const props = PropertiesUtils.getProperties(block)
        this.props = (new Context(props.values)) as unknown as BlockContext['props']
        this.propsRefs = (new Context(props.refs)) as unknown as BlockContext['propsRefs']

        const page = args.page
        if (page)
            if (page instanceof PageContext)
                this.page =  page
            else
                this.page = PageContext.createFromEntity(page)
        else
            this.page = new PageContext(block.page.id, block.page.originalName ?? '')

        this.parentBlock = block.page.id !== block.parent.id ? {id: block.parent.id} : null
        this.prevBlock = block.parent.id !== block.left.id ? {id: block.left.id} : null
        this.level = args.level ?? 0

        this.children = block.children ?? []
        if (this.children.length > 0) {
            if (Array.isArray(this.children[0]))  // non-tree mode: get only children count
                this.children = Array(this.children.length).fill({})
            else  // tree mode
                this.children = this.children.map(
                    b => new BlockContext(b as BlockEntity, {
                        level: this.level + 1,
                        page: this.page,
                    })
                )
        }
    }
}


type LogseqProperty = { name: string, text: string, refs: string[] }

type Properties     = {[index: string]: string  }
type PropertiesRefs = {[index: string]: string[]}

export class PropertiesUtils {
    static propertyContentFormat = f`^${'pattern'}::[^\\n]*?\\n?$`
    static propertyRestrictedChars = ':;,^@#~"`/|\\(){}[\\]'

    static getProperty(obj: BlockEntity | PageEntity, name: string): LogseqProperty {
        const nameCamelCased = toCamelCase(name)

        let refs: string[] = []
        if (obj.properties) {
            const val = obj.properties[nameCamelCased]
            refs = Array.isArray(val) ? val : []
        }

        let text: string = ''
        if (obj.propertiesTextValues)
            text = obj.propertiesTextValues[nameCamelCased] ?? ''

        return {
            name: nameCamelCased,
            text,
            refs,
        }
    }
    static deleteProperty(block: BlockEntity, name: string): void {
        const nameCamelCased = toCamelCase(name)

        if (block.properties)
            delete block.properties[nameCamelCased]
        if (block.propertiesTextValues)
            delete block.propertiesTextValues[nameCamelCased]

        block.content = block.content.replaceAll(
            new RegExp(PropertiesUtils.propertyContentFormat({pattern: name}), 'gim'),
            '',
        )
    }
    static getPropertyNames(text: string): string[] {
        const propertyNames: string[] = []
        const propertyLine = new RegExp(PropertiesUtils.propertyContentFormat({
            pattern: `([^${PropertiesUtils.propertyRestrictedChars}]+)`
        }), 'gim')
        text.replaceAll(propertyLine, (m, name) => {propertyNames.push(name); return m})
        return propertyNames
    }
    static getProperties(obj: BlockEntity | PageEntity) {
        const values: Properties = {}
        const refs: PropertiesRefs = {}

        const names = !!obj.content
            ? PropertiesUtils.getPropertyNames(obj.content)
            : Object.keys(obj.properties ?? {})

        for (const name of names) {
            const p = PropertiesUtils.getProperty(obj, name)
            values[name] = values[p.name] = p.text
            refs[name] = refs[p.name] = p.refs
        }

        return {values, refs}
    }
}


export interface ILocalContext {
    page: PageContext
    block: BlockContext
    self: BlockContext
    template: {
        name: string,
        includingParent: boolean,
        block: BlockContext,
        props: Properties,
        propsRefs: PropertiesRefs,
    }
    config: {
        pluginVersion: string,

        preferredTodo: 'LATER' | 'TODO',
        preferredWorkflow: 'now' | 'todo',

        currentGraph: string,

        enabledFlashcards: boolean,
        enabledJournals: boolean,
        showBrackets: boolean,

        preferredThemeMode: 'light' | 'dark',

        preferredFormat: 'markdown' | 'org',

        preferredLanguage: string,
        preferredDateFormat: string,
        preferredStartOfWeek: number,
    }
}


export async function getConfigContext() {
    // TODO: use full config
    // const fullConfig = await logseq.App.getCurrentGraphConfigs()

    const config = await logseq.App.getUserConfigs()
    delete config.me

    return {...config, pluginVersion: await logseq.baseInfo.version}
}


export function getGlobalContext(): {
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
        now: Dayjs,
        tomorrow: Dayjs

        from: Function,
    }
} {
    const isoDateFromat = 'YYYY-MM-DD'

    const todayObj = dayjs()
    const yesterdayObj = todayObj.subtract(1, 'day').startOf('day')
    const tomorrowObj = todayObj.add(1, 'day').startOf('day')

    function _tryAsDateString(item: string): string | null {
        const day = dayjs(item, isoDateFromat, true)  // strict mode
        if (day.isValid()) {
            // @ts-expect-error
            return day.toPage()
        }
        return null
    }

    // All these template tags could be used in raw javascript template code
    // → type declarations could be violated
    // → use .toString() where necessary

    function _ref(item: string): string {
        const name = item.toString()
        return `[[${name}]]`
    }
    function _bref(item: string): string {
        const uuid = item.toString()
        return `((${uuid}))`
    }

    const ref = (item: string | BlockContext | PageContext | Dayjs) => {
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
    const bref = (item: string | BlockContext | PageContext | Dayjs) => {
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
    const embed = (item: string | BlockContext | PageContext | Dayjs) => {
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

    const empty = (obj: string | undefined, fallback: string = '') => {
        obj ??= ''
        obj = obj.toString()

        if (isEmptyString(obj))
            return fallback
        return obj
    }
    const fill = (value: string | number, char: string, width: number) => {
        value = value.toString()
        const count = Math.max(0, width - value.length)
        return char.repeat(count) + value
    }
    const zeros = (value: string | number, width: number) => {
        return fill(value, '0', width)
    }

    const yesterday = yesterdayObj.format(isoDateFromat)
    const today = todayObj.format(isoDateFromat)
    const tomorrow = tomorrowObj.format(isoDateFromat)
    const time = dayjs().format('HH:mm')

    const date = {
        yesterday: yesterdayObj,
        today: todayObj.startOf('day'),
        now: todayObj,
        tomorrow: tomorrowObj,
        from: dayjs,
    }

    return {
        ref, bref, embed,
        empty, fill, zeros,
        yesterday, today, tomorrow, time,
        date,
    }
 }
