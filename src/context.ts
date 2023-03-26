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

import { cleanMacroArg, LogseqReference, p, Properties, PropertiesRefs, PropertiesUtils } from './utils'

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
    public props?: Properties
    public propsRefs?: PropertiesRefs

    static createFromEntity(page: PageEntity) {
        const obj = new PageContext(page.id, page.originalName)
        obj._page = page

        obj.uuid = page.uuid

        // TODO: construct file
        //   file: {id: 42234}
        obj.file = page.file

        // TODO: construct namespace
        //   namespace: {id: 42234}

        const props = PropertiesUtils.getProperties(page)
        obj.props = (new Context(props.values)) as unknown as PageContext['props']
        obj.propsRefs = (new Context(props.refs)) as unknown as PageContext['propsRefs']

        obj.isJournal = page['journal?']

        const day = page.journalDay?.toString()
        if (day)
            obj.day = dayjs(day, 'YYYYMMDD').startOf('day')
        return obj
    }

    constructor(id: number, name?: string) {
        super()

        this.id = id
        if (name) {
            this.name = name
            this.name_ = name.toLowerCase()
        }
    }
}

export class BlockContext extends Context {
    private _block?: BlockEntity

    public id: number
    public uuid?: string
    public content?: string

    public props?: Properties
    public propsRefs?: PropertiesRefs

    public page?: PageContext
    public parentBlock?: BlockContext | null
    public prevBlock?: BlockContext | null
    public level?: number

    public children?: ({} | BlockContext)[]
    public refs?: {id: number}[]

    static createFromEntity(block: BlockEntity, args: {
        page?: PageEntity | PageContext,
        level?: number,
    } = {}) {
        const obj = new BlockContext(block.id)
        obj._block = block ;

        ({
            uuid: obj.uuid,
            content: obj.content,
            refs: obj.refs,
        } = block)

        const props = PropertiesUtils.getProperties(block)
        obj.props = (new Context(props.values)) as unknown as BlockContext['props']
        obj.propsRefs = (new Context(props.refs)) as unknown as BlockContext['propsRefs']

        const page = args.page
        if (page)
            if (page instanceof PageContext)
                obj.page = page
            else
                obj.page = PageContext.createFromEntity(page)
        else
            obj.page = new PageContext(block.page.id)

        obj.parentBlock = null
        if (block.page.id !== block.parent.id)
            obj.parentBlock = new BlockContext(block.parent.id)

        obj.prevBlock = null
        if (block.parent.id !== block.left.id)
            obj.prevBlock = new BlockContext(block.left.id)

        obj.level = args.level ?? 0
        const rootLevel: number = obj.level

        obj.children = block.children ?? []
        if (obj.children.length > 0) {
            if (Array.isArray(obj.children[0]))  // non-tree mode: get only children count
                obj.children = Array(obj.children.length).fill({})
            else  // tree mode
                obj.children = obj.children.map(
                    b => BlockContext.createFromEntity(b as BlockEntity, {
                        level: rootLevel + 1,
                        page: obj.page,
                    })
                )
        }

        return obj
    }

    constructor(id: number) {
        super()

        this.id = id
    }
}

export class ArgsContext extends Context {
    constructor(templateRef: LogseqReference, args: string[]) {
        const entries: [string, string][] = [['0', templateRef.original]]
        for (let [ index, value ] of Object.entries(args)) {
            // Check whether it is named arg

            // # Strict rules for name of the arg
            // Idea: allow to access the arg with `c.args.<name>`
            // Represented by a mix of javascript variable naming rules and .edn keywords:
            //  - name must be preceded with `:`
            //  - followed with non-numeric Unicode character
            //  - other characters can contain alphanumeric Unicode characters, `$` and `_`
            //  - must not be zero-length
            //  - followed by one or more whitespace characters

            // # Easy rules for name of the arg
            // Idea: be as non-restrictive as possible, but access the arg with `c.args.['<name>']`
            //  - name must be preceded with `:`
            //  - can contain any non-whitespace characters
            //  - must not be zero-length
            //  - followed by one or more whitespace characters

            // # Rules for value of the arg
            //  - value can contain any characters (or no one)
            //  - value can be quoted with `"` to preserve whitespaces before it
            //  - double `"` allows to include `"` to value

            // TODO: create a setting to control strictness

            if (value.startsWith('::')) {
                // special case: user has disabled named-arg parsing
                value = value.slice(1)
            } else {
                const strictrRgexp = /^:([\p{Letter}][$_\p{Letter}\p{Number}]*)\s+/ui
                const easyRgexp= /^:(\S+)\s+/ui
                const match = value.match(easyRgexp)
                if (match) {
                    const [ consumed, name ] = match
                    value = value.slice(consumed.length)
                    value = cleanMacroArg(value, {escape: false, unquote: true})

                    entries.push([ name, value ])
                }
            }

            entries.push([ (index + 1).toString(), value ])
            entries.push([ `$${+index + 1}`, value ])
        }
        super(Object.fromEntries(entries))
    }
}

export interface ILogseqContext {
    config: ConfigContext
    page: PageContext
    block: BlockContext | null
    args: ArgsContext
    self?: BlockContext
    template?: {
        name: string,
        includingParent: boolean,
        block: BlockContext,
        props: Properties,
        propsRefs: PropertiesRefs,
    }
}

export class ConfigContext extends Context {
    public pluginVersion: string

    public currentGraph: string

    public preferredWorkflow: 'now' | 'todo'
    public preferredThemeMode: 'light' | 'dark'
    public preferredFormat: 'markdown' | 'org'

    public preferredLanguage: string
    public preferredDateFormat: string
    public preferredStartOfWeek: number

    public enabledFlashcards: boolean
    public enabledJournals: boolean
    public showBrackets: boolean

    static async get() {
        // TODO: use full config
        // const fullConfig = await logseq.App.getCurrentGraphConfigs()

        // TODO: error in @logseq/lib types definitions:
        //   - `showBracket`: no "s" at the end
        //   - `preferredStartOfWeek`: number type instead of string

        const config = await logseq.App.getUserConfigs()
        delete config.me

        return new ConfigContext({
            ...config,
            pluginVersion: await logseq.baseInfo.version,
        })
    }

    constructor(data: {[index: string]: any}) {
        super();

        ({
            pluginVersion: this.pluginVersion,
            currentGraph: this.currentGraph,
            preferredWorkflow: this.preferredWorkflow,
            preferredThemeMode: this.preferredThemeMode,
            preferredFormat: this.preferredFormat,
            preferredLanguage: this.preferredLanguage,
            preferredDateFormat: this.preferredDateFormat,
            preferredStartOfWeek: this.preferredStartOfWeek,
            enabledFlashcards: this.enabledFlashcards,
            enabledJournals: this.enabledJournals,
            showBracket: this.showBrackets,
        } = data)
    }
 }
