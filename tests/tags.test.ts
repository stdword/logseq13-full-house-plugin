import 'global-jsdom/register'

import { v4 as uuid } from 'uuid'
import * as dayjs from 'dayjs'

import { _private as tags } from '@src/tags'
import { _private as app } from '@src/app'
import { BlockContext, PageContext } from '@src/context'


async function mockLogseq(settingsOverride: object | null = {}, configOverride: object = {}) {
    settingsOverride ??= {}
    configOverride ??= {}

    const logseq = {
        settings: {},
        updateSettings: jest.fn(),
        App: {
            async getUserConfigs() {
                const defaultConfig = {
                    preferredDateFormat: 'yyyy-MM-dd EEE',
                }
                return Object.assign(defaultConfig, configOverride)
            }
        },
        UI: {
            showMsg: jest.fn(),
        },

        api: {
            get_block: jest.fn(),
            get_page: jest.fn(),
        },
    }

    Object.assign(logseq.settings, settingsOverride ?? {})

    // @ts-expect-error
    global.logseq = top.logseq = logseq
    await app.init()
    return logseq
 }


describe('ref template tag', () => {
    test('strings', () => {
        expect( tags.ref('page') ).toBe('[[page]]')
        expect( tags.ref('[page]') ).toBe('[[[page]]]')
        expect( tags.ref('[[page]]') ).toBe('[[page]]')
        expect( tags.ref('[[page') ).toBe('[[[[page]]')

        expect( tags.ref('page with spaces') ).toBe('[[page with spaces]]')
        expect( tags.ref('  page with spaces  ') ).toBe('[[page with spaces]]')
        expect( tags.ref('  [[page with spaces ]] ') ).toBe('[[page with spaces ]]')
    })
    test('block refs', () => {
        const blockID = uuid()
        expect( tags.ref(blockID) ).toBe(`((${blockID}))`)
        expect( tags.ref(`[[${blockID}]]`) ).toBe(`[[${blockID}]]`)
        expect( tags.ref(`((${blockID}))`) ).toBe(`((${blockID}))`)
        expect( tags.ref(`((block))`) ).toBe(`[[((block))]]`)
    })
    test('date strings', async () => {
        await mockLogseq(null, {preferredDateFormat: 'yyyy-MM-dd EEE'})
        expect( tags.ref('2023-01-01') ).toBe('[[2023-01-01 Sun]]')
        expect( tags.ref('[[2023-01-01]]') ).toBe('[[2023-01-01]]')
    })
    test('dates', async () => {
        await mockLogseq(null, {preferredDateFormat: 'yyyy-MM-dd EEE'})
        expect( tags.ref(dayjs('2023-01-01')) ).toBe('[[2023-01-01 Sun]]')

        const now = new Date()
        const date = now.toISOString().slice(0, 10)
        const day = now.toDateString().slice(0, 3)
        expect( tags.ref(dayjs()) ).toBe(`[[${date} ${day}]]`)
    })
    test('block context without api call', async () => {
        const logseq = await mockLogseq()

        const id = uuid()
        const block = new BlockContext(0)
        block.uuid = id

        const mock_get_block = jest.spyOn(logseq.api, 'get_block')
        mock_get_block.mockReturnValue({uuid: id} as unknown as void)

        const r = tags.ref(block)
        expect(mock_get_block).toHaveBeenCalledTimes(0)
        expect(r).toBe(`((${id}))`)
    })
    test('block context with api call', async () => {
        const logseq = await mockLogseq()

        const id = uuid()
        const block = new BlockContext(1)

        const mock_get_block = jest.spyOn(logseq.api, 'get_block')
        mock_get_block.mockReturnValue({uuid: id} as unknown as void)

        const r = tags.ref(block)
        expect(mock_get_block).toHaveBeenCalled()
        expect(r).toBe(`((${id}))`)
    })
    test('page context without api call', async () => {
        const logseq = await mockLogseq()

        const name = 'Test Page'
        const page = new PageContext(0, name)

        logseq.api.get_page.mockReturnValue({originalName: name} as unknown as void)

        const r = tags.ref(page)
        expect(logseq.api.get_page).toHaveBeenCalledTimes(0)
        expect(r).toBe(`[[${name}]]`)
    })
    test('page context with api call', async () => {
        const logseq = await mockLogseq()

        const name = 'Test Page'
        const page = new PageContext(0)

        logseq.api.get_page.mockReturnValue({originalName: name} as unknown as void)

        const r = tags.ref(page)
        expect(logseq.api.get_page).toHaveBeenCalled()
        expect(r).toBe(`[[${name}]]`)
    })
})
