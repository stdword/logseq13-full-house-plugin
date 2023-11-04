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
    needToReplaceContent: boolean,
    itemsType: 'view' | 'template',
) {
    const content = RendererMacro.command(typeToCommandMap[itemsType])
        .arg(item.name)
        .toString()

    if (needToReplaceContent) {
        await logseq.Editor.updateBlock(blockUUID, content)
    } else {
        await logseq.Editor.insertAtEditingCursor(content)
    }
}

const typeToCommandMap = {
    'template': 'template',
    'view': 'template-view',
}

function InsertUI({ blockUUID, needToReplaceContent, itemsType }) {
    const [visible, setVisible] = useState(true)
    const [preparing, setPreparing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState([] as Data)
    const [highlightedIndex, setHighlightedIndex] = useState(null as number | null)
    const [highlightedWithMouse, setHighlightedWithMouse] = useState(false)

    const data = useRef([] as Data)
    async function prepareData() {
        if (preparing)
            return
        setPreparing(true)
        data.current = await collectTemplatesList()
        setResults(data.current)
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

        setSearchQuery('')
        setVisible(false)
    }

    useEffect(() => {
        if (visible) {
            setTimeout(showUI, 100)
            setHighlightedIndex(0)
            prepareData().catch(console.error)
        }
    }, [visible])

    useEffect(() => {
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
        if (event.key === 'ArrowDown') {
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
        const input = event.target! as HTMLInputElement
        if (event.key === 'Escape') {
            if (input.value !== '') {
                setSearchQuery('')
                return
            }

            hideUI()
            return
        }
    }

    // filter results
    useEffect(() => {
        let items = data.current
            .filter((item) => !item.name.startsWith('.'))

        if (searchQuery) {
            if (searchQuery.replace(/\s/g, '').length === 0) {
                // use simple search for queries contains only spaces
                // due to fuzzysort restrictions
                items = items
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
            } else {
                // fuzzy search
                items = fuzzysort
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
        }

        setResults(items)
        updateHighlightForLength(items.length)
    }, [searchQuery])

    function updateHighlightForLength(length) {
        if (length == 0) {
            setHighlightedIndex(null)
            return
        }

        if (highlightedIndex === null)
            setHighlightedIndex(0)
        else
            if (highlightedIndex >= length)
                setHighlightedIndex(length - 1)
    }

    function scrollToHightlightedItem() {
        if (highlightedIndex === null)
            return

        const itemsElement = document.getElementById('items')! as HTMLElement
        const itemElement = itemsElement.childNodes[highlightedIndex] as HTMLElement
        itemElement.scrollIntoView({block: 'nearest'})
    }

    useEffect(() => {
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

        await insertLogic(results[highlightedIndex], blockUUID, needToReplaceContent, itemsType)
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
