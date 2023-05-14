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
                    preferredDateFormat: 'dd-MM-yyyy',
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
        const block = new BlockContext(0, id)

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

describe('embed template tag', () => {
    test('strings', async () => {
        expect( tags.embed('page') ).toBe('{{embed [[page]]}}')
        expect( tags.embed('[[page]]') ).toBe('{{embed [[page]]}}')

        const blockID = uuid()
        expect( tags.embed(blockID) ).toBe(`{{embed ((${blockID}))}}`)
        expect( tags.embed(`((${blockID}))`) ).toBe(`{{embed ((${blockID}))}}`)
    })
    test('dates', async () => {
        await mockLogseq(null, {preferredDateFormat: 'dd-MM-yyyy'})
        expect( tags.embed('2023-01-01') ).toBe('{{embed [[01-01-2023]]}}')
        expect( tags.embed('[[2023|01|01]]') ).toBe('{{embed [[2023|01|01]]}}')
        expect( tags.embed(dayjs('2023-12-12')) ).toBe('{{embed [[12-12-2023]]}}')
    })
    test('block context', async () => {
        const logseq = await mockLogseq()

        const id = uuid()
        const block = new BlockContext(0, id)

        expect( tags.embed(block) ).toBe(`{{embed ((${id}))}}`)
    })
    test('page context', async () => {
        const logseq = await mockLogseq()

        const name = 'Test Page'
        const page = new PageContext(0, name)

        expect( tags.embed(page) ).toBe(`{{embed [[${name}]]}}`)
    })
})

describe('empty template tag', () => {
    test('empty values', () => {
        expect( tags.empty('') ).toBe('')
        expect( tags.empty('   ') ).toBe('')

        expect( tags.empty('""') ).toBe('')
        expect( tags.empty("''") ).toBe('')
        expect( tags.empty("``") ).toBe('')
        expect( tags.empty('«»') ).toBe('')

        expect( tags.empty('-') ).toBe('')
        expect( tags.empty('—') ).toBe('')

        expect( tags.empty({}) ).toBe('')
        expect( tags.empty([]) ).toBe('')

        expect( tags.empty(undefined) ).toBe('')
    })
    test('non-empty values', () => {
        expect( tags.empty('page') ).toBe('page')

        expect( tags.empty(null) ).toBe(null)

        expect( tags.empty(false) ).toBe(false)
        expect( tags.empty(true) ).toBe(true)

        expect( tags.empty(0) ).toBe(0)
        expect( tags.empty(1) ).toBe(1)

        expect( tags.empty(0.1) ).toBe(0.1)
        expect( tags.empty(1.1) ).toBe(1.1)

        expect( tags.empty({'page': 1}) ).toEqual({'page': 1})
        expect( tags.empty(['page']) ).toEqual(['page'])
    })
    test('fallback', () => {
        expect( tags.empty('', 'default') ).toBe('default')
        expect( tags.empty('no', 'default') ).toBe('no')
    })
})

describe('when template tag', () => {
    test('false condition', async () => {
        expect( tags.when('', 'result') ).toBe('')
        expect( tags.when(false, 'result') ).toBe('')
        expect( tags.when(0, 'result') ).toBe('')
        expect( tags.when(null, 'result') ).toBe('')
        expect( tags.when(undefined, 'result') ).toBe('')

        expect( tags.when('page'.length == 0, 'result') ).toBe('')
    })
    test('fallback', async () => {
        expect( tags.when('', 'result', 'empty') ).toBe('empty')
        expect( tags.when('ok', 123, 'empty') ).toBe('123')
        expect( tags.when('', 'result', 123) ).toBe('123')
    })
    test('substitution', async () => {
        expect( tags.when(123, '{{embed [[$1]]}}') ).toBe('{{embed [[123]]}}')
        expect( tags.when(123, '{{embed [[${}]]}}') ).toBe('{{embed [[123]]}}')
        expect( tags.when(123, '{{embed [[${_}]]}}') ).toBe('{{embed [[123]]}}')
    })
})
