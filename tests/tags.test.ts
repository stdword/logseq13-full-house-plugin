import { v4 as uuid } from 'uuid'

import 'global-jsdom/register'

import { _private as tags } from '@src/tags'
import { _private as app } from '@src/index'


async function mockLogseq(settingsOverride: object | null = {}, configOverride: object = {}) {
    settingsOverride ??= {}
    configOverride ??= {}

    const logseq = {
        settings: {
        },
        updateSettings() {},
        App: {
            async getUserConfigs() {
                const defaultConfig = {
                    preferredDateFormat: 'yyyy-MM-dd EEE',
                }
                return Object.assign(defaultConfig, configOverride)
            }
        },
        UI: {
            showMsg() {}
        }
    }

    Object.assign(logseq.settings, settingsOverride ?? {})

    // @ts-expect-error
    global.logseq = logseq
    await app.init()
 }


describe('ref', () => {
    // beforeEach(() => {
    //     mockLogseq()
    // })

    test('strings', async () => {
        expect( tags.ref('page') ).toBe('[[page]]')
        expect( tags.ref('[page]') ).toBe('[[[page]]]')
        expect( tags.ref('[[page]]') ).toBe('[[page]]')
        expect( tags.ref('[[page') ).toBe('[[[[page]]')

        expect( tags.ref('page with spaces') ).toBe('[[page with spaces]]')
        expect( tags.ref('  page with spaces  ') ).toBe('[[page with spaces]]')
        expect( tags.ref('  [[page with spaces ]] ') ).toBe('[[page with spaces ]]')
    })

    test('block refs', async () => {
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
})
// https://stackoverflow.com/questions/62898345/how-to-mock-dayjs-chained-methods
