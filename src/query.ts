import '@logseq/libs'
import { PageEntity } from '@logseq/libs/dist/LSPlugin'

import { escape, f, p, randomRange, unspace } from './utils'
import { Dayjs, dayjs, PageContext } from './context'


abstract class Filter {
    public bindingVars: ((state) => string[][]) = (state) => []
    public value: string

    constructor(value: string) {
        this.value = value.trim().toLowerCase()
    }

    bindNewVars(builder: PagesQueryBuilder): [string[], string[]] {
        const varsBinders = this.bindingVars(builder.lastState)
        const missedVarsBinders = varsBinders.filter(([v, _]) => !builder.bindedVars.includes(v))
        return [
            missedVarsBinders.map(([v, b]) => v),
            missedVarsBinders.map(([v, b]) => b),
        ]
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        if (this.value === '')
            return 'Value should be non-empty'
        return null
    }
    toString(): string {
        return `${this.constructor.name}(${this.value})`
    }

    abstract getPredicate(builder: PagesQueryBuilder): string
    getNotPredicate(builder: PagesQueryBuilder): string {
        return `(not ${this.getPredicate(builder)})`
    }
}


class TitleFilter extends Filter {
    operation: string
    allowedOperations = ['=', '!=', 'starts with', 'ends with', 'includes', 'regexp']
    bindingVars = (state) => [
        ['?name', '[?p :block/name ?name]']
    ]

    constructor(value: string, operation: string) {
        super(value)
        this.operation = operation.trim().toLowerCase()
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        if (!this.allowedOperations.includes(this.operation))
            return `Unknown operation: ${this.operation}`
        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        if (this.operation === 'regexp') {
            const uniqID = Math.random().toString(36).slice(2)
            const tempVarName = `?re-name-${uniqID}`
            const value = escape(this.value, ['"', '\\'])
            return `
                [(re-pattern "${value}") ${tempVarName}]
                [(re-find ${tempVarName} ?name)]
            `.trim()
        }

        const value = escape(this.value, ['"'])

        let operation = this.operation
        if (operation === 'includes')
            operation = 'clojure.string/includes?'
        else if (operation === 'starts with')
            operation = 'clojure.string/starts-with?'
        else if (operation === 'ends with')
            operation = 'clojure.string/ends-with?'

        return `[(${operation} ?name "${value}")]`
    }
    getNotPredicate(builder: PagesQueryBuilder): string {
        if (this.operation === 'regexp') {
            const [compilation, predicate] = this.getPredicate(builder).split('\n')
            return `${compilation}\n(not ${predicate})`
        }

        return super.getNotPredicate(builder)
    }
}


class JournalFilter extends Filter {
    constructor() {
        super('')
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        return '[?p :block/journal? true]'
    }
    getNotPredicate(builder: PagesQueryBuilder): string {
        return '[?p :block/journal? false]'
    }
}


class JournalDayFilter extends Filter {
    day: Dayjs
    operation: string
    allowedOperations = ['=', '!=', '>', '>=', '<', '<=']
    bindingVars = (state) => [
        ['?day', '[?p :block/journal-day ?day]']
    ]

    constructor(day: Dayjs | string, operation: string) {
        super('')
        this.operation = operation.trim().toLowerCase()

        // @ts-expect-error
        this.day = dayjs(day).toLogseqInternalFormat()
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        if (!this.allowedOperations.includes(this.operation))
            return `Unknown operation: ${this.operation}`
        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        return `[(${this.operation} ?day ${this.day})]`
    }
}


class JournalDayBetweenFilter extends Filter {
    left: Dayjs
    right: Dayjs

    bindingVars = (state) => [
        ['?day', '[?p :block/journal-day ?day]']
    ]

    constructor(left: Dayjs, right: Dayjs) {
        super('')
        // @ts-expect-error
        this.left = dayjs(left).toLogseqInternalFormat()
        // @ts-expect-error
        this.right = dayjs(right).toLogseqInternalFormat()
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        return `[(>= ?day ${this.left})]` + '\n' + `[(<= ?day ${this.right})]`
    }
}


class PropertyFilter extends Filter {
    bindingVars = (state) => [
        ['?properties', '[?p :block/properties ?properties]'],
        ['?properties-text', '[?p :block/properties-text-values ?properties-text]'],
    ]

    getPredicate(builder: PagesQueryBuilder): string {
        builder.lastState = this.value  // save last property name

        const propVar = `?p-${this.value}`
        const propTextVar = `?pt-${this.value}`
        if (builder.bindedVars.includes(propVar))
            return ''  // property var already bound

        builder.bindedVars.push(...[propVar, propTextVar])
        return `
            [(get ?properties :${this.value}) ${propVar}]
            [(get ?properties-text :${this.value}) ${propTextVar}]
        `.trim()
    }
    getNotPredicate(builder: PagesQueryBuilder): string {
        builder.lastState = null  // reset last property name
        return `(not [(get ?properties :${this.value})])`
    }
}


class EmptyFilter extends Filter {
    constructor() {
        super('')
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        if (builder.lastState === null)
            return 'Preceding property filter is required'
        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        const propertyName = builder.lastState
        return `[(= ?p-${propertyName} "")]`
    }
    getNotPredicate(builder: PagesQueryBuilder): string {
        const propertyName = builder.lastState
        return `[(!= ?p-${propertyName} "")]`
    }
}


class IntegerValueFilter extends Filter {
    number: number
    operation: string
    allowedOperations = ['=', '!=', '>', '>=', '<', '<=']

    constructor(value: string, operation: string) {
        super(value)
        this.number = Number(this.value)
        this.operation = operation.trim()
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        if (builder.lastState === null)
            return 'Preceding property filter is required'
        if (!this.allowedOperations.includes(this.operation))
            return `Unknown operation: ${this.operation}`
        if (isNaN(this.number) || !Number.isInteger(this.number))
            return `Value should be an integer number`
        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        const propertyName = builder.lastState
        return `[(${this.operation} ?p-${propertyName} ${this.value})]`
    }
}


class ValueFilter extends Filter {
    operation: string
    allowedOperations = [
        '=', '!=', '>', '>=', '<', '<=',
        'starts with', 'ends with', 'includes', 'regexp',
    ]

    constructor(value: string, operation: string) {
        super(value)
        this.operation = operation.trim().toLowerCase()
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        const message = super.checkArgs(builder)
        if (message)
            return message

        if (builder.lastState === null)
            return 'Preceding property filter is required'
        if (!this.allowedOperations.includes(this.operation))
            return `Unknown operation: ${this.operation}`

        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        const propertyName = builder.lastState

        if (this.operation === 'regexp') {
            const uniqID = Math.random().toString(36).slice(2)
            const tempVarName = `?re-p-${propertyName}-${uniqID}`
            const value = escape(this.value, ['"', '\\'])
            return `
                [(re-pattern "${value}") ${tempVarName}]
                [(re-find ${tempVarName} ?pt-${propertyName})]
            `.trim()
        }

        const value = escape(this.value, ['"'])

        let operation = this.operation
        if (operation === 'includes')
            operation = 'clojure.string/includes?'
        else if (operation === 'starts with')
            operation = 'clojure.string/starts-with?'
        else if (operation === 'ends with')
            operation = 'clojure.string/ends-with?'

        return `[(${operation} ?pt-${propertyName} "${value}")]`
    }
    getNotPredicate(builder: PagesQueryBuilder): string {
        if (this.operation === 'regexp') {
            const [compilation, predicate] = this.getPredicate(builder).split('\n')
            return `${compilation}\n(not ${predicate})`
        }

        return super.getNotPredicate(builder)
    }
}


class ValueTypeFilter extends Filter {
    choices: ('number' | 'string' | 'set')[]

    bindingVars = (prop) => [
        [`?ptype-${prop}`, `[(type ?p-${prop}) ?ptype-${prop}]`],

        [`?type-number`, `[(type 1) ?type-number]`],
        [`?type-string`, `[(type "x") ?type-string]`],
        [`?type-set`,    `[(type #{}) ?type-set]`],
    ]

    constructor(choices: ('number' | 'string' | 'set')[]) {
        super('')
        this.choices = choices
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        if (builder.lastState === null)
            return 'Preceding property filter is required'
        if (this.choices.length === 0)
            return 'At least one type is required'

        const unknown = this.choices.filter((t) => !['number', 'string', 'set'].includes(t))
        if (unknown.length !== 0)
            return `Unknown property types: ${unknown.join(', ')}`

        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        const propertyName = builder.lastState

        const lines: string[] = []
        for (const choice of this.choices) {
            let predicate: string

            if (choice === 'string')
                predicate = `[(= ?ptype-${propertyName} ?type-string)]`
            else if (choice === 'number')
                predicate = `[(= ?ptype-${propertyName} ?type-number)]`
            else if (choice === 'set')
                predicate = `[(= ?ptype-${propertyName} ?type-set)]`
            else return ''

            lines.push(predicate)
        }

        if (lines.length === 1)
            return lines[0]
        return `(or ${lines.join('\n')} )`
    }
}


class ReferenceFilter extends Filter {
    values: string[]
    operation: string
    allowedOperations = ['includes', 'includes only']

    constructor(values: string | string[], operation: string) {
        super('')

        if (typeof values === 'string')
            this.values = [values.trim().toLowerCase()]
        else
            this.values = values.map((v) => v.trim().toLowerCase())

        this.operation = operation.trim().toLowerCase()
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        if (builder.lastState === null)
            return 'Preceding property filter is required'
        if (!this.allowedOperations.includes(this.operation))
            return `Unknown operation: ${this.operation}`
        if (this.values.length === 0)
            return 'Need at least one value'

        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        const propertyName = builder.lastState

        const values = this.values.map((v) => escape(v, ['"']))

        let operation = this.operation
        if (operation === 'includes')
            return values.map((v) => `[(contains? ?p-${propertyName} "${v}")]`).join('\n')
        else if (operation === 'includes only') {
            const vs = values.map((v) => `"${v}"`).join(' ')
            return `[(= ?p-${propertyName} #{${vs}})]`
        }

        return ''
    }
}

class ReferenceCountFilter extends Filter {
    number: number
    operation: string
    allowedOperations = ['=', '!=', '>', '>=', '<', '<=']

    bindingVars = (prop) => [
        [`?pc-${prop}`, `[(count ?p-${prop}) ?pc-${prop}]`]
    ]

    constructor(value: string, operation: string) {
        super(value)
        this.number = Number(this.value)
        this.operation = operation.trim()
    }
    checkArgs(builder: PagesQueryBuilder): string | null {
        if (builder.lastState === null)
            return 'Preceding property filter is required'
        if (!this.allowedOperations.includes(this.operation))
            return `Unknown operation: ${this.operation}`
        if (isNaN(this.number) || !Number.isInteger(this.number))
            return `Value should be an integer number`

        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        const propertyName = builder.lastState
        return `[(${this.operation} ?pc-${propertyName} ${this.number})]`
    }
}


export class PagesQueryBuilder {
    public filters: string[]
    public bindedVars: string[]
    public lastState: string | null

    constructor() {
        this.bindedVars = ['?original-name']
        this.filters = []
        this.lastState = null
    }
    toString(): string {
        return this.constructor.name
    }
    clone(): PagesQueryBuilder {
        return Object.assign(
            Object.create(Object.getPrototypeOf(this)),
            structuredClone(this),
        )
    }
    _filter(f: Filter, nonInverted: boolean = true): PagesQueryBuilder {
        const message = f.checkArgs(this)
        if (message)
            throw new Error(`${f}: ${message}`)

        const clone = this.clone()

        const [newVars, binders] = f.bindNewVars(clone)
        clone.bindedVars.push(...newVars)

        const predicate = [...binders]
        const filterPredicate = nonInverted ? f.getPredicate(clone) : f.getNotPredicate(clone)
        if (filterPredicate)
            predicate.push(filterPredicate)

        clone.filters.push(predicate.join('\n'))
        return clone
    }

    title(operation: string, value: string = '', nonInverted: boolean = true) {
        if (value === '') {
            value = operation
            operation = 'includes'
        }
        value = value.toString()
        return this._filter(new TitleFilter(value, operation), nonInverted)
    }
    namespace(value: string, nonInverted: boolean = true) {
        if (value.endsWith('/'))
            value = value.slice(0, -1)
        value = `^${value}(?=/|$)`
        return this._filter(new TitleFilter(value, 'regexp'), nonInverted)
    }
    innerNamespace(value: string, nonInverted: boolean = true) {
        if (!value.endsWith('/'))
            value = value + '/'
        value = `^${value}[^/]+$`
        return this._filter(new TitleFilter(value, 'regexp'), nonInverted)
    }

    journals(nonInverted: boolean = true) {
        return this._filter(new JournalFilter(), nonInverted)
    }
    day(operation: string, value: Dayjs | string, thirdArg?: Dayjs | string | boolean, nonInverted: boolean = true) {
        value = dayjs(value)

        if (operation === 'between') {
            if (!thirdArg || !['object', 'string'].includes(typeof thirdArg))
                throw new Error('Journal filter: Third argument must be a date')

            if (typeof thirdArg === 'string')
                thirdArg = dayjs(thirdArg)

            const a = value
            const b = thirdArg as Dayjs
            return this._filter(new JournalDayBetweenFilter(a, b), nonInverted)
        }
        else if (operation === 'in') {
            if (!thirdArg || typeof thirdArg !== 'string')
                throw new Error('Journal filter: Third argument must be a string')

            const allowed = ['year', 'quarter', 'month', 'week', 'isoweek'] as const
            type Mode = typeof allowed[number]
            const mode = thirdArg.toLowerCase() as Mode
            if (!allowed.includes(mode))
                throw new Error(
                    `Journal filter: Wrong value ("${mode}") — use one of: ${allowed.join(', ')}`
                )

            // @ts-expect-error
            const a = value.startOf(mode)
            // @ts-expect-error
            const b = value.endOf(mode)

            return this._filter(new JournalDayBetweenFilter(a, b), nonInverted)
        }

        if (thirdArg !== undefined) {
            if (typeof thirdArg !== 'boolean')
                throw new Error('Journal filter: Third argument must be a boolean')

            nonInverted = thirdArg as boolean
        }

        return this._filter(new JournalDayFilter(value, operation), nonInverted)
    }

    property(name: string) {
        return this._filter(new PropertyFilter(name))
    }
    noProperty(name: string) {
        return this._filter(new PropertyFilter(name), false)
    }

    empty() {
        return this._filter(new EmptyFilter())
    }
    nonEmpty() {
        return this._filter(new EmptyFilter(), false)
    }

    integerValue(operation: string, value: string = '') {
        if (value === '') {
            value = operation
            operation = '='
        }
        value = value.toString()
        return this._filter(new IntegerValueFilter(value, operation))
    }
    value(operation: string, value: string = '', nonInverted: boolean = true) {
        if (value === '') {
            value = operation
            operation = '='
        }
        value = value.toString()
        return this._filter(new ValueFilter(value, operation), nonInverted)
    }

    valueType(choices: ('number' | 'string' | 'set')[] = [], nonInverted: boolean = true) {
        choices = choices.map(x => x.toString() as ('number' | 'string' | 'set'))
        if (choices.length === 0)
            return this
        return this._filter(new ValueTypeFilter(choices), nonInverted)
    }
    onlyStrings(nonInverted: boolean = true) {
        return this.valueType(['string'], nonInverted)
    }
    onlyNumbers(nonInverted: boolean = true) {
        return this.valueType(['number'], nonInverted)
    }

    reference(operation: string, value: string | string[] = '', nonInverted: boolean = true) {
        if (value === '') {
            value = operation
            operation = 'includes'
        }
        return this._filter(new ReferenceFilter(value, operation), nonInverted)
    }
    referenceCount(operation: string, value: string = '', nonInverted: boolean = true) {
        if (value === '') {
            value = operation
            operation = '='
        }
        value = value.toString()
        return this._filter(new ReferenceCountFilter(value, operation), nonInverted)
    }

    tags(names: string | string[] = '', only: boolean = false) {
        const cloned = this._filter(new PropertyFilter('tags'))
        return cloned._filter(new ReferenceFilter(names, only ? 'includes only' : 'includes'))
    }
    noTags(names: string | string[] = '', only: boolean = false) {
        const cloned = this._filter(new PropertyFilter('tags'))
        return cloned._filter(new ReferenceFilter(names, only ? 'includes only' : 'includes'), false)
    }

    _get(namesOnly: boolean = true): PageEntity[] {
        const filters = this.filters.join('\n\n')
        const query = unspace`
            [:find ${namesOnly ? '?original-name' : '(pull ?p [*])'}
             :where
                [?p :block/original-name ?original-name]

                ${filters}
            ]
        `

        console.debug(p`PagesQueryBuilder:\n`, query)

        // @ts-expect-error
        const results = top!.logseq.api.datascript_query(query)

        if (!results)
            return []

        // Array.from is required here to be able to call .uniue, .groupby and other utils
        return Array.from(results.flat())
    }
    getNames() {
        return this._get(true)
    }
    get(wrap: boolean = true) {
        const items = this._get(false)
        if (wrap)
            return items.map(PageContext.createFromEntity)
        return items
    }
    getFirst(wrap: boolean = true) {
        const first = this._get(false).at(0)
        if (!first)
            return null
        return wrap ? PageContext.createFromEntity(first) : first
    }
    getRandom(wrap: boolean = true) {
        const items = this._get(false)
        if (items.length === 0)
            return null
        const chosen = items[Math.floor((Math.random() * items.length))]
        return wrap ? PageContext.createFromEntity(chosen) : chosen
    }
    getSample(count: number, wrap: boolean = true) {
        if (count < 1)
            return []

        if (count === 1) {
            const chosen = this.getRandom(wrap)
            if (chosen === null)
                return []
            return [chosen]
        }

        const items = this._get(false)

        // Fisher-Yates shuffle
        // source: underscore.sample
        // url: https://github.com/jashkenas/underscore/blob/ffabcd443fd784e4bc743fff1d25456f7282d531/underscore.js#L361
        const length = items.length
        count = Math.min(count, length)
        const last = length - 1
        for (let index = 0; index < count; index++) {
            const rand = randomRange(index, last)
            const temp = items[index]
            items[index] = items[rand]
            items[rand] = temp
        }

        const sample = items.slice(0, count)
        return wrap ? sample.map(PageContext.createFromEntity) : sample
    }
}
