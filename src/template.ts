import '@logseq/libs'
import { IBatchBlock, BlockEntity } from '@logseq/libs/dist/LSPlugin.user'

import * as Eta from 'eta'

import { ILogseqContext, BlockContext, Context, dayjs } from './context'
import { RenderError } from './errors'
import { getTemplateTagsContext } from './tags'
import { p, IBlockNode, walkBlockTree, coerceToBool, LogseqReferenceAccessType, PropertiesUtils } from './utils'


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

    filter: function (value: any): string {
        if (value instanceof dayjs)
            // @ts-expect-error
            return value.toPage()

        if (typeof value === 'string')
            return value

        value = value ?? ''
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
    render(context: ILogseqContext): Promise<IBlockNode>
    isEmpty(): boolean
}

export class Template implements ITemplate {
    public block: BlockEntity
    public name: string
    public includingParent: boolean
    public accessedVia: LogseqReferenceAccessType

    constructor(
        block: BlockEntity, args: {
        name?: string,
        includingParent?: boolean,
        accessedVia: LogseqReferenceAccessType,
    }) {
        this.block = block
        this.name = PropertiesUtils.getProperty(
            this.block, PropertiesUtils.templateProperty).text || args.name || ''

        this.accessedVia = args.accessedVia

        if (args.includingParent !== undefined)
            this.includingParent = args.includingParent
        else {
            // 1) if template accessed via property (== 'name')
            //   → it has properties where `template-including-parent` can be placed
            //   → defaultIncludingParent = false
            // 2) same rule is for templates accessed via page (== 'page')
            // 3) but when template accessed via non-template block (== 'block')
            //   → properties may not exist
            //   → defaultIncludingParent = true

            const defaultIncludingParent = this.accessedVia === 'block'
            const prop = PropertiesUtils.getProperty(this.block, PropertiesUtils.includingParentProperty)
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

        return !(this.block.children && this.block.children.length !== 0)
    }
    async render(context: ILogseqContext): Promise<IBlockNode> {
        console.info(p`Rendering ${this}`)

        const blockContext = BlockContext.createFromEntity(this.block)
        context.template = new Context({
            name: this.name,
            includingParent: this.includingParent,
            block: blockContext,
            props: blockContext.props,
            propsRefs: blockContext.propsRefs,
        }) as unknown as ILogseqContext['template']

        // remove id prop from every block
        await walkBlockTree(this.block as IBlockNode, async (b) => {
            PropertiesUtils.deleteProperty(b as BlockEntity, PropertiesUtils.idProperty)
        })

        // TODO: allow user to control erasing standard props during rendering
        //   manually or via settings

        if (this.includingParent) {
            PropertiesUtils.deleteProperty(this.block, PropertiesUtils.templateProperty)
            PropertiesUtils.deleteProperty(this.block, PropertiesUtils.includingParentProperty)

            if (this.accessedVia === 'page')
                PropertiesUtils.deleteProperty(this.block, PropertiesUtils.titleProperty)
        }

        const renderContext = {
            ...getTemplateTagsContext(),
            c: new Context(context),
        }

        return await walkBlockTree(this.block as IBlockNode, async (b, lvl) => {
            if (lvl === 0 && !this.includingParent)
                return ''

            // @ts-expect-error
            renderContext.c.self = BlockContext.createFromEntity(
                b as BlockEntity, {
                page: context.block.page,
                level: lvl,
            })
            return Eta.render(b.content, renderContext)
        })
    }
}

export class InlineTemplate implements ITemplate {
    public body: string

    constructor(body: string) {
        this.body = body
    }
    async render(context: ILogseqContext): Promise<IBlockNode> {
        return {
            content: Eta.render(this.body, context),
            children: [],
        }
    }
    isEmpty(): boolean {
        return !!this.body
    }
}
