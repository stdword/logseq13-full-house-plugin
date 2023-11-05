import '@logseq/libs'

import { useEffect, useRef, useState } from 'preact/hooks'
import fuzzysort from 'fuzzysort'

import './insert.css'
import { RendererMacro } from '../utils'


type DataItem = {uuid: string, name: string, label: string, page: string}
type Data = DataItem[]


async function collectTemplatesList(): Promise<Data> {
    const query = `
        [:find ?uuid ?name ?label ?page
         :where
         [?b :block/properties ?ps]
         [?b :block/page ?p]
         [?p :block/original-name ?page]
         [?b :block/uuid ?uuid]
         [(get ?ps :template) ?name]
         [(get ?ps :template-list-as "") ?label]
        ]
    `.trim()
    const result = await logseq.DB.datascriptQuery(query)
    const data = result
        .map(([uuid, name, label, page]) => { return {uuid, name, label, page} })
        .map(({uuid, name, label, page}) => {
            [name, label] = [name.trim(), label.trim()]
            const lowerLabel = label.toLowerCase()
            if (lowerLabel === 'view')
                label = 'View'
            else if (lowerLabel === 'template')
                label = 'Template'
            return {uuid, name, label, page}
        })

    return data.sort((a, b) => {
        const x = a.name.toLowerCase()
        const y = b.name.toLowerCase()
        if (x < y)
            return -1
        return Number(x > y)
    })
}

async function openLogic(item: DataItem) {
    logseq.App.pushState('page', {name: item.uuid})
}

async function insertLogic(
    item: DataItem,
    blockUUID: string,
    isSelectedState: boolean,
    itemsType: 'View' | 'Template',
) {
    // force itemType
    if (['View', 'Template'].includes(item.label))
        itemsType = item.label as 'View' | 'Template'

    const content = RendererMacro.command(typeToCommandMap[itemsType])
        .arg(item.name)
        .toString()

    if (isSelectedState) {
        await logseq.Editor.updateBlock(blockUUID, content)
    } else {
        await logseq.Editor.insertAtEditingCursor(content)
    }
}

function searchLogic(items: Data, searchQuery: string) {
    // use simple search for queries contains only spaces
    // due to fuzzysort restrictions
    if (searchQuery.replace(/\s/g, '').length === 0)
        return items
            .filter(
                ({uuid, name, label, page}) => (name.includes(searchQuery) || label.includes(searchQuery))
            )
            .map(({uuid, name, label, page}) => {
                if (name.includes(searchQuery))
                    name = name.replace(searchQuery, (sub) => ('<mark>' + sub + '</mark>'))
                else if (label.includes(searchQuery))
                    label = label.replace(searchQuery, (sub) => ('<mark>' + sub + '</mark>'))
                return {  // replacing spaces to nb-spaces to keep them during html rendering
                    uuid,
                    name: name.replaceAll(' ', ' '),
                    label: label.replaceAll(' ', ' '),
                    page,
                }
            })

    // fuzzy search
    return fuzzysort
        .go(searchQuery.toLowerCase(), items, {keys: ['name', 'label']})
        .map((r) => {
            return {
                uuid: r.obj.uuid,
                name: fuzzysort.highlight(r[0], '<mark>', '</mark>') || r.obj.name,
                label: fuzzysort.highlight(r[1], '<mark>', '</mark>') || r.obj.label,
                page: r.obj.page,
            }
        })
        .map(({uuid, name, label, page}) => {
            return {  // replacing spaces to nb-spaces to keep them during html rendering
                uuid,
                name: name.replaceAll(' ', ' '),
                label: label.replaceAll(' ', ' '),
                page,
            }
        }) as Data
}

const typeToCommandMap = {
    'Template': 'template',
    'View': 'template-view',
}

const isMacOS = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0

function InsertUI({ blockUUID, isSelectedState }) {
    const [visible, setVisible] = useState(true)
    const [preparing, setPreparing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState([] as Data)
    const [highlightedIndex, setHighlightedIndex] = useState(null as number | null)
    const [highlightedWithMouse, setHighlightedWithMouse] = useState(false)
    const [optKeyPressed, setOptKeyPressed] = useState(false)
    const [cmdKeyPressed, setCmdKeyPressed] = useState(false)
    const [shiftKeyPressed, setShiftKeyPressed] = useState(false)

    const data = useRef([] as Data)
    async function prepareData() {
        if (preparing)
            return
        setPreparing(true)
        data.current = await collectTemplatesList()
        setPreparing(false)
    }

    function showUI() {
        // handle show/hide animation
        const overlay = document.getElementById('overlay')
        overlay!.style.opacity = '.75'

        const panel = document.getElementById('panel')
        panel!.style.opacity = '1'

        const input = document.getElementById('search-query-input')
        input!.focus()
    }

    function hideUI() {
        logseq.hideMainUI({ restoreEditingCursor: true })

        // handle show/hide animation
        const panel = document.getElementById('panel')
        panel!.style.opacity = '0'

        const overlay = document.getElementById('overlay')
        overlay!.style.opacity = '0'

        setVisible(false)

        // in case of loosing input focus with pressed Opt/Meta keys: KeyUp event didn't fire
        setOptKeyPressed(false)
        setCmdKeyPressed(false)
        setShiftKeyPressed(false)
    }

    useEffect(() => {
        console.debug('effect:VISIBLE', visible)

        if (visible) {
            setTimeout(showUI, 100)
            prepareData().catch(console.error)
            setSearchQuery('')
        }
    }, [visible])

    useEffect(() => {
        console.debug('effect:INIT')

        logseq.on('ui:visible:changed', ({ visible }) => {
            if (visible)
                setVisible(true)
        })

        logseq.App.onCurrentGraphChanged(() => {
            setResults([])
            hideUI()
        })
    }, [])

    const saveInputValue = (event) => {
        const input = event.target! as HTMLInputElement
        setSearchQuery(input.value)
    }

    const returnFocus = (event: FocusEvent) => {
        const input = event.target! as HTMLInputElement
        input.focus()
    }

    const actWithHighlightedItem = (event: KeyboardEvent) => {
        if (event.key === 'Alt') {
            setOptKeyPressed(true)
        }
        else if (event.key === 'Shift') {
            setShiftKeyPressed(true)
        }
        else if ((isMacOS && event.key === 'Meta') || (!isMacOS && event.key === 'Control')) {
            setCmdKeyPressed(true)
        }
        else if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (highlightedIndex === null) {
                setHighlightedIndex(0)
                return
            }
            const maxIndex = results.length - 1
            if (highlightedIndex === maxIndex)
                return
            setHighlightedWithMouse(false)
            setHighlightedIndex(highlightedIndex + 1)
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (highlightedIndex === null) {
                if (results.length > 0)
                    setHighlightedIndex(results.length - 1)
                return
            }
            const minIndex = 0
            if (highlightedIndex === minIndex)
                return
            setHighlightedWithMouse(false)
            setHighlightedIndex(highlightedIndex - 1)
        }
        else if (event.key === 'Enter') {
            event.preventDefault()
            insertHighlightedItem()
        }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Alt') {
            setOptKeyPressed(false)
        }
        else if (event.key === 'Shift') {
            setShiftKeyPressed(false)
        }
        else if ((isMacOS && event.key === 'Meta') || (!isMacOS && event.key === 'Control')) {
            setCmdKeyPressed(false)
        }
        else if (event.key === 'Escape') {
            const input = event.target! as HTMLInputElement
            if (input.value !== '') {
                setSearchQuery('')
                return
            }

            hideUI()
        }
    }

    // filter results
    useEffect(() => {
        if (preparing)
            return

        console.debug('effect:FILTER', `"${searchQuery}"`)

        let items = data.current

        if (!optKeyPressed)
            items = items.filter((item) => !item.name.startsWith('.'))

        if (searchQuery)
            items = searchLogic(items, searchQuery)

        setResults(items)
    }, [searchQuery, optKeyPressed, preparing])

    useEffect(() => {
        const length = results.length
        console.debug('effect:RESULTS', length)

        if (length == 0) {
            setHighlightedIndex(null)
            return
        }

        if (highlightedIndex === null)
            setHighlightedIndex(0)
        else
            if (highlightedIndex >= length)
                setHighlightedIndex(length - 1)
    }, [results])

    function scrollToHightlightedItem() {
        if (highlightedIndex === null)
            return

        const itemsElement = document.getElementById('items')! as HTMLElement
        const itemElement = itemsElement.childNodes[highlightedIndex] as HTMLElement
        itemElement.scrollIntoView({block: 'nearest'})
    }

    useEffect(() => {
        // console.debug('effect:HIGHLIGHT', highlightedIndex)

        const itemsElement = document.getElementById('items')! as HTMLElement
        results.forEach((item, index) => {
            const div = itemsElement.childNodes[index] as HTMLDivElement
            if (highlightedIndex === null || index !== highlightedIndex)
                div.classList.remove('selected')
            else
                div.classList.add('selected')
        })
        if (!highlightedWithMouse)
            scrollToHightlightedItem()
    }, [highlightedIndex])

    useEffect(() => {
        const itemsElement = document.getElementById('items')! as HTMLElement
        itemsElement.childNodes.forEach((node) => {
            const item = node as HTMLElement
            if (!shiftKeyPressed)
                item.classList.remove('will-open')
            else if (item.classList.contains('selected'))
                item.classList.add('will-open')
        })
    }, [shiftKeyPressed])

    const highlightItem = (event: MouseEvent) => {
        const currentItem = (event.target! as HTMLDivElement).closest('.item')
        const itemsElement = document.getElementById('items')!
        for (const [index, node] of Object.entries(itemsElement.childNodes)) {
            if (node === currentItem) {
                if (shiftKeyPressed)
                    (node as HTMLDivElement).classList.add('will-open')
                setHighlightedWithMouse(true)
                setHighlightedIndex(Number(index))
                break
            }
        }
    }

    const insertHighlightedItem = async () => {
        if (highlightedIndex === null)
            return

        hideUI()

        const chosenItem = results[highlightedIndex]

        if (shiftKeyPressed) {
            openLogic(chosenItem)
            return
        }

        await insertLogic(
            chosenItem,
            blockUUID,
            isSelectedState,
            cmdKeyPressed ? 'View' : 'Template',
        )
    }

    return (
        <div id="modal">
            <div id="overlay"
                 onClick={hideUI}
            />
            <div id="panel">
                <div id="panel-content">
                    <div id="content">
                        <div id="input-wrap">
                            <input
                                id="search-query-input"
                                type="text"
                                placeholder=" 🏛️ Search for a template or view..."
                                value={searchQuery}
                                onKeyDown={actWithHighlightedItem}
                                onKeyUp={handleEscapeKey}
                                onInput={saveInputValue}
                                onfocusout={returnFocus}
                            />
                        </div>
                        <div id="results-wrap">
                            <div id="results">
                                <div id="items">
                                    {results.length ? results.map(({name, label, page}) => (
                                        <div className="item"
                                             onClick={insertHighlightedItem}
                                             onMouseDown={highlightItem}
                                             onMouseEnter={highlightItem}
                                        >
                                            <span>
                                                <div className="cell">
                                                    <span className="cell-left"
                                                          dangerouslySetInnerHTML={{ __html: (name ? name : '<i>EMPTY NAME</i>') }}></span>
                                                    <div className="cell-right">
                                                        { label
                                                            ? <code className="label"
                                                                    dangerouslySetInnerHTML={{ __html: label }}></code>
                                                            : ''
                                                        }
                                                    </div>
                                                    <span className="cell-under">{page}</span>
                                                </div>
                                            </span>
                                        </div>
                                    )): <div className="nothing">
                                            {preparing ? 'Loading...' : 'No results'}
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                        <footer>
                            <ul>
                                <li>
                                    <svg role="img" viewBox="0 0 16 16" class="arrowsUpDown">
                                        <path d="M4.11 2.385a.61.61 0 01.48-.211c.191 0 .353.07.486.21L8.03 5.409a.66.66 0 01.2.475c0 .191-.061.347-.182.469a.627.627 0 01-.463.181.59.59 0 01-.451-.187L5.926 5.098l-.72-.844.04 1.219v7.242a.624.624 0 01-.187.469.624.624 0 01-.47.187.636.636 0 01-.468-.187.635.635 0 01-.182-.47V5.474l.041-1.22-.726.845-1.201 1.248a.61.61 0 01-.457.187.627.627 0 01-.463-.181.634.634 0 01-.182-.47.66.66 0 01.2-.474l2.958-3.023zm7.786 10.781a.636.636 0 01-.486.205.665.665 0 01-.486-.205l-2.947-3.035a.64.64 0 01-.206-.475c0-.191.061-.345.182-.463a.634.634 0 01.469-.181c.18 0 .33.06.451.181l1.201 1.248.727.85-.041-1.219V2.824c0-.187.06-.342.181-.463a.636.636 0 01.47-.187.627.627 0 01.65.65v7.248l-.041 1.219.726-.85 1.207-1.248a.6.6 0 01.451-.181c.188 0 .342.06.463.181a.615.615 0 01.182.463.648.648 0 01-.2.475l-2.953 3.035z"></path>
                                    </svg>Select</li>
                                <li>
                                    <span>{ isMacOS ? '⌥' : 'alt' } </span>Show hidden</li>
                                <li>
                                    <svg role="img" viewBox="0 0 16 16" class="enter">
                                        <path d="M5.38965 14.1667C5.81812 14.1667 6.10156 13.8767 6.10156 13.468C6.10156 13.2571 6.01587 13.0989 5.89062 12.967L4.18994 11.3125L3.02979 10.3369L4.55908 10.4028H12.7922C14.4402 10.4028 15.1389 9.65796 15.1389 8.04297V4.13403C15.1389 2.48608 14.4402 1.78735 12.7922 1.78735H9.13379C8.70532 1.78735 8.4021 2.11035 8.4021 2.50586C8.4021 2.90137 8.69873 3.22437 9.13379 3.22437H12.7593C13.4316 3.22437 13.7151 3.50781 13.7151 4.17358V7.99683C13.7151 8.67578 13.425 8.95923 12.7593 8.95923H4.55908L3.02979 9.03174L4.18994 8.04956L5.89062 6.39502C6.01587 6.26978 6.10156 6.11157 6.10156 5.89404C6.10156 5.48535 5.81812 5.19531 5.38965 5.19531C5.21167 5.19531 5.01392 5.27441 4.8689 5.41943L1.08521 9.1438C0.933594 9.28882 0.854492 9.48657 0.854492 9.68433C0.854492 9.87549 0.933594 10.0732 1.08521 10.2183L4.8689 13.9492C5.01392 14.0876 5.21167 14.1667 5.38965 14.1667Z"></path>
                                    </svg>Insert as Template</li>
                                <li>
                                    <span>{ isMacOS ? '⌘' : 'ctrl' }</span>
                                    <svg role="img" viewBox="0 0 16 16" class="enter">
                                        <path d="M5.38965 14.1667C5.81812 14.1667 6.10156 13.8767 6.10156 13.468C6.10156 13.2571 6.01587 13.0989 5.89062 12.967L4.18994 11.3125L3.02979 10.3369L4.55908 10.4028H12.7922C14.4402 10.4028 15.1389 9.65796 15.1389 8.04297V4.13403C15.1389 2.48608 14.4402 1.78735 12.7922 1.78735H9.13379C8.70532 1.78735 8.4021 2.11035 8.4021 2.50586C8.4021 2.90137 8.69873 3.22437 9.13379 3.22437H12.7593C13.4316 3.22437 13.7151 3.50781 13.7151 4.17358V7.99683C13.7151 8.67578 13.425 8.95923 12.7593 8.95923H4.55908L3.02979 9.03174L4.18994 8.04956L5.89062 6.39502C6.01587 6.26978 6.10156 6.11157 6.10156 5.89404C6.10156 5.48535 5.81812 5.19531 5.38965 5.19531C5.21167 5.19531 5.01392 5.27441 4.8689 5.41943L1.08521 9.1438C0.933594 9.28882 0.854492 9.48657 0.854492 9.68433C0.854492 9.87549 0.933594 10.0732 1.08521 10.2183L4.8689 13.9492C5.01392 14.0876 5.21167 14.1667 5.38965 14.1667Z"></path>
                                    </svg>Insert as View</li>
                                <li>
                                    <span>{ isMacOS ? '⇧' : 'shift' }</span>
                                    <svg role="img" viewBox="0 0 16 16" class="enter">
                                        <path d="M5.38965 14.1667C5.81812 14.1667 6.10156 13.8767 6.10156 13.468C6.10156 13.2571 6.01587 13.0989 5.89062 12.967L4.18994 11.3125L3.02979 10.3369L4.55908 10.4028H12.7922C14.4402 10.4028 15.1389 9.65796 15.1389 8.04297V4.13403C15.1389 2.48608 14.4402 1.78735 12.7922 1.78735H9.13379C8.70532 1.78735 8.4021 2.11035 8.4021 2.50586C8.4021 2.90137 8.69873 3.22437 9.13379 3.22437H12.7593C13.4316 3.22437 13.7151 3.50781 13.7151 4.17358V7.99683C13.7151 8.67578 13.425 8.95923 12.7593 8.95923H4.55908L3.02979 9.03174L4.18994 8.04956L5.89062 6.39502C6.01587 6.26978 6.10156 6.11157 6.10156 5.89404C6.10156 5.48535 5.81812 5.19531 5.38965 5.19531C5.21167 5.19531 5.01392 5.27441 4.8689 5.41943L1.08521 9.1438C0.933594 9.28882 0.854492 9.48657 0.854492 9.68433C0.854492 9.87549 0.933594 10.0732 1.08521 10.2183L4.8689 13.9492C5.01392 14.0876 5.21167 14.1667 5.38965 14.1667Z"></path>
                                    </svg>Go to block</li>
                            </ul>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InsertUI
