import '@logseq/libs'
import { BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import {
    cleanMacroArg, escape,
    LogseqReference,
    p, Properties, PropertiesRefs, PropertiesUtils,
} from './utils'
import { ITemplate } from './template'

// dayjs: for tests
// import { Dayjs }  from 'dayjs'
// import * as dayjs from 'dayjs'

// import * as customParseFormat from 'dayjs/plugin/customParseFormat'
// import * as advancedFormat    from 'dayjs/plugin/advancedFormat'
// import * as weekday           from 'dayjs/plugin/weekday'
// import * as dayOfYear         from 'dayjs/plugin/dayOfYear'
// import * as weekOfYear        from 'dayjs/plugin/weekOfYear'
// import * as isoWeek           from 'dayjs/plugin/isoWeek'
// import * as quarterOfYear     from 'dayjs/plugin/quarterOfYear'
// import * as duration          from 'dayjs/plugin/duration'
// import * as utc               from 'dayjs/plugin/utc'
// import * as timezone          from 'dayjs/plugin/timezone'
// import * as updateLocale      from 'dayjs/plugin/updateLocale'
// import * as localeData        from 'dayjs/plugin/localeData'
// import logseqPlugin           from './extensions/dayjs_logseq_plugin'
//

// dayjs: for build
import { Dayjs }  from 'dayjs'
import dayjs from 'dayjs'

import customParseFormat from 'dayjs/plugin/customParseFormat'
import advancedFormat    from 'dayjs/plugin/advancedFormat'
import weekday           from 'dayjs/plugin/weekday'
import dayOfYear         from 'dayjs/plugin/dayOfYear'
import weekOfYear        from 'dayjs/plugin/weekOfYear'
import isoWeek           from 'dayjs/plugin/isoWeek'
import quarterOfYear     from 'dayjs/plugin/quarterOfYear'
import duration          from 'dayjs/plugin/duration'
import utc               from 'dayjs/plugin/utc'
import timezone          from 'dayjs/plugin/timezone'
import updateLocale      from 'dayjs/plugin/updateLocale'
import localeData        from 'dayjs/plugin/localeData'
import logseqPlugin      from './extensions/dayjs_logseq_plugin'
//

import 'dayjs/locale/fr'
import 'dayjs/locale/de'
import 'dayjs/locale/nl'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'
import 'dayjs/locale/af'
import 'dayjs/locale/es'
import 'dayjs/locale/nb'
import 'dayjs/locale/pl'
import 'dayjs/locale/pt-br'
import 'dayjs/locale/pt-br'
import 'dayjs/locale/pt'
import 'dayjs/locale/ru'
import 'dayjs/locale/ja'
import 'dayjs/locale/it'
import 'dayjs/locale/tr'
import 'dayjs/locale/uk'
import 'dayjs/locale/ko'
import 'dayjs/locale/sk'
import 'dayjs/locale/fa'
import 'dayjs/locale/id'


export { dayjs, Dayjs }
dayjs.extend(customParseFormat)
dayjs.extend(advancedFormat)
dayjs.extend(weekday)
dayjs.extend(dayOfYear)
dayjs.extend(weekOfYear)
dayjs.extend(isoWeek)
dayjs.extend(quarterOfYear)
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(updateLocale)
dayjs.extend(localeData)
dayjs.extend(logseqPlugin)


export interface ILogseqCurrentContext {
    mode: 'template' | 'view'
    currentPage: PageContext
    currentBlock: BlockContext
}

export interface ILogseqCallContext {
    identity: Context | {
        slot: string,
        key: string,
    }
    config: ConfigContext
    page: PageContext | null
    block: BlockContext | null
}

export interface ILogseqContext extends ILogseqCallContext, ILogseqCurrentContext {
    page: PageContext
    block: BlockContext

    args: ArgsContext

    tags?: Context
    self?: BlockContext
    template?: {
        _obj: ITemplate,
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

            if (value === null || value === undefined) {
                // do nothing
            }
            else if (value instanceof Context)
                value = value.filterForDisplaying()
            else if (Array.isArray(value))
                value = value.map(item => {
                    if (item instanceof Context)
                        return item.filterForDisplaying()
                    return item
                })
            else if (value instanceof dayjs)
                // @ts-expect-error
                value = `dayjs(${value.toISOString()})`
            else if (value == dayjs)
                value = 'dayjs()'
            else if (typeof value === 'function') {
                const doc = value.toString()
                const signature = doc.match(/function\s*\w*?\((.*?)\)\s*\{/)
                value = `function(${signature[1] || ''})`.replaceAll('"', "'")
                if (doc.startsWith('async'))
                    value = 'async ' + value
            }
            else if (typeof value === 'object') {
                // do nothing
            }

            result[field] = value
        }
        return result
    }
    toString() {
        // pretty print whole context body
        let obj = JSON.stringify(this.filterForDisplaying(), null, '\t')
        return '<pre>' + obj + '</pre>'
    }
}

export class PageContext extends Context {
    static emptyID = -1

    private _page?: PageEntity

    public id: number
    public uuid?: string
    public name?: string  // original
    public name_?: string  // id: lowercased
    public namespace?: {
        parts: Array<string>,
        prefix: string,
        suffix: string,
        pages: Array<string>,
    }
    public isJournal?: boolean
    public day?: Dayjs
    public file?: any
    public props?: Properties
    public propsRefs?: PropertiesRefs

    static parseDay(day: string | number) {
        return dayjs(day.toString(), 'YYYYMMDD').startOf('day')
    }

    static createFromEntity(page: PageEntity) {
        const name = page.originalName || (page['original-name'] as string)
        const obj = new PageContext(page.id, name)
        obj._page = page

        if (name.includes('/')) {
            const parts = name.split('/')
            obj.namespace = new Context({
                parts,
                prefix: parts.slice(0, -1).join('/'),
                suffix: parts.at(-1),
                pages: parts.slice(0, -1).reduce(
                    (r) => r.concat(parts.slice(0, r.length + 1).join('/')),
                    [] as Array<string>
                ),
            }) as unknown as PageContext['namespace']
        }

        obj.uuid = page.uuid

        const nameID = escape(obj.name_!, ['"'])

        // @ts-expect-error
        const path = top!.logseq.api.datascript_query(`[:find ?path
         :where
            [?p :block/name "${nameID}"]
            [?p :block/file ?f]
            [?f :file/path ?path]
        ]`)?.flat().at(0)
        obj.file = path ? path : page.file

        const props = PropertiesUtils.getProperties(page)
        obj.props = (new Context(props.values)) as unknown as PageContext['props']
        obj.propsRefs = (new Context(props.refs)) as unknown as PageContext['propsRefs']

        obj.isJournal = page['journal?']

        const day = page.journalDay || (page['journal-day'] as number | undefined)
        if (day)
            obj.day = PageContext.parseDay(day)
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
        obj._block = block

        obj.uuid = block.uuid
        obj.content = block.content
        obj.refs = block.pathRefs as {id: number}[] | undefined

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

    constructor(id: number, uuid?: string) {
        super()

        this.id = id
        if (uuid)
            this.uuid = uuid
    }
}

export class ArgsContext extends Context {
    static propertyPrefix = 'arg-'

    public _obj?: ArgsContext
    public _args: [string, string | boolean][]

    static parse(args: string[]): [string, string | boolean][] {
        function handleMacroMode(value: string) {
            if (value.search(/^\$\$\d+$/) !== -1)
                return value.slice(1)
            if (value.search(  /^\$\d+$/) !== -1)
                return ''
            return value
        }

        const entries: [string, string | boolean][] = []
        for (let value_ of args) {
            // Check whether it is named arg
            // Idea: be as non-restrictive as possible, but access the arg with `c.args.['<name>']`
            //  - name must be preceded with `:`
            //  - can contain any non-whitespace characters
            //  - must not be zero-length
            //  - followed by one or more whitespace characters

            // # Rules for value of the arg
            //  - value can contain any characters (or no one)
            //  - value can be quoted with `"` to preserve whitespaces before & after it
            //  - «$» sign at the beginning should be doubled to bypass macro-mode

            let name = ''
            let value: string | boolean = value_

            value = handleMacroMode(value)

            if (value.startsWith('::')) {
                // special case: user has disabled named-arg parsing
                value = value.slice(1)
            } else {
                const strictrRgexp = /^:([\p{Letter}][$_\p{Letter}\p{Number}]*)\s+/ui
                const easyRgexp= /^:(\S+)\s*/ui
                const match = value.match(easyRgexp)
                if (match) {
                    name = match[1]

                    const consumed = match[0]
                    value = value.slice(consumed.length)

                    if (!value)
                        value = true
                    else {
                        value = cleanMacroArg(value, {escape: false, unquote: true})
                        if (!value)
                            value = false
                        else
                            value = handleMacroMode(value)
                    }
                }
            }

            entries.push([ name, value ])
        }

        return entries
    }
    static create(callSignature: string, args: string[]) {
        const parsedArgs = ArgsContext.parse(args)
        const entries: [string, string | boolean][] = [['0', callSignature]]

        let positionalIndex = 1
        for (const [ index, [name, value] ] of Object.entries(parsedArgs)) {
            if (name)
                entries.push([ name, value ])
            else
                entries.push([ `$${+positionalIndex++}`, value ])
            entries.push([ (+index + 1).toString(), value ])
        }

        const instance = new ArgsContext(Object.fromEntries(entries), parsedArgs)
        instance._obj = instance
        const hideUndefinedInstance = new Proxy(instance, {
            get(target, name, receiver) {
                const value: any = target[name]

                if (typeof name === 'symbol')
                    return value

                if (typeof value === 'function' || name.startsWith('_'))
                    return value

                // handle "name$1" special case
                let match = /(.+?)\$(\d+)/.exec(name)
                if (match) {
                    const [ tryName, tryPosition ] = [ match[1], Number(match[2]) ]

                    let tryValue = target[tryName]
                    if (tryValue === undefined)
                        tryValue = target[`$${tryPosition}`]
                    if (tryValue !== undefined)
                        return tryValue
                }

                // handle "$1name" special case
                match = /\$(\d+)(.+)/.exec(name)
                if (match) {
                    const [ tryName, tryPosition ] = [ match[2], Number(match[1]) ]
                    let tryValue = target[`$${tryPosition}`]
                    if (tryValue === undefined)
                        tryValue = target[tryName]
                    if (tryValue !== undefined)
                        return tryValue
                }

                if (value === undefined)
                    return ''

                return value
            }
        })
        return hideUndefinedInstance
    }
    constructor(data: {[index: string]: any}, args: [string, string | boolean][]) {
        super(data)
        this._args = args
        this._obj = undefined
    }
    _get(name: string) {
        // to pass through hide undefined proxy
        if (this._obj)
            return this._obj[name]
    }
    toCallString() {
        return this._args.map(([name, value]) => `:${name} → ${value}`).join(', ')
    }
}

export class ConfigContext extends Context {
    public appVersion: string
    public pluginVersion: string

    public graph: {
        name: string,
        path: string,
        data: any,
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

        // @ts-expect-error
        this._settings = settings

        this.graph = {
            name: currentGraph!.name,
            path: currentGraph!.path,
            data: {
                favorites: settings.favorites,
                defaultHome: settings['default-home'],
            },
        }

        // @ts-expect-error
        this.pluginVersion = logseq.baseInfo.version
        this.appVersion = other.version

        this.preferredWorkflow = config.preferredWorkflow as 'now' | 'todo'
        this.preferredThemeMode = config.preferredThemeMode
        this.preferredFormat = config.preferredFormat
        this.preferredLanguage = config.preferredLanguage
        this.preferredDateFormat = config.preferredDateFormat
        this.preferredStartOfWeek = config.preferredStartOfWeek as unknown as number

        this.enabledTooltip = settings['ui/enable-tooltip?']
        this.enabledTimetracking = settings['feature/enable-timetracking?']
        this.enabledFlashcards = config.enabledFlashcards
        this.enabledJournals = config.enabledJournals
        this.enabledWhiteboards = settings['feature/enable-whiteboards?']
        this.enabledPropertyPages = settings['property-pages/enabled?']

        this.showBrackets = config.showBrackets
    }
 }
