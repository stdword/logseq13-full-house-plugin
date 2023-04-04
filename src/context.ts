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
import { receiveMessageOnPort } from 'worker_threads'

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


export interface ILogseqContext {
    identity: {
        slot: string,
        key: string,
    }
    config: ConfigContext
    page: PageContext
    block: BlockContext
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

export class Context {
    static empty() {
        return new Context()
    }

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
    static emptyID = -1

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
    static empty() {
        return new PageContext(PageContext.emptyID)
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
    static emptyID = -1

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
    static empty() {
        return new BlockContext(BlockContext.emptyID)
    }

    constructor(id: number) {
        super()

        this.id = id
    }
}

export class ArgsContext extends Context {
    public _args: string[]
    public _hideUndefinedMode = false

    static parse(args: string[]): [string, string][] {
        const entries: [string, string][] = []
        for (let [ _, value ] of Object.entries(args)) {
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

            let name = ''
            if (value.startsWith('::')) {
                // special case: user has disabled named-arg parsing
                value = value.slice(1)
            } else {
                const strictrRgexp = /^:([\p{Letter}][$_\p{Letter}\p{Number}]*)\s+/ui
                const easyRgexp= /^:(\S+)\s*/ui
                const match = value.match(easyRgexp)
                if (match) {
                    let consumed: string
                    [ consumed, name ] = match
                    value = value.slice(consumed.length)
                    if (value)
                        value = cleanMacroArg(value, {escape: false, unquote: true})
                }
            }

            entries.push([ name, value ])
        }

        return entries
    }
    static create(templateRef: LogseqReference, args: string[]) {
        const entries: [string, string | boolean][] = [['0', templateRef.original]]

        for (let [ index, [name, value_] ] of Object.entries(ArgsContext.parse(args))) {
            let value: string | boolean = value_
            if (name && !value)
                value = true

            if (name)
                entries.push([ name, value ])
            entries.push([ (+index + 1).toString(), value ])
            entries.push([ `$${+index + 1}`, value ])
        }

        const instance = new ArgsContext(Object.fromEntries(entries), args)
        const hideUndefinedInstance = new Proxy(instance, {
            get(target, name, receiver) {
                const value: any = target[name]
                if (target._hideUndefinedMode && value === undefined)
                    return ''
                return value
            }
        })
        return hideUndefinedInstance
    }
    constructor(data: {[index: string]: any}, args: string[]) {
        super(data)
        this._args = args
    }
}

export class ConfigContext extends Context {
    public appVersion: string
    public pluginVersion: string

    public graph: {
        name: string,
        path: string,
        data: any,
        display: any,
        settings: any,
    }

    public preferredWorkflow: 'now' | 'todo'
    public preferredThemeMode: 'light' | 'dark'
    public preferredFormat: 'markdown' | 'org'

    public preferredLanguage: string
    public preferredDateFormat: string
    public preferredStartOfWeek: number

    public enabledFlashcards: boolean
    public enabledJournals: boolean
    public enabledWhiteboards: boolean
    public enabledPropertyPages: boolean

    public enabledTooltip: boolean
    public enabledTimetracking: boolean
    public enabledLogicalOutdenting: boolean

    public perferredPastingFile: boolean
    public showBrackets: boolean

    static async get() {
        const settings = await logseq.App.getCurrentGraphConfigs()
        const currentGraph = await logseq.App.getCurrentGraph()
        const config = await logseq.App.getUserConfigs()

        return new ConfigContext(
            settings,
            currentGraph,
            config,
            // @ts-expect-error
            top!.logseq.api.get_app_info(),
        )
    }

    constructor(settings: any, currentGraph: any, config: any, other: any) {
        super()

        this.graph = {
            name: currentGraph!.name,
            path: currentGraph!.path,
            data: {
                favorites: settings.favorites,
                macros: settings.macros,
                commands: settings.commands,
                shortcuts: settings.shortcuts,
                defaultTemplates: settings.defaultTemplates,
                defaultHome: settings.defaultHome,
                hiddenProperties: settings.blockHiddenProperties,
            },
            display: settings.settings,
            settings: {
                linkedReferencesCollapsedThreshold: settings['linkedReferencesCollapsedThreshold'],
                defaultOpenBlocksLevel: settings['defaultOpenBlocksLevel'],
                autoExpandBlockRefs: settings['autoExpandBlockRefs?'],

                showEmptyBullets: settings['showEmptyBullets?'],
                blockTitleCollapseEnabled: settings['blockTitleCollapseEnabled?'],

                enableSearchRemoveAccents: settings['enableSearchRemoveAccents?'],
                enableBlockTimestamps: settings['enableBlockTimestamps?'],

                docModeEnterForNewBlock: settings['docModeEnterForNewBlock?'],
                richPropertyValues: settings['richPropertyValues?'],
                showCommandDoc: settings['showCommandDoc?'],

                hidden: settings['hidden'],
            },
        }
        this.appVersion = other.version
        this.pluginVersion = logseq.baseInfo.version

        this.preferredWorkflow = config.preferredWorkflow as 'now' | 'todo'
        this.preferredThemeMode = config.preferredThemeMode
        this.preferredFormat = config.preferredFormat
        this.preferredLanguage = config.preferredLanguage
        this.preferredDateFormat = config.preferredDateFormat
        this.preferredStartOfWeek = config.preferredStartOfWeek as unknown as number

        this.enabledTooltip = settings.enabledTooltip
        this.enabledTimetracking = settings.enabledTimetracking
        this.enabledLogicalOutdenting = settings.logicalOutdenting

        this.enabledFlashcards = config.enabledFlashcards
        this.enabledJournals = config.enabledJournals
        this.enabledWhiteboards = settings['enableWhiteboards?']
        this.enabledPropertyPages = settings['enabled?']

        this.perferredPastingFile = settings.perferredPastingFile
        this.showBrackets = config.showBrackets
    }
 }
