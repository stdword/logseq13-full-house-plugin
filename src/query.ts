import '@logseq/libs'
import { PageEntity } from '@logseq/libs/dist/LSPlugin'

import { escape, f, p, randomRange, unspace } from './utils'
import { PageContext } from './context'


abstract class Filter {
    public requiredVarsRules: {[varName: string]: string} = {}
    public value: string

    constructor(value: string) {
        this.value = value.trim().toLowerCase()
    }

    bindNewVars(builder: PagesQueryBuilder): [string[], string[]] {
        const missedVars = Object.keys(this.requiredVarsRules).filter((v) => !builder.bindedVars.includes(v))
        return [missedVars, missedVars.map((v) => this.requiredVarsRules[v])]
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
    requiredVarsRules = {'?name': '[?p :block/name ?name]'}

    constructor(value: string, operation: string) {
        super(value)
        this.operation = operation.trim().toLowerCase()
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


class PropertyFilter extends Filter {
    requiredVarsRules = {
        '?properties': '[?p :block/properties ?properties]',
        '?properties-text': '[?p :block/properties-text-values ?properties-text]',
    }

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

        return `[(${this.operation} ?pt-${propertyName} "${value}")]`
    }
    getNotPredicate(builder: PagesQueryBuilder): string {
        if (this.operation === 'regexp') {
            const [compilation, predicate] = this.getPredicate(builder).split('\n')
            return `${compilation}\n(not ${predicate})`
        }

        return super.getNotPredicate(builder)
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
    reference(operation: string, value: string | string[] = '', nonInverted: boolean = true) {
        if (value === '') {
            value = operation
            operation = 'includes'
        }
        return this._filter(new ReferenceFilter(value, operation), nonInverted)
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
