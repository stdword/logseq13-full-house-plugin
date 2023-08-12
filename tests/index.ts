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
        App: {
            async getCurrentGraphConfigs() { return {} },
            async getCurrentGraph() { return {} },
            async getUserConfigs() {
                const defaultConfig = {
                    preferredDateFormat: 'dd-MM-yyyy',
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
                if (typeof id === 'string')
                    return logseq._blocks.find(block => (block.uuid === id)) ?? null
                return logseq._blocks.find(block => (block.id === id)) ?? null
            },
            async insertAtEditingCursor(content: string) {
                logseq._createBlock({content, children: []})
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
            parent: BlockEntity | null = null,
            page: PageEntity | null = null,
        ): BlockEntity {
            const content = typeof block === 'string' ? block : block.content
            const children = typeof block === 'string' ? [] : block.children

            const obj: BlockEntity = {
                format: 'markdown',

                id: this._blocks.length + 1,
                uuid: genUUID(),
                content: content,
                properties: {},

                // @ts-expect-error
                left: {},
                // @ts-expect-error
                parent: parent ? {id: parent.id} : {},
                page: page ? {id: page.id} : {id: logseq._pages[0].id},
            }
            logseq._blocks.push(obj)

            obj.children = children.map((b) => this._createBlock(b, obj))
            return obj
        },
        _createTemplateBlock: function (name: string, content: string) {
            const obj = logseq._createBlock({
                content: `template:: ${name}`,
                children: [{content: content, children: []}],
            })
            obj.properties!.template = name
            return obj
        }
    }

    Object.assign(logseq.settings, settingsOverride ?? {})

    // @ts-expect-error
    global.logseq = top.logseq = logseq
    await app.init()

    logseq._createPage('PAGE')
    return logseq
 }
