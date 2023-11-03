import '@logseq/libs'

import { useEffect, useRef, useState } from 'preact/hooks'

import './insert.css'
import { RendererMacro } from '../utils/logseq'


async function collectTemplatesList() {
    const data = [
        ['test, template', ''], ['some template', ''], ['cool', ''], ['words', ''], ['And long template names', ''], ['with upper LETTERS', ''],
        ['test template', 'Template'], ['some, template', 'Template'], ['cool', 'Template'], ['words', 'Template'], ['And long template names', 'Template'], ['with upper, LETTERS', 'Template'],
        ['test template', 'View'], ['some template', 'View'], ['cool', 'View'], ['words', 'View'], ['And, long template names', 'View'], ['with upper LETTERS', 'View'],
    ]
    return data.sort((a, b) => {
        const x = a[0].toLowerCase()
        const y = b[0].toLowerCase()
        if (x < y)
            return -1
        return Number(x > y)
    })
    const query = `
        [:find (pull ?b [*])
         :where
         [?b :block/properties ?p]
         [(get ?p :template)]
        ]
    `.trim()
    const result = await logseq.DB.datascriptQuery(query)
    return result.map((item) => item[0].properties.template)
}

const typeToCommandMap = {
    'template': 'template',
    'view': 'template-view',
}

function InsertUI({ blockUUID, needToReplaceContent, itemsType }) {
    const [visible, setVisible] = useState(true)
    const [preparing, setPreparing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState([] as string[])
    const [highlightedIndex, setHighlightedIndex] = useState(null as number | null)

    async function prepareData() {
        if (preparing)
            return
        setPreparing(true)
        const data = await collectTemplatesList()
        setResults(data)
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
        let items = results
        if (searchQuery)
            items = results.filter(
                ([item, label]) => item.toLowerCase().includes(searchQuery.toLowerCase())
            )

        setResults(items)
        updateHighlightFor(items)
    }, [searchQuery])

    function updateHighlightFor(results) {
        if (results.length == 0) {
            setHighlightedIndex(null)
            return
        }

        if (highlightedIndex === null)
            setHighlightedIndex(0)
        else
            if (highlightedIndex >= results.length)
                setHighlightedIndex(results.length - 1)
    }

    useEffect(() => {
        const itemsElement = document.getElementById('items')!
        results.forEach((item, index) => {
            const div = itemsElement.childNodes[index] as HTMLDivElement
            if (highlightedIndex === null || index !== highlightedIndex)
                div.classList.remove('selected')
            else
                div.classList.add('selected')
        })
    }, [highlightedIndex])

    const highlightItem = (event: MouseEvent) => {
        const currentItem = (event.target! as HTMLDivElement).closest('.item')
        const itemsElement = document.getElementById('items')!
        for (const [index, node] of Object.entries(itemsElement.childNodes)) {
            if (node === currentItem) {
                setHighlightedIndex(Number(index))
                break
            }
        }
    }

    const insertHighlightedItem = async () => {
        if (highlightedIndex === null)
            return

        hideUI()

        const content = RendererMacro.command(typeToCommandMap[itemsType])
            .arg(results[highlightedIndex][0])
            .toString()

        if (needToReplaceContent) {
            await logseq.Editor.updateBlock(blockUUID, content)
        } else {
            await logseq.Editor.insertAtEditingCursor(content)
        }
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
                                    {results.length ? results.map(([item, label]) => (
                                        <div className="item"
                                             onClick={insertHighlightedItem}
                                             onMouseDown={highlightItem}
                                             onMouseEnter={highlightItem}
                                        >
                                            <span>
                                                <div className="cell">
                                                    <span className="cell-left">{item}</span>
                                                    <div className="cell-right">
                                                        <code className="label">{label}</code>
                                                    </div>
                                                </div>
                                            </span>
                                        </div>
                                    )): <div className="nothing">
                                            No results
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
