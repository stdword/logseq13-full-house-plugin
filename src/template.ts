import '@logseq/libs'
import { IBatchBlock, BlockEntity } from '@logseq/libs/dist/LSPlugin.user'

import { eta } from '@src/extensions/customized_eta'
import { ILogseqContext, BlockContext, Context, dayjs, ArgsContext } from './context'
import { RenderError } from './errors'
import { getTemplateTagsContext } from './tags'
import {
    p, IBlockNode, walkBlockTree, coerceToBool, LogseqReferenceAccessType,
    PropertiesUtils, Properties
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

    getArgProperties(): Properties
    render(context: ILogseqContext): Promise<IBlockNode>
    isEmpty(): boolean
    toString(): string
}

export class Template implements ITemplate {
    public block: BlockEntity
    public name: string
    public includingParent: boolean
    public accessedVia: LogseqReferenceAccessType

    private _initialized: boolean

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
            const [ start, end ] = [ /^```.*?\n/u, /\n```$/u ]
            const matchStart = b.content.match(start)
            const matchEnd = b.content.match(end)
            if (matchStart && matchEnd)
                b.content = b.content.slice(matchStart[0].length, -matchEnd[0].length)
        })

        // TODO: allow user to control erasing standard props
        PropertiesUtils.deleteProperty(this.block, PropertiesUtils.templateProperty)
        PropertiesUtils.deleteProperty(this.block, PropertiesUtils.includingParentProperty)
        if (this.accessedVia === 'page')
            PropertiesUtils.deleteProperty(this.block, PropertiesUtils.titleProperty)

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
            name: this.name,
            includingParent: this.includingParent,
            block: blockContext,
            props: blockContext.props,
            propsRefs: blockContext.propsRefs,
        }) as unknown as ILogseqContext['template']

        const contextObj = new Context(context)
        const renderContext = {
            ...getTemplateTagsContext(contextObj as unknown as ILogseqContext),
            c: contextObj,
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
            return eta.renderString(b.content, renderContext)
        })
    }
    getArgProperties() {
        return PropertiesUtils.getProperties(this.block, ArgsContext.propertyPrefix).values
    }
}

export class InlineTemplate implements ITemplate {
    public name: string = '__inline__'
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
        const renderContext = {
            ...getTemplateTagsContext(contextObj as unknown as ILogseqContext),
            c: contextObj,
        }

        const body = `${'``{'} ${this.body} ${'}``'}`
        return {
            content: eta.renderString(body, renderContext),
            children: [],
        }
    }
    getArgProperties() {
        return {}
    }
}
