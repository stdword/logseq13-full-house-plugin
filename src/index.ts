import '@logseq/libs'
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import { renderTemplateInBlock } from './logic'
import { RenderError, StateError, StateMessage } from './errors'
import { indexOfNth, lockOn, p, sleep } from './utils/other'
import { unquote } from './utils/parsing'
import { cleanMacroArg, insertContent, isCommand, parseReference, PropertiesUtils } from './utils/logseq'

import { dayjs } from './context'
import { LogseqDayjsState }  from './utils/dayjs_logseq_plugin'


async function onAppSettingsChanged() {
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
    if (import.meta.env.DEV) {
        // @ts-expect-error
        logseq.UI.showMsg(`HMR #${top!.hmr_count}`, 'info', {timeout: 3000})
    }

    console.info(p`Loaded`)

    // Logseq reads config setting `preferredDateFormat` with some delay
    // So we need to wait some time
    setTimeout(onAppSettingsChanged, 100)
}

async function main() {
    init()

    const commandName = 'template'
    const commandLabel = 'Full House → Insert template'
    const commandContent = `{{renderer :${commandName}, TEMPLATE NAME, (optional) page reference}}`

    logseq.App.registerCommandPalette(
        { key: 'insert-template', label: commandLabel }, async (e) => {
            const inserted = await insertContent(commandContent, { positionOnArg: 1 })
            if (!inserted) {
                // TODO: ask UI to insert template to the end of current page
                await logseq.UI.showMsg(
                    'Start editing block or select one to insert template in it',
                    'warning',
                    {timeout: 5000},
                )
                return
            }
    })

    logseq.Editor.registerSlashCommand(commandLabel, async (e) => {
        await insertContent(commandContent, { positionOnArg: 1 })
    })

    logseq.Editor.registerBlockContextMenuItem(
        'Use as the template', async (e) => {
            const templateName = await logseq.Editor.getBlockProperty(
                e.uuid, PropertiesUtils.templateProperty)
            const templateRef = templateName ? templateName : `((${e.uuid}))`
            const textToCopy = `{{renderer :${commandName}, ${templateRef}}}`

            window.focus()  // need to make an interactions with clipboard
            await navigator.clipboard.writeText(textToCopy)

            await logseq.UI.showMsg('Code copied to clipboard',
                'success', {timeout: 5000})
    })

    logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
        let [ type_, templateRef_, contextPageRef_, ...args ] = payload.arguments
        if (!isCommand(type_, commandName))
            return

        templateRef_ = cleanMacroArg(templateRef_)
        contextPageRef_ = cleanMacroArg(contextPageRef_)

        if (!templateRef_) {
            await logseq.UI.showMsg('Template reference is required', 'error', {timeout: 5000})
            return
        }

        let includingParent: boolean | undefined
        if ('+-'.includes(templateRef_[0])) {
            includingParent = templateRef_[0] == '+'
            templateRef_ = templateRef_.slice(1)
        }

        const templateRef = parseReference(templateRef_)
        const contextPageRef = parseReference(contextPageRef_)
        if (contextPageRef && contextPageRef.type === 'block') {
            await logseq.UI.showMsg('Argument should be a page reference', 'error', {timeout: 5000})
            return
        }

        console.debug(
            p`Rendering macro`,
            {type_, templateRef, includingParent, contextPageRef, args},
        )

        try {
            await renderTemplateInBlock(payload.uuid, templateRef, includingParent, contextPageRef)
        } catch (error) {
            if (error instanceof StateError)
                await logseq.UI.showMsg(error.message, 'error', {timeout: 5000})
            else if (error instanceof StateMessage)
                await logseq.UI.showMsg(error.message, 'info', {timeout: 5000})
            else if (error instanceof RenderError)
                await logseq.UI.showMsg(error.message, 'error', {timeout: 5000})
            else
                console.error(p`${(error as Error).stack}`)
        }
    })

    logseq.onSettingsChanged(async (old, new_) => {
        await onAppSettingsChanged()
    })
}


if (import.meta.env.DEV) {
    // @ts-expect-error
    top!.hmr_count = (top!.hmr_count + 1) || 1
}

logseq.ready(main).catch(console.error)
