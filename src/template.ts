import '@logseq/libs'
import { IBatchBlock, BlockEntity } from '@logseq/libs/dist/LSPlugin.user'

import * as Eta from 'eta'

import {
    ILocalContext, BlockContext, PageContext, PropertiesContext,
    getGlobalContext,
} from './context'
import { RenderError } from './errors'
import { p, IBlockNode, walkBlockTree, toCamelCase, coerceToBool, LogseqReferenceAccessType } from './utils'


Eta.configure({
    // doc: https://eta.js.org/docs/api/configuration
    autoEscape: false,
    useWith: true,
    autoTrim: [false, false],
    tags: ['``{', '}``'],
    parse: {
        exec: '!',
        interpolate: '',
        raw: '~',
    },
    plugins: [], // TODO: https://github.com/nebrelbug/eta_plugin_mixins

    filter: (value: any): string => {
        if (typeof value === 'function')
            value = value()

        if (typeof value === 'string')
            return value

        return value.toString()
    },
 })


export enum VariableType {
    string,
    choices,
    queryChoices,
    queryPages,
    queryBlocks,
    queryProperties,
 }

export class TemplateVariable {
    name: string
    type: VariableType
    options: {[index: string]: string}
    value: string

    // @ts-nocheck
    constructor(
        name: string,
        type = VariableType.string,
        options = {},
        value = "",
    ) {
        this.name = name
        this.type = type
        this.options = options
        this.value = value
    }
 }


interface ITemplate {
    render(context: Partial<ILocalContext>): IBlockNode
    isEmpty(): boolean
}

export class Template implements ITemplate {
    public static readonly nameProperty: string = 'template'
    public static readonly includingParentProperty: string = 'template-including-parent'

    public block: BlockEntity
    public name: string
    public includingParent: boolean

    constructor(block: BlockEntity, args?: {includingParent?: boolean, accessedVia?: LogseqReferenceAccessType}) {
        this.block = block
        this.name = PropertiesContext.getProperty(this.block, Template.nameProperty).text

        if (args?.includingParent !== undefined)
            this.includingParent = args!.includingParent
        else {
            // if template accessed via property (== 'name')
            // → it has properties where `template-including-parent` can be placed
            // → defaultIncludingParent = false
            //
            // same rule is for templates accessed via page (== 'page')
            //
            // but when template accessed via non-template block (== 'block')
            // → properties may not exist
            // → defaultIncludingParent = true

            const defaultIncludingParent = args?.accessedVia === 'block'
            const prop = PropertiesContext.getProperty(this.block, Template.includingParentProperty)
            const value = prop.refs.length ? prop.refs[0] : prop.text
            this.includingParent = coerceToBool(
                value, {
                defaultForEmpty: defaultIncludingParent,
                defaultForUncoercible: defaultIncludingParent,
            }) as boolean
            console.log(p`QWE`, {value, defaultIncludingParent, r: this.includingParent});
        }

        console.info(p`Created ${this}`)
    }
    toString() {
        return `Template("${this.name}"${this.includingParent ? " with parent" : ""})`
    }
    isEmpty(): boolean {
        if (this.includingParent)
            return false

        return !this.block.children || this.block.children.length === 0
    }
    render(context: Partial<ILocalContext>): IBlockNode {
        console.info(p`Rendering ${this}`)

        context.template = {
            name: this.name,
            includingParent: this.includingParent,
            block: new BlockContext(this.block),
            props: {},
            propsRefs: {},
        }

        // shortcuts
        context.template!.props = context.template!.block.props
        context.template!.propsRefs = context.template!.block.propsRefs

        if (this.includingParent) {
            PropertiesContext.deleteProperty(this.block, Template.nameProperty)
            PropertiesContext.deleteProperty(this.block, Template.includingParentProperty)
        }
        else
            this.block.content = ''  // skip rendering

        const renderContext = getGlobalContext()

        return walkBlockTree(this.block as IBlockNode, (b) => {
            const finalContext = {
                ...renderContext,
                c: {
                    ...context,
                    self: new BlockContext(b as BlockEntity),
                }
            }
            return Eta.render(b.content, finalContext)
        })
    }
}

export class InlineTemplate implements ITemplate {
    public body: string

    constructor(body: string) {
        this.body = body
    }
    render(context: Partial<ILocalContext>): IBlockNode {
        return {
            content: Eta.render(this.body, context),
            children: [],
        }
    }
    isEmpty(): boolean {
        return !!this.body
    }
}
