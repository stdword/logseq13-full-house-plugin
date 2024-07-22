import { BlockEntity, IBatchBlock, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import { render } from 'preact'

import { LogseqDayjsState } from './extensions/dayjs_logseq_plugin'
import { dayjs } from './context'
import {
    renderTemplateInBlock, renderTemplateView, renderView,
    templateMacroStringForBlock, templateMacroStringForPage,
} from './logic'
import {
    indexOfNth, lockOn, p, sleep,
    cleanMacroArg, parseReference, isEmptyString,
    insertContent, PropertiesUtils, RendererMacro,
    LogseqReference,
    walkBlockTreeAsync,
    IBlockNode,
    escapeForRegExp,
    getCSSVars,
    loadThemeVars,
    getPageFirstBlock,
    getPage,
    getChosenBlocks,
    resolvePageAliases,
} from './utils'
import { RenderError, StateError, StateMessage } from './errors'
import InsertUI, { isMacOS, shortcutToOpenInsertUI, showInsertRestrictionMessage } from './ui/insert'
import { array_sorted } from './tags'
import { query_table_clickHeader, iconSortAsc, iconSortDesc } from './ui/query-table'


const DEV = process.env.NODE_ENV === 'development'


async function onAppSettingsChanged() {
    const config = await logseq.App.getUserConfigs()
    LogseqDayjsState.format = config.preferredDateFormat

    const locales_Logseq2DayJS = {
        'en': 'en',
        'fr': 'fr',
        'de': 'de',
        'nl': 'nl',
        'zh-CN': 'zh-cn',
        'zh-Hant': 'zh-tw',
        'af': 'af',
        'es': 'es',
        'nb-NO': 'nb',
        'pl': 'pl',
        'pt-BR': 'pt-br',
        'pt-PT': 'pt',
        'ru': 'ru',
        'ja': 'ja',
        'it': 'it',
        'tr': 'tr',
        'uk': 'uk',
        'ko': 'ko',
        'sk': 'sk',
        'fa': 'fa',
        'id': 'id',
    }
    const locale = locales_Logseq2DayJS[config.preferredLanguage] || 'en'
    dayjs.locale(locale)

    /*
    mon 0 1
    tue 1 2
    ...
    sat 5 6
    sun 6 0
    */
    const weekStart = config.preferredStartOfWeek !== undefined
        ? (Number(config.preferredStartOfWeek) + 1) % 7
        : 0
    dayjs.updateLocale(locale, {weekStart})
}

async function init() {
    if (DEV) {
        logseq.UI.showMsg(
            // @ts-expect-error
            `[:div [:b "Full House Templates"] [:p "HMR #${top!.hmr_count}"] ]`,
            'info',
            {timeout: 3000},
        )
    }

    console.info(p`Loaded`)
}

async function postInit() {
    notifyUser()
    await onAppSettingsChanged()  // for proper tests running

    logseq.on('ui:visible:changed', ({ visible }) => {
        if (visible)
            loadThemeVars([
                '--ls-primary-background-color',
                '--ls-secondary-background-color',
                '--ls-tertiary-background-color',
                '--ls-quaternary-background-color',

                '--ls-border-color',
                '--ls-border-radius-low',
                '--ls-page-inline-code-color',

                '--ls-page-text-size',
                '--ls-primary-text-color',
                '--ls-secondary-text-color',

                '--ls-font-family',
                '--ls-link-text-color',
                '--ls-page-mark-bg-color',
                '--ls-page-mark-color',

                '--ls-scrollbar-foreground-color',
                '--ls-scrollbar-thumb-hover-color',

                '--lx-accent-05',
                '--lx-accent-09',
                '--lx-accent-09-alpha',
                '--lx-accent-11',

                '--fht-footer-text',
                '--fht-hightlight',
                '--fht-label-text',
                '--fht-active',
                '--fht-active-text',
                '--fht-scrollbar',
                '--fht-scrollbar-thumb',
                '--fht-scrollbar-thumb-hover',
            ])
    })
}

function notifyUser() {
    if (!logseq.settings!.notifications)
        logseq.settings!.notifications = {}

    // delete old notifications keys
    logseq.updateSettings({notifications: {namedContextPageArg: undefined}})
    logseq.updateSettings({notifications: {newTemplateSyntax: undefined}})
    logseq.updateSettings({notifications: {introducedUI: undefined}})
    logseq.updateSettings({notifications: {introducedNLPSyntax: undefined}})
    logseq.updateSettings({notifications: {introducedSetCursorPosition: undefined}})

    const notifications: {[key: string]: any} = logseq.settings!.notifications as object

    // @ts-expect-error
    const currentPluginVersion = logseq.baseInfo.version
    const previousPluginVersion = notifications.previousPluginVersion

    // Notify only old users
    if (previousPluginVersion && currentPluginVersion !== previousPluginVersion) {
        if (!notifications.introducedQueryTableView) {
            logseq.UI.showMsg(
                `[:div
                    [:p [:code "🏛 Full House Templates"]]
                    [:p [:b "Query table view, Set cursor position and more!"] [:br]
                        "The new plugin versions have introduced lots of stuff. See details "
                        [:a {:href "https://stdword.github.io/logseq13-full-house-plugin/#/changelog?id=v41"}
                            "here"] " and " [:a {:href "https://stdword.github.io/logseq13-full-house-plugin/#/changelog?id=v40"}
                            "here"] "."]
                ]`,
                'info', {timeout: 60000})
            logseq.updateSettings({notifications: {introducedQueryTableView: true}})
        }
    }

    logseq.updateSettings({notifications: {previousPluginVersion: currentPluginVersion}})
}

async function main() {
    await init()

    logseq.onSettingsChanged(async (old, new_) => {
        await onAppSettingsChanged()
    })

    logseq.App.registerCommandPalette(
        { key: 'convert-template', label: 'Convert to new 🏛syntax' }, async (e) => {
            const selected = (await logseq.Editor.getSelectedBlocks()) ?? []
            const editing = await logseq.Editor.checkEditing()
            if (!editing && selected.length === 0) {
                logseq.UI.showMsg(
                    `[:p "Start editing template root block or select it"]`,
                    'warning',
                    {timeout: 5000},
                )
                return
            }

            const isSelectedState = selected.length !== 0
            const uuids = isSelectedState ? selected.map((b) => b.uuid) : [editing as string]

            const [ openTag, closeTag ] = [ '``{', '}``' ]
            const [ openTagRegexp, closeTagRegexp ] = [ escapeForRegExp(openTag), escapeForRegExp(closeTag) ]
            for (const uuid of uuids) {
                const block = (await logseq.Editor.getBlock(uuid, {includeChildren: true}))!

                await walkBlockTreeAsync(block as IBlockNode, async (b, lvl) => {
                    const content = b.content
                        .replaceAll(
                            new RegExp(openTagRegexp + '(?!(?:-|_)?\\s*!)\\s*(.*?)\\s*' + closeTagRegexp, 'gs'),
                            '``$1``',
                        )
                        .replaceAll(
                            new RegExp(openTagRegexp + '(-|_)?\\s*!' + '(.*?)' + '(-|_)?' + closeTagRegexp, 'gs'),
                            openTag + '$1$2$3' + closeTag,
                        )
                    await logseq.Editor.updateBlock((b as BlockEntity).uuid, content)
                })
            }
    })

    const commandTemplateName = 'template'
    {
        const commandLabel = 'Insert 🏛template or 🏛️view'

        function showInsertUI(uuids: string[], isSelectedState) {
            render(
                <InsertUI blockUUIDs={uuids} isSelectedState={isSelectedState} />,
                document.getElementById('app')!
            )
            logseq.showMainUI()
        }

        logseq.App.registerCommandPalette({
            key: 'insert-template-or-view',
            label: commandLabel,
            keybinding: {
                binding: shortcutToOpenInsertUI[0].key,
                mac: shortcutToOpenInsertUI[1].key,
                mode: 'global'
            }
        }, async (e) => {
            const [chosenBlocks, isSelectedState] = await getChosenBlocks()
            showInsertUI(chosenBlocks.map((b) => b.uuid), isSelectedState)
            if (chosenBlocks.length === 0)
                showInsertRestrictionMessage()
        })

        logseq.Editor.registerSlashCommand(commandLabel, async (e) => {
            // here user always in editing mode, so no need to check insertion
            showInsertUI([e.uuid], false)
        })

        registerBlockContextCopyCommand('Copy as 🏛template', false)
        registerPageContextCopyCommand('Copy as 🏛template', false)
        handleTemplateCommand(commandTemplateName)
    }

    const commandTemplateViewName = 'template-view'
    {
        registerBlockContextCopyCommand('Copy as 🏛view', true)
        registerPageContextCopyCommand('Copy as 🏛view', true)
        handleTemplateViewCommand(commandTemplateViewName)
    }

    const commandViewName = 'view'
    {
        const commandLabel = 'Insert inline 🏛view'
        const code = 'c.page.name'
        const commandGuide = RendererMacro
            .command(commandViewName)
            .arg(`"${code}"`, {raw: true})
            .toString()

        logseq.App.registerCommandPalette({
            key: 'insert-inline-view',
            label: commandLabel,
        }, async (e) => {
                const inserted = await insertContent(commandGuide, { positionAfterText: code })
                if (!inserted) {
                    logseq.UI.showMsg(
                        `[:p "Start editing block or select one to insert "
                             [:code ":view"]]`,
                        'warning',
                        {timeout: 5000},
                    )
                    return
                }
        })

        logseq.Editor.registerSlashCommand(commandLabel, async (e) => {
            // here user always in editing mode, so no need to check insertion
            await insertContent(commandGuide, { positionAfterText: code })
        })

        handleViewCommand(commandViewName)
    }

    await postInit()
}

function registerBlockContextCopyCommand(label: string, isView: boolean) {
    logseq.Editor.registerBlockContextMenuItem(
        label, async (e) => {
            const macro = await templateMacroStringForBlock(e.uuid, isView)
            if (!macro) {
                console.debug(p`Assertion error: block should exists`, e.uuid)
                return
            }

            window.focus()  // need to make an interactions with clipboard
            await navigator.clipboard.writeText(macro)

            await logseq.UI.showMsg('Copied to clipboard', 'success', {timeout: 5000})
    })
}
function registerPageContextCopyCommand(label: string, isView: boolean) {
    logseq.App.registerPageMenuItem(
        label, async ({ page: pageName }) => {
            const command = await templateMacroStringForPage(pageName, isView)
            if (!command) {
                console.debug(p`Assertion error: page should exists`, pageName)
                return
            }

            window.focus()  // need to make an interactions with clipboard
            await navigator.clipboard.writeText(command.toString())

            await logseq.UI.showMsg('Copied to clipboard', 'success', {timeout: 5000})
    })
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
            await logseq.UI.showMsg(error.message, 'error', {timeout: 15000})
        else if (error instanceof StateMessage)
            await logseq.UI.showMsg(error.message, 'info', {timeout: 15000})
        else if (error instanceof RenderError)
            await logseq.UI.showMsg(error.message, 'error', {timeout: 15000})
        else
            console.error(p`${(error as Error).stack}`)
    }
}

function handleTemplateCommand(commandName: string) {
    let unload = logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
        const uuid = payload.uuid
        let [ type_, templateRef_, ...args ] = payload.arguments

        const rawCommand = RendererMacro.command(type_ ?? '')
        if (rawCommand.name !== commandName)
            return

        const raw = rawCommand.arg(templateRef_).args(args)
        // console.debug(p`Parsing:`, {macro: raw.toString()})

        const templateRef = await handleRequiredRef(templateRef_, 'Template')
        if (!templateRef)
            return

        args = args.map(arg => cleanMacroArg(arg, {escape: false, unquote: true}))

        // console.debug(p`Rendering template`, {uuid, templateRef, args})
        await handleLogicErrors(async () => {
            await renderTemplateInBlock(slot, uuid, templateRef, raw, args)
        })
    })
    logseq.beforeunload(unload as unknown as () => Promise<void>)
}
function handleTemplateViewCommand(commandName: string) {
    logseq.provideModel({
        async editBlock(e: any) {
            const { uuid } = e.dataset
            await logseq.Editor.editBlock(uuid)
        },

        async clickRef(e: any) {
            let { ref } = e.dataset

            ref = (await resolvePageAliases(ref)) ?? ref

            const { activeKeystroke } = top!.document.body!.dataset
            if (activeKeystroke && activeKeystroke.indexOf('Shift') >= 0) {
                const page = await logseq.Editor.getPage(ref)
                if (page)
                    logseq.Editor.openInRightSidebar(page.uuid)
                return
            }

            const current = await logseq.Editor.getCurrentPage()
            if (current && current.name === ref)
                return

            logseq.App.pushState('page', { name: ref })
        },
        async clickBlockRef(e: any) {
            const { uuid } = e.dataset

            const { activeKeystroke } = top!.document.body!.dataset
            if (activeKeystroke && activeKeystroke.indexOf('Shift') >= 0) {
                logseq.Editor.openInRightSidebar(uuid)
                return
            }

            const current = await logseq.Editor.getCurrentPage()
            // current can be page or zoomed block:
            //   page has `name`, block doesn't
            if (current && !current.name && current.uuid === uuid)
                return

            logseq.App.pushState('page', { name: uuid })
        },

        async queryTableHeaderClick(e: any) {
            const { state, slot, index, order } = e.dataset
            query_table_clickHeader(slot, index, order, state === 'true')
        },
    })

    logseq.provideStyle(`
        .fh_template-view {
           display: block;
        }
    `)

    const unload = logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
        const uuid = payload.uuid
        let [ type_, templateRef_, ...args ] = payload.arguments

        const rawCommand = RendererMacro.command(type_ ?? '')
        if (rawCommand.name !== commandName)
            return

        const raw = rawCommand.arg(templateRef_).args(args)
        // console.debug(p`Parsing:`, {macro: raw.toString()})

        const templateRef = await handleRequiredRef(templateRef_, 'Template')
        if (!templateRef)
            return

        args = args.map(arg => cleanMacroArg(arg, {escape: false, unquote: true}))

        // console.debug(p`Rendering template view`, {slot, uuid, templateRef, args})
        await handleLogicErrors(async () => {
            await renderTemplateView(slot, uuid, templateRef, raw, args)
        })
    })
    logseq.beforeunload(unload as unknown as () => Promise<void>)
}
function handleViewCommand(commandName: string) {
    const unload = logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
        const uuid = payload.uuid
        let [ type_, viewBody_, ...args ] = payload.arguments

        const rawCommand = RendererMacro.command(type_ ?? '')
        if (rawCommand.name !== commandName)
            return

        const raw = rawCommand.arg(viewBody_).args(args)
        // console.debug(p`Parsing:`, {macro: raw.toString()})

        const viewBody = cleanMacroArg(viewBody_, { escape: false, unquote: true })
        if (!viewBody) {
            await logseq.UI.showMsg(`View body is required`, 'error', {timeout: 5000})
            return
        }

        args = args.map(arg => cleanMacroArg(arg, {escape: false, unquote: true}))

        // console.debug(p`Rendering view`, {slot, uuid, viewBody, args})
        await handleLogicErrors(async () => {
            await renderView(slot, uuid, viewBody, args)
        })
    })
    logseq.beforeunload(unload as unknown as () => Promise<void>)
}


export const App = (logseq: any) => {
    if (DEV) {
        // @ts-expect-error
        top!.hmr_count = (top!.hmr_count + 1) || 1
    }

    logseq.ready(main).catch(console.error)
}

export const _private = { postInit }
