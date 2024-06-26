import '@logseq/libs'
import { IBatchBlock, BlockEntity } from '@logseq/libs/dist/LSPlugin.user'

import { eta } from './extensions/customized_eta'
import { ILogseqContext, BlockContext, Context, ArgsContext } from './context'
import { RenderError } from './errors'
import { getTemplateTagsContext } from './tags'
import {
    p, IBlockNode, walkBlockTree, coerceToBool, LogseqReferenceAccessType,
    PropertiesUtils, Properties, unquote, splitMacroArgs
} from './utils'


// export enum VariableType {
//     string,
//     choices,
//     queryChoices,
//     queryPages,
//     queryBlocks,
//     queryProperties,
//  }

// export class TemplateVariable {
//     name: string
//     type: VariableType
//     options: {[index: string]: string}
//     value: string

//     // @ts-nocheck
//     constructor(
//         name: string,
//         type = VariableType.string,
//         options = {},
//         value = "",
//     ) {
//         this.name = name
//         this.type = type
//         this.options = options
//         this.value = value
//     }
//  }


export interface ITemplate {
    name: string
    includingParent: boolean

    getArgProperties(): Properties
    render(context: ILogseqContext): Promise<IBlockNode>
    isEmpty(): boolean
    toString(): string
}

export class Template implements ITemplate {
    static readonly carriagePositionMarker = '{|}'

    public block: BlockEntity
    public name: string
    public includingParent: boolean
    public accessedVia: LogseqReferenceAccessType

    private _initialized: boolean

    static getUsageArgs(block: BlockEntity): string[] {
        const usage = Template.getUsageString(block, {cleanMarkers: true})
        if (usage)
            return splitMacroArgs(usage)
        return []
    }
    static getUsageString(
        block: BlockEntity,
        opts: { cleanMarkers?: boolean } = {cleanMarkers: false},
    ): string {
        let usage = PropertiesUtils.getProperty(
                block, PropertiesUtils.templateUsageProperty
            ).text
        if (!usage)
            return ''

        usage = Template.cleanUsageString(usage, { cleanMarkers: opts.cleanMarkers })

        return usage
    }
    static cleanUsageString(
        value: string,
        opts: { cleanMarkers?: boolean } = {cleanMarkers: false},
    ) {
        // value can be `quoted` or ``double quoted``
        value = unquote(value, '``')
        value = unquote(value, '``')

        if (opts.cleanMarkers) {
            // supports only two markers, so left intact any others
            value = value.replace(Template.carriagePositionMarker, '')
            value = value.replace(Template.carriagePositionMarker, '')
        }

        return value
    }
    static getArgProperties(block: BlockEntity) {
        return PropertiesUtils.getProperties(block, ArgsContext.propertyPrefix).values
    }

    constructor(
        block: BlockEntity, args: {
        name?: string,
        includingParent?: boolean,
        accessedVia: LogseqReferenceAccessType,
    }) {
        this._initialized = false
        this.block = block
        this.name = PropertiesUtils.getProperty(
            this.block, PropertiesUtils.templateProperty).text || args.name || ''

        this.accessedVia = args.accessedVia

        if (args.includingParent !== undefined)
            this.includingParent = args.includingParent
        else {
            // 1) template accessed via property (== 'name')
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
    }
    async init() {
        if (this._initialized)
            return

        await walkBlockTree(this.block as IBlockNode, async (b) => {
            // remove id prop from every block
            PropertiesUtils.deleteProperty(b as BlockEntity, PropertiesUtils.idProperty)

            // unwrap triple back-ticks block: special case for long templates
            const [ start, end ] = [ /^\n?```.*?\n/u, /\n```$/u ]
            const matchStart = b.content.match(start)
            const matchEnd = b.content.match(end)
            if (matchStart && matchEnd)
                b.content = b.content.slice(matchStart[0].length, -matchEnd[0].length)
        })

        if (this.includingParent) {
            PropertiesUtils.deleteProperty(this.block, PropertiesUtils.templateProperty)
            PropertiesUtils.deleteProperty(this.block, PropertiesUtils.includingParentProperty)
            PropertiesUtils.deleteProperty(this.block, PropertiesUtils.templateListAsProperty)
            PropertiesUtils.deleteProperty(this.block, PropertiesUtils.templateUsageProperty)
            if (this.accessedVia === 'page') {
                PropertiesUtils.deleteProperty(this.block, PropertiesUtils.titleProperty)
                PropertiesUtils.deleteProperty(this.block, PropertiesUtils.filtersProperty)
            }
        }

        this._initialized = true
    }
    checkInit() {
        if (!this._initialized)
            throw Error('Assertion Error: Template instance should be initialized before any use')
    }
    toString() {
        return `Template("${this.name}"${this.includingParent ? " with parent" : ""})`
    }
    isEmpty(): boolean {
        this.checkInit()

        const hasChildren = this.block.children && this.block.children.length !== 0
        if (!this.includingParent)
            return !hasChildren

        return !hasChildren && !this.block.content.trim()
    }
    async render(context: ILogseqContext): Promise<IBlockNode> {
        this.checkInit()
        console.info(p`Rendering ${this}`)

        const blockContext = BlockContext.createFromEntity(this.block)
        context.template = new Context({
            _obj: this,
            name: this.name,
            includingParent: this.includingParent,
            block: blockContext,
            props: blockContext.props,
            propsRefs: blockContext.propsRefs,
        }) as unknown as ILogseqContext['template']

        const contextObj = new Context(context)
        const tags = getTemplateTagsContext(contextObj as unknown as ILogseqContext)

        // @ts-expect-error
        contextObj.tags = new Context(tags)

        const renderContext = {c: contextObj, ...tags}

        return await walkBlockTree(this.block as IBlockNode, async (b, lvl) => {
            if (lvl === 0 && !this.includingParent)
                return ''

            // @ts-expect-error
            renderContext.c.self = BlockContext.createFromEntity(
                b as BlockEntity, {
                page: context.block.page,
                level: lvl,
            })
            return eta.renderStringAsync(b.content, renderContext)
        })
    }
    getArgProperties() {
        return Template.getArgProperties(this.block)
    }
}

export class InlineTemplate implements ITemplate {
    public name = '__inline__'
    public includingParent = true
    public body: string

    constructor(body: string) {
        this.body = body
    }
    isEmpty(): boolean {
        return !this.body
    }
    toString() {
        return `InlineTemplate("${this.body}")`
    }
    async render(context: ILogseqContext): Promise<IBlockNode> {
        console.info(p`Rendering ${this}`)

        context.template = new Context({
            name: this.name,
            includingParent: true,
            block: BlockContext.empty(),
            props: Context.empty(),
            propsRefs: Context.empty(),
        }) as unknown as ILogseqContext['template']

        const contextObj = new Context({
            ...context,
            self: BlockContext.empty(),
        })
        const tags = getTemplateTagsContext(contextObj as unknown as ILogseqContext)

        // @ts-expect-error
        contextObj.tags = tags

        const renderContext = {c: contextObj, ...tags}

        const body = '`` ' + this.body + ' ``'
        return {
            content: await eta.renderStringAsync(body, renderContext),
            children: [],
        }
    }
    getArgProperties() {
        return {}
    }
}
