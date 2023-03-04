import '@logseq/libs'
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import { renderTemplateInBlock } from './logic'
import { RenderError, StateError, StateMessage } from './errors'
import { indexOfNth, lockOn, p } from './utils/other'
import { cleanMacroArg, unquote, cleanReference } from './utils/parsing'
import { insertContent, isCommand } from './utils/logseq'

import { dayjs } from './context'
import { LogseqDayjsState }  from './utils/dayjs_logseq_plugin'


async function onSettingsChanged() {
    // TODO work with locales
    // preferredLanguage
    // preferredStartOfWeek
    dayjs.updateLocale('en', {
        weekStart: 1,
    })

    const config = await logseq.App.getUserConfigs()
    LogseqDayjsState.format = config.preferredDateFormat
}

async function init() {
    console.info(p`Loaded`)

    // Logseq reads config setting `preferredDateFormat` with some delay
    // So we need to wait some time
    setTimeout(onSettingsChanged, 100)
}


async function main() {
    init()

    const commandName = 'template'
    const commandLabel = 'FullHouse → Insert template'
    const commandContent = `{{renderer :${commandName}, TEMPLATE NAME, (optional) page reference}}`

    logseq.App.registerCommandPalette({ key: 'insert-template', label: commandLabel }, async (e) => {
        const block = await logseq.Editor.getCurrentBlock()
        if (!block) {
            logseq.UI.showMsg('Start editing block', 'warning', {timeout: 5000})
            return
        }
        insertContent(commandContent, { positionOnArg: 1 })
    })

    logseq.Editor.registerSlashCommand(commandLabel, async (e) => {
        insertContent(commandContent)
    })

    logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
        let [ type, templateName, contextPageName, ...args ] = payload.arguments;
        if (!isCommand(type, commandName))
            return

        templateName = cleanMacroArg(templateName)
        contextPageName = cleanReference(cleanMacroArg(contextPageName))

        console.debug(p`Rendering macro`, {type, templateName, contextPageName, args});

        try {
            await renderTemplateInBlock(payload.uuid, templateName, contextPageName)
        } catch (error) {
            if (error instanceof StateError)
                logseq.UI.showMsg(error.message, 'error', {timeout: 5000})
            else if (error instanceof StateMessage)
                logseq.UI.showMsg(error.message, 'info', {timeout: 5000})
            else if (error instanceof RenderError)
                logseq.UI.showMsg(error.message, 'error', {timeout: 5000})
            else
                console.error(p`${(error as Error).stack}`)
        }
    })

    logseq.onSettingsChanged((old, new_) => {
        onSettingsChanged()
    })
}

logseq.ready().then(main).catch(console.error);
