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


export interface IContext {
    [index: string]: any
}


export class PageContext implements IContext {
    private _page: PageEntity

    public id: number
    public uuid: string
    public name: string  // original
    public name_: string  // id: lowercased
    public isJournal: boolean
    public day: Dayjs | null
    public file: any
    public propsRefs: PropertiesRefs

    static async createByName(pageName: string): Promise<PageContext | null> {
        const page: PageEntity | null = await logseq.Editor.getPage(pageName)
        if (!page)
            return null

        return new PageContext(page)
    }
    static async createByUUID(uuid: string): Promise<PageContext | null> {
        const page: PageEntity | null = await logseq.Editor.getPage({uuid})
        if (!page)
            return null

        return new PageContext(page)
    }

    constructor(page: PageEntity) {
        this._page = page;

        ({
            id: this.id,
            uuid: this.uuid,
            originalName: this.name,
            name: this.name_,
            file: this.file, // TODO: construct file
        } = page)

        const props = new PropertiesContext(this._page)
        this.propsRefs = props.refs

        this.isJournal = page['journal?']

        const day = page.journalDay?.toString()
        this.day = day ? dayjs(day, 'YYYYMMDD').startOf('day') : null
    }
}

export class BlockContext implements IContext {
    private _block: BlockEntity

    public id: number
    public uuid: string
    public content: string

    public props: Properties
    public propsRefs: PropertiesRefs

    public page: PageContext | {id: number, name?: string, originalName?: string}
    public parentBlock: {id: number} | null
    public prevBlock: {id: number} | null
    public level: number

    public children: ({} | BlockContext)[]
    public refs: {id: number}[]

    constructor(block: BlockEntity, page: PageEntity | PageContext | null = null) {
        this._block = block;

        ({
            id: this.id,
            uuid: this.uuid,
            content: this.content,
            refs: this.refs,
        } = block)

        const props = new PropertiesContext(this._block)
        this.props = props.values
        this.propsRefs = props.refs

        if (page)
            this.page = (page instanceof PageContext) ? page : new PageContext(page)
        else {
            this.page = {id: this._block.page.id}
            if (this._block.page.name)
                this.page.name = this._block.page.name
            if (this._block.page.originalName)
                this.page.originalName = this._block.page.originalName
        }

        this.parentBlock = this._block.page.id !== this._block.parent.id ? {id: this._block.parent.id} : null
        this.prevBlock = this._block.parent.id !== this._block.left.id ? {id: this._block.left.id} : null
        this.level = 0

        this.children = this._block.children ?? []
        if (this.children.length > 0) {
            if (Array.isArray(this.children[0]))  // non-tree mode: get only children count
                this.children = Array(this.children.length).fill({})
            else  // tree mode
                this.children = this.children.map(b => new BlockContext(b as BlockEntity))
        }
    }
}


type LogseqProperty = { name: string, text: string, refs: string[] }

export type Properties = {[index: string]: string}
export type PropertiesRefs = {[index: string]: string[]}

export class PropertiesContext implements IContext {
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
            new RegExp(PropertiesContext.propertyContentFormat({pattern: name}), 'gim'),
            '',
        )
    }
    static getPropertyNames(text: string): string[] {
        const propertyNames: string[] = []
        const propertyLine = new RegExp(PropertiesContext.propertyContentFormat({
            pattern: `([^${PropertiesContext.propertyRestrictedChars}]+)`
        }), 'gim')
        text.replaceAll(propertyLine, (m, name) => {propertyNames.push(name); return m})
        return propertyNames
    }

    public values: Properties
    public refs: PropertiesRefs

    constructor(obj: BlockEntity | PageEntity) {
        this.values = {}
        this.refs = {}

        const names = (obj instanceof BlockContext)
            ? PropertiesContext.getPropertyNames(obj.content)
            : Object.keys(obj.properties ?? {})

        for (const name of names) {
            const p = PropertiesContext.getProperty(obj, name)
            this.values[name] = this.values[p.name] = p.text
            this.refs[name] = this.refs[p.name] = p.refs
        }
    }
}


export interface ILocalContext extends IContext {
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
        version: string,

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
    const info = await logseq.App.getInfo()
    return {...config, ...info}
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
        tomorrow: Dayjs
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
    // → type desclarations could be violated
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
            item = item.name
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
            return _ref(item.name)
        else if (item instanceof BlockContext)
            item = item.uuid

        return _bref(item as string)
    }
    const embed = (item: string | BlockContext | PageContext | Dayjs) => {
        let id: string = ''

        if (item instanceof dayjs)
            id = ref(item)
        else if (item instanceof PageContext)
            id = _ref(item.name)
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
