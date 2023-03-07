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

import { p, Properties, PropertiesRefs, PropertiesUtils } from './utils'

export { dayjs, Dayjs }
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


export interface ILogseqContext {
    page: PageContext
    block: BlockContext
    self?: BlockContext
    template?: {
        name: string,
        includingParent: boolean,
        block: BlockContext,
        props: Properties,
        propsRefs: PropertiesRefs,
    }
    config: {
        pluginVersion: string,

        currentGraph: string,

        preferredWorkflow: 'now' | 'todo',
        preferredThemeMode: 'light' | 'dark',
        preferredFormat: 'markdown' | 'org',

        preferredLanguage: string,
        preferredDateFormat: string,
        preferredStartOfWeek: string,  // TODO: error in types definitions: number type

        enabledFlashcards: boolean,
        enabledJournals: boolean,
        showBracket: boolean,  // TODO: error in types definitions: no "s" at the end
    }
}


export async function getConfigContext() {
    // TODO: use full config
    // const fullConfig = await logseq.App.getCurrentGraphConfigs()

    const config = await logseq.App.getUserConfigs()
    delete config.me

    return new Context({
        ...config,
        pluginVersion: await logseq.baseInfo.version,
    })
 }
