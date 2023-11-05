import '@logseq/libs'

import { useEffect, useRef, useState } from 'preact/hooks'
import fuzzysort from 'fuzzysort'

import './insert.css'
import { RendererMacro } from '../utils'


type DataItem = {name: string, label: string}
type Data = DataItem[]


async function collectTemplatesList(): Promise<Data> {
    const query = `
        [:find ?name ?label
         :where
         [?b :block/properties ?p]
         [(get ?p :template) ?name]
         [(get ?p :template-list-as "") ?label]
        ]
    `.trim()
    const result = await logseq.DB.datascriptQuery(query)
    const data = result
        .map(([name, label]) => { return {name, label} })
        .map(({name, label}) => {
            [name, label] = [name.trim(), label.trim()]
            const lowerLabel = label.toLowerCase()
            if (lowerLabel === 'view')
                label = 'View'
            else if (lowerLabel === 'template')
                label = 'Template'
            return {name, label}
        })

    return data.sort((a, b) => {
        const x = a.name.toLowerCase()
        const y = b.name.toLowerCase()
        if (x < y)
            return -1
        return Number(x > y)
    })
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
                ({name, label}) => (name.includes(searchQuery) || label.includes(searchQuery))
            )
            .map(({name, label}) => {
                if (name.includes(searchQuery))
                    name = name.replace(searchQuery, (sub) => ('<mark>' + sub + '</mark>'))
                else if (label.includes(searchQuery))
                    label = label.replace(searchQuery, (sub) => ('<mark>' + sub + '</mark>'))
                return {
                    name: name.replaceAll(' ', ' '),
                    label: label.replaceAll(' ', ' '),
                }
            })

    // fuzzy search
    return fuzzysort
        .go(searchQuery.toLowerCase(), items, {keys: ['name', 'label']})
        .map((r) => {
            return {
                name: fuzzysort.highlight(r[0], '<mark>', '</mark>') || r.obj.name,
                label: fuzzysort.highlight(r[1], '<mark>', '</mark>') || r.obj.label,
            }
        })
        .map(({name, label}) => {
            return {
                name: name.replaceAll(' ', ' '),
                label: label.replaceAll(' ', ' '),
            }
        }) as Data
}

const typeToCommandMap = {
    'Template': 'template',
    'View': 'template-view',
}

function InsertUI({ blockUUID, isSelectedState }) {
    const [visible, setVisible] = useState(true)
    const [preparing, setPreparing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState([] as Data)
    const [highlightedIndex, setHighlightedIndex] = useState(null as number | null)
    const [highlightedWithMouse, setHighlightedWithMouse] = useState(false)
    const [optKeyPressed, setOptKeyPressed] = useState(false)
    const [cmdKeyPressed, setCmdKeyPressed] = useState(false)

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

    const highlightItem = (event: MouseEvent) => {
        const currentItem = (event.target! as HTMLDivElement).closest('.item')
        const itemsElement = document.getElementById('items')!
        for (const [index, node] of Object.entries(itemsElement.childNodes)) {
            if (node === currentItem) {
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

        await insertLogic(
            results[highlightedIndex],
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
                                    {results.length ? results.map(({name, label}) => (
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
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InsertUI
