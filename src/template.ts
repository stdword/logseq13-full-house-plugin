import '@logseq/libs'
import { IBatchBlock, BlockEntity } from '@logseq/libs/dist/LSPlugin.user'

import { neatJSON } from 'neatjson'

import { eta } from './extensions/customized_eta'
import { ILogseqContext, BlockContext, Context, ArgsContext, dayjs } from './context'
import { RenderError } from './errors'
import { getTemplateTagsContext } from './tags'
import {
    p, IBlockNode, walkBlockTreeAsync, mapBlockTree, coerceToBool, LogseqReferenceAccessType,
    PropertiesUtils, Properties, unquote, splitMacroArgs,
    walkBlockTree,
    insertTreeNodes,
} from './utils'


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
    static getSelectionPositions(content: string, selectionPositions: number[]): string {
        content = content.trim()

        for (const marker of [
            Template.carriagePositionMarker,
            Template.carriagePositionMarker,
        ]) {
            const position = content.indexOf(marker)
            if (position !== -1) {
                content = content.replace(marker, '')
                selectionPositions.push(position)
            }
        }

        // check spaces near cursor that will be trimmed after insertion to Logseq
        const trimmed = content.trimStart()
        if (content !== trimmed) {
            const delta = content.length - trimmed.length
            const newSelectionPositions = selectionPositions.map(p => Math.max(0, p - delta))
            selectionPositions.length = 0
            selectionPositions.push(...newSelectionPositions)
        }

        return content
    }
    static getArgProperties(block: BlockEntity) {
        return PropertiesUtils.getProperties(block, ArgsContext.propertyPrefix).values
    }
    static convertValueToPretty(obj: any) {
        function prepare(obj) {
            if (typeof obj !== 'object')
                return obj

            if (obj instanceof dayjs) {
                console.log('DAY',)
                // @ts-expect-error
                return obj.toISOString()
            }

            if (Array.isArray(obj)) {
                console.log('ARRAY',)
                return Array.from(
                    obj.map(prepare)
                )
            }

            // a class instance (not a simple object)
            if (obj.__proto__.constructor !== Object) {
                return obj.toString()
            }

            return Object.fromEntries(
                Object.entries(obj)
                    .map(([key, value]) => [key, prepare(value)])
            )
        }

        return neatJSON(prepare(obj), {
            wrap: false,
            short: true,
            afterComma: 1,
            afterColon: 1,
        })
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

        await walkBlockTreeAsync(this.block as IBlockNode, async (b) => {
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
        console.info(p`Rendering ${this} ${context.args._args.length ? 'with args ' + context.args.toCallString() : ''}`)

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

        const finalContext = {c: contextObj, ...tags}

        // this is the way to access variables environment from outer code
        // @ts-expect-error
        contextObj.__env = finalContext

        const tree = await mapBlockTree(this.block as IBlockNode, async (b, lvl, data) => {
            if (lvl === 0 && !this.includingParent)
                return ''

            // @ts-expect-error
            finalContext.c.self = BlockContext.createFromEntity(
                b as BlockEntity, {
                page: context.block.page,
                level: lvl,
            })

            const result: any = await eta.renderStringAsync(b.content, finalContext)

            // get the execution state after code execution
            // @ts-expect-error
            const state = contextObj.__env.state()

            // check for cursor positioning
            if (state.cursorPosition)
                data.selectionPositions = []  // just make a mark for cursor

            // specify the UUID for block
            if (state.setUUID)
                data.setUUID = state.setUUID

            // check creating new blocks
            if (state.spawnedBlocks)
                data.spawnedBlocks = state.spawnedBlocks as IBlockNode[]
            if (state.appendedBlocks)
                data.appendedBlocks = state.appendedBlocks as IBlockNode[]

            // make arrays and objects looks pretty
            if (typeof result === 'object')
                return Template.convertValueToPretty(result)

            return result.toString()
        })


        // spread the tree: add new blocks
        const insertAfter = [] as [number[], IBlockNode[]][]
        walkBlockTree(tree, (b, lvl, path) => {
            if (b.data && b.data.spawnedBlocks) {
                b.children = [...b.data.spawnedBlocks, ...b.children]
                delete b.data.spawnedBlocks
            }
            if (b.data && b.data.appendedBlocks) {
                insertAfter.push([path, b.data.appendedBlocks])
                delete b.data.appendedBlocks
            }
        })
        for (const [path, blocks] of insertAfter)
            insertTreeNodes(tree, path, blocks)

        // setup every new node
        walkBlockTree(tree, (b, lvl, path) => {
            prepareRenderedNode(b)
        })

        return tree
    }
    getArgProperties() {
        return Template.getArgProperties(this.block)
    }
}

export function prepareRenderedNode(node: IBlockNode, opts?: {cursorPosition?: true}) {
    // find blocks with cursor positioning
    if (opts?.cursorPosition || node.data?.selectionPositions) {
        node.data = node.data ?? {}

        const selectionPositions = [] as number[]
        node.content = Template.getSelectionPositions(node.content, selectionPositions)

        if (selectionPositions.length)
            node.data.selectionPositions = selectionPositions
    }

    // set the specified uuid
    if (node.data?.setUUID) {
        const uuid = node.data?.setUUID
        node.properties = node.properties ?? {}
        Object.assign(node.properties, {id: uuid})
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
        console.info(p`Rendering ${this} ${context.args._args.length ? 'with args ' + context.args.toCallString() : ''}`)

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
