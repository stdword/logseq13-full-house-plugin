import '@logseq/libs'

import { escape, f, p } from './utils'
import { PageContext } from './context'



abstract class Filter {
    public requiredVarsRules: {[varName: string]: string} = {}
    public value: string

    constructor(value: string) {
        this.value = value.trim().toLowerCase()
    }

    bindNewVars(bindedVars: string[]): [string[], string[]] {
        const missedVars = Object.keys(this.requiredVarsRules).filter((v) => !bindedVars.includes(v))
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
}


class PrefixFilter extends Filter {
    requiredVarsRules = {'?name': '[?p :block/name ?name]'}

    getPredicate(builder: PagesQueryBuilder): string {
        return `[(clojure.string/starts-with? ?name "${this.value}")]`
    }
}


class PropertyFilter extends Filter {
    requiredVarsRules = {
        '?properties': '[?p :block/properties ?properties]',
        '?properties-text': '[?p :block/properties-text-values ?properties-text]',
    }

    getPredicate(builder: PagesQueryBuilder): string {
        builder.lastState = this.value  // save last property name
        return `
            [(get ?properties :${this.value}) ?p-${this.value}]
            [(get ?properties-text :${this.value}) ?pt-${this.value}]
        `.trim()
    }
}


class EmptyFilter extends Filter {
    allowedOperations = ['=', '!=']

    checkArgs(builder: PagesQueryBuilder): string | null {
        if (builder.lastState === null)
            return 'Preceding property filter is required'
        if (!this.allowedOperations.includes(this.value))
            return `Unknown operation: ${this.value}`
        return null
    }
    getPredicate(builder: PagesQueryBuilder): string {
        const propertyName = builder.lastState
        if (this.value === '=')
            return `[(= ?p-${propertyName} "")]`
        else if (this.value === '!=')
            return `[(!= ?p-${propertyName} "")]`
        return ''
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
            const tempVarName = `?re-${propertyName}-${uniqID}`
            const value = escape(this.value, ['"', '\\'])
            return `
                [(re-pattern "${value}") ${tempVarName}]
                [(re-find ${tempVarName} ?pt-${propertyName})]]
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
}


class ReferenceFilter extends Filter {
    values: string[]
    operation: string
    allowedOperations = [
        'includes', 'excludes', 'includes only',
    ]

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
        else if (operation === 'excludes') {
            const p = values.map((v) => `[(contains? ?p-${propertyName} "${v}")]`).join('\n')
            return `(not ${p})`
        }
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
    _filter(f: Filter): PagesQueryBuilder {
        const message = f.checkArgs(this)
        if (message)
            throw new Error(`${f}: ${message}`)

        const [newVars, binders] = f.bindNewVars(this.bindedVars)
        this.bindedVars.push(...newVars)

        const predicate = [...binders, f.getPredicate(this)].join('\n')

        this.filters.push(predicate)
        return this.clone()
    }

    prefix(value: string) {
        return this._filter(new PrefixFilter(value))
    }

    property(name: string) {
        return this._filter(new PropertyFilter(name))
    }

    nonEmpty() {
        return this._filter(new EmptyFilter('!='))
    }
    empty() {
        return this._filter(new EmptyFilter('='))
    }

    integerValue(operation: string, value: string = '') {
        if (value === '') {
            value = operation
            operation = '='
        }
        value = value.toString()
        return this._filter(new IntegerValueFilter(value, operation))
    }
    value(operation: string, value: string = '') {
        if (value === '') {
            value = operation
            operation = '='
        }
        value = value.toString()
        return this._filter(new ValueFilter(value, operation))
    }
    references(operation: string, value: string | string[] = '') {
        if (value === '') {
            value = operation
            operation = 'includes'
        }
        return this._filter(new ReferenceFilter(value, operation))
    }

    _get(namesOnly: boolean = true) {
        const filters = this.filters.join('\n\n')
        const query = `
            [:find ${namesOnly ? '?original-name' : '(pull ?p [*])'}
             :where
                [?p :block/original-name ?original-name]

                ${filters}
            ]
        `.trim()

        console.debug(p`PagesQueryBuilder:`, {query})

        // @ts-expect-error
        const results = top!.logseq.api.datascript_query(query)

        if (!results)
            return []
        return results.flat()
    }
    names() {
        return this._get(true)
    }
    get(wrap: boolean = true) {
        const items = this._get(false)
        if (wrap)
            return items.map(PageContext.createFromEntity)
        return items
    }
    first(wrap: boolean = true) {
        const first = this._get(false)[0]
        if (!first)
            return null
        if (wrap)
            return PageContext.createFromEntity(first)
        return first
    }
    random(wrap: boolean = true) {
        const items = this._get(false)
        const chosen = items[Math.floor((Math.random() * items.length))]
        if (wrap)
            return PageContext.createFromEntity(chosen)
        return chosen
    }
}
