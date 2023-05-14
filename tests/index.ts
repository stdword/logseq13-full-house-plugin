import 'global-jsdom/register'

import { _private as app } from '@src/app'


export async function LogseqMock(
    settingsOverride: object | null = {},
    configOverride: object = {},
) {
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
