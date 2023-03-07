import '@logseq/libs'
import { IBatchBlock, BlockEntity } from '@logseq/libs/dist/LSPlugin.user'

import * as Eta from 'eta'

import { ILogseqContext, BlockContext, PageContext, Context } from './context'
import { RenderError } from './errors'
import { getTemplateTagsContext } from './tags'
import { p, IBlockNode, walkBlockTree, toCamelCase, coerceToBool, LogseqReferenceAccessType, PropertiesUtils } from './utils'


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
    render(context: ILogseqContext): IBlockNode
    isEmpty(): boolean
}

export class Template implements ITemplate {
    public static readonly nameProperty: string = 'template'
    public static readonly includingParentProperty: string = 'template-including-parent'

    public block: BlockEntity
    public name: string
    public includingParent: boolean

    constructor(
        block: BlockEntity, args?: {
        name?: string,
        includingParent?: boolean,
        accessedVia?: LogseqReferenceAccessType,
    }) {
        this.block = block
        this.name = PropertiesUtils.getProperty(
            this.block, Template.nameProperty).text || args?.name || ''

        if (args?.includingParent !== undefined)
            this.includingParent = args!.includingParent
        else {
            // 1) if template accessed via property (== 'name')
            //   → it has properties where `template-including-parent` can be placed
            //   → defaultIncludingParent = false
            // 2) same rule is for templates accessed via page (== 'page')
            // 3) but when template accessed via non-template block (== 'block')
            //   → properties may not exist
            //   → defaultIncludingParent = true

            const defaultIncludingParent = args?.accessedVia === 'block'
            const prop = PropertiesUtils.getProperty(this.block, Template.includingParentProperty)
            const value = prop.refs.length ? prop.refs[0] : prop.text
            this.includingParent = coerceToBool(
                value, {
                defaultForEmpty: defaultIncludingParent,
                defaultForUncoercible: defaultIncludingParent,
            }) as boolean
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
    render(context: ILogseqContext): IBlockNode {
        console.info(p`Rendering ${this}`)

        context.template = new Context({
            name: this.name,
            includingParent: this.includingParent,
            block: new BlockContext(this.block),
            props: {},
            propsRefs: {},
        }) as unknown as ILogseqContext['template']

        // shortcuts
        context.template!.props = context.template!.block.props
        context.template!.propsRefs = context.template!.block.propsRefs

        if (this.includingParent) {
            PropertiesUtils.deleteProperty(this.block, Template.nameProperty)
            PropertiesUtils.deleteProperty(this.block, Template.includingParentProperty)
        }
        else
            this.block.content = ''  // skip rendering

        const renderContext = {
            ...getTemplateTagsContext(),
            c: new Context(context),
        }

        return walkBlockTree(this.block as IBlockNode, (b) => {
            // @ts-expect-error
            renderContext.c.self = new BlockContext(b as BlockEntity)
            return Eta.render(b.content, renderContext)
        })
    }
}

export class InlineTemplate implements ITemplate {
    public body: string

    constructor(body: string) {
        this.body = body
    }
    render(context: ILogseqContext): IBlockNode {
        return {
            content: Eta.render(this.body, context),
            children: [],
        }
    }
    isEmpty(): boolean {
        return !!this.body
    }
}
