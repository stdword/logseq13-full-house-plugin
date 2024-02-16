import 'global-jsdom/register'

import { v4 as genUUID } from 'uuid'


import { _private as app } from '@src/app'
import { BlockEntity, IEntityID, PageEntity } from '@logseq/libs/dist/LSPlugin'
import { IBlockNode } from '@src/utils'

import { logseq as packageInfo, version as pluginVersion } from '@src/../package.json'


export async function LogseqMock(
    settingsOverride: object | null = {},
    configOverride: object = {},
) {
    settingsOverride ??= {}
    configOverride ??= {}

    const logseq = {
        _pages: [] as PageEntity[],
        _blocks: [] as BlockEntity[],

        baseInfo: {
            id: packageInfo.id,
            version: pluginVersion,
        },

        settings: {},
        updateSettings: jest.fn(),
        on: jest.fn(),

        App: {
            async getCurrentGraphConfigs() { return {} },
            async getCurrentGraph() { return {} },
            async getUserConfigs() {
                const defaultConfig = {
                    preferredDateFormat: 'dd-MM-yyyy',
                    preferredStartOfWeek: 0,
                }
                return Object.assign(defaultConfig, configOverride)
            }
        },
        DB: {
            datascriptQuery: jest.fn(),
        },
        Editor: {
            async getPage(id: number | string, options?: object): Promise<PageEntity | null> {
                if (typeof id === 'string')
                    return logseq._pages.find(page => (page.name === id)) ?? null
                return logseq._pages.find(page => (page.id === id)) ?? null
            },
            async getBlock(id: number | string, options?: object): Promise<BlockEntity | null> {
                return logseq._getBlock(id, options)
            },
            async insertAtEditingCursor(content: string) {
                logseq._createBlock({content, children: []})
            },
            async insertBatchBlock(
                uuid: string,
                children: IBlockNode[],
                opts?: Partial<{
                    sibling: boolean
                }>) {
                opts ||= {}

                const block = await this.getBlock(uuid)
                if (!block)
                    throw Error(`Block doesn't exist: ${uuid}`)

                if (opts.sibling)
                    for (const child of children)
                        logseq._createBlock(child, block.parent.id, block.page.id)
                else
                    for (const child of children)
                        logseq._createBlock(child, block, block.page.id)
            },
            async updateBlock(uuid, newContent) {
                const block = await this.getBlock(uuid)
                if (block)
                    block.content = newContent
            },
        },
        UI: {
            showMsg: jest.fn(),
        },

        api: {
            get_block: jest.fn(),
            get_page: jest.fn(),
            get_app_info: () => { return {} },
            datascript_query: jest.fn(),
        },

        _createPage: function (name: string): PageEntity {
            const obj: PageEntity = {
                format: 'markdown',

                id: this._pages.length + 1,
                uuid: genUUID(),

                name: name,
                originalName: name,

                'journal?': false,
                journalDay: undefined,
            }

            logseq._pages.push(obj)
            return obj
        },
        _createJournalPage: function (isoDay: string): PageEntity {
            const obj: PageEntity = {
                format: 'markdown',

                id: this._pages.length + 1,
                uuid: genUUID(),

                name: isoDay,
                originalName: isoDay,

                'journal?': true,
                journalDay: Number(isoDay.replaceAll('-', '')),
            }

            logseq._pages.push(obj)
            return obj
        },
        _createBlock: function (
            block: IBlockNode | string,
            parent: BlockEntity | number | null = null,
            page: PageEntity | number | null = null,
        ): BlockEntity {
            const content = typeof block === 'string' ? block : block.content
            const children = typeof block === 'string' ? [] : block.children
            const pageID = (typeof page === 'number') ? page : (page ? page.id : logseq._pages[0].id)
            const parentID = (typeof parent === 'number') ? parent : (parent ? parent.id : null)

            const obj: BlockEntity = {
                format: 'markdown',

                id: this._blocks.length + 1,
                uuid: genUUID(),
                content: content,
                properties: {},

                // @ts-expect-error
                left: {},
                // @ts-expect-error
                parent: parentID ? {id: parentID} : {},
                page: {id: pageID},
            }
            logseq._blocks.push(obj)

            obj.children = children.map((b) => this._createBlock(b, obj))

            if (parentID) {
                const parentBlock = this._getBlock(parentID)!
                if (!parentBlock.children)
                    parentBlock.children = []
                parentBlock.children.push(obj)
            }

            return obj
        },
        _createTemplateBlock: function (name: string, content: string) {
            const obj = logseq._createBlock({
                content: `template:: ${name}`,
                children: [{content: content, children: []}],
            })
            obj.properties!.template = name
            return obj
        },
        _getBlock: function (id: number | string, options?: object): BlockEntity | null {
            if (typeof id === 'string')
                return logseq._blocks.find(block => (block.uuid === id)) ?? null
            return logseq._blocks.find(block => (block.id === id)) ?? null
        },
    }

    Object.assign(logseq.settings, settingsOverride ?? {})

    // @ts-expect-error
    global.logseq = top.logseq = logseq
    await app.postInit()

    logseq._createPage('PAGE')
    return logseq
}
