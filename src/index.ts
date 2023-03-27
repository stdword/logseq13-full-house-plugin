import '@logseq/libs'
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import { dayjs } from './context'
import { renderTemplateInBlock, renderTemplateView } from './logic'
import {
    indexOfNth, lockOn, p, sleep,
    cleanMacroArg, parseReference, isEmptyString,
    insertContent, PropertiesUtils, RendererMacro,
    LogseqDayjsState,
    LogseqReference,
} from './utils'
import { RenderError, StateError, StateMessage } from './errors'


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

    logseq.onSettingsChanged(async (old, new_) => {
        await onAppSettingsChanged()
    })

    const commandLabel = 'Insert 🏛template'
    const commandTemplate = RendererMacro.command('template')
    const commandGuide = commandTemplate
        .arg('TEMPLATE NAME')
        .arg('(optional) page reference')
        .toString()

    logseq.App.registerCommandPalette(
        { key: 'insert-template', label: commandLabel }, async (e) => {
            const inserted = await insertContent(commandGuide, { positionOnArg: 1 })
            if (!inserted) {
                // TODO?: ask UI to insert template to the end of current page
                await logseq.UI.showMsg(
                    'Start editing block or select one to insert template in it',
                    'warning',
                    {timeout: 5000},
                )
                return
            }
    })

    logseq.Editor.registerSlashCommand(commandLabel, async (e) => {
        // here user always in editing mode, so no need to check insertion
        await insertContent(commandGuide, { positionOnArg: 1 })
    })

    logseq.Editor.registerBlockContextMenuItem(
        'Copy as 🏛template', async (e) => {
            const templateName = await logseq.Editor.getBlockProperty(
                e.uuid, PropertiesUtils.templateProperty)
            const templateRef = templateName ? templateName : `((${e.uuid}))`
            const textToCopy = commandTemplate.arg(templateRef).toString()

            window.focus()  // need to make an interactions with clipboard
            await navigator.clipboard.writeText(textToCopy)

            await logseq.UI.showMsg('Copied to clipboard',
                'success', {timeout: 5000})
    })

    handleTemplateCommand(commandTemplate)
    handleTemplateViewCommand(RendererMacro.command('template-view'))
}

async function handleRequiredRef(ref: string, refUserName: string) {
    ref = cleanMacroArg(ref)
    if (!ref) {
        await logseq.UI.showMsg(`${refUserName} reference is required`, 'error', {timeout: 5000})
        return null
    }

    return parseReference(ref)!
 }
async function handleLogicErrors(func: Function) {
    try {
        await func()
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
 }

function handleTemplateCommand(command: RendererMacro) {
    let unload = logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
        const uuid = payload.uuid
        let [ type_, templateRef_, contextPageRef_, ...args ] = payload.arguments
        const rawCommand = RendererMacro.command(type_)
        if (rawCommand.name !== command.name)
            return

        const raw = rawCommand.arg(templateRef_).arg(contextPageRef_).args(args)
        console.debug(p`Parsing:`, {macro: raw.toString()})

        const templateRef = await handleRequiredRef(templateRef_, 'Template')
        if (!templateRef)
            return

        let includingParent: boolean | undefined
        if (templateRef.option)
            includingParent = templateRef.option === '+'  // or '-'

        contextPageRef_ = cleanMacroArg(contextPageRef_, {escape: false, unquote: false})
        if (isEmptyString(contextPageRef_))
            contextPageRef_ = ''

        const contextPageRef = parseReference(contextPageRef_)
        if (contextPageRef && contextPageRef.type === 'block') {
            await logseq.UI.showMsg('Argument should be a page reference', 'error', {timeout: 5000})
            return
        }

        args = args.map(arg => cleanMacroArg(arg, {escape: false, unquote: true}))

        console.debug(p`Rendering template`,
            {uuid, templateRef, includingParent, contextPageRef, args})
        await handleLogicErrors(async () => {
            await renderTemplateInBlock(
                uuid, templateRef, raw, {
                includingParent, pageRef: contextPageRef, args,
            })
        })
    })
    logseq.beforeunload(unload as unknown as () => Promise<void>)
 }
function handleTemplateViewCommand(command: RendererMacro) {
    const unload = logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
        const uuid = payload.uuid
        let [ type_, templateRef_, ...args ] = payload.arguments
        const rawCommand = RendererMacro.command(type_)
        if (rawCommand.name !== command.name)
            return

        const raw = rawCommand.arg(templateRef_).args(args)
        console.debug(p`Parsing:`, {macro: raw.toString()})

        const templateRef = await handleRequiredRef(templateRef_, 'Template')
        if (!templateRef)
            return

        if (templateRef.option === '+')
            await logseq.UI.showMsg(
                '"+" option has no effect: Template view always renders without parent',
                'info', {timeout: 5000})

        args = args.map(arg => cleanMacroArg(arg, {escape: false, unquote: true}))

        console.debug(p`Rendering template view`, {slot, uuid, templateRef, args})
        await handleLogicErrors(async () => {
            await renderTemplateView(slot, uuid, templateRef!, raw, args)
        })
    })
    logseq.beforeunload(unload as unknown as () => Promise<void>)
 }

if (import.meta.env.DEV) {
    // @ts-expect-error
    top!.hmr_count = (top!.hmr_count + 1) || 1
 }
logseq.ready(main).catch(console.error)
