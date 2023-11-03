import '@logseq/libs'

import { useEffect, useRef, useState } from 'preact/hooks'

import './insert.css'


async function collectTemplatesList() {
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


function InsertUI({ blockUUID }) {
    const [visible, setVisible] = useState(true)
    const [searchQueryState, setSearchQueryState] = useState('')
    const [resultsState, setResultsState] = useState([] as string[])
    const [highlightedIndexState, setHighlightedIndexState] = useState(null as number | null)
    // const firstUpdate = useRef(true)

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

        setSearchQueryState('')
        setVisible(false)
    }

    useEffect(() => {
        if (visible)
            setTimeout(showUI, 100)
    }, [visible])

    useEffect(() => {
        logseq.on('ui:visible:changed', ({ visible }) => {
          if (visible)
            setVisible(true)
        })
    }, [])

    const saveInputValue = (event) => {
        const input = event.target! as HTMLInputElement
        setSearchQueryState(input.value)
    }

    const returnFocus = (event: FocusEvent) => {
        const input = event.target! as HTMLInputElement
        input.focus()
    }

    const actWithHighlightedItem = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (highlightedIndexState === null) {
                setHighlightedIndexState(0)
                return
            }
            const maxIndex = resultsState.length - 1
            if (highlightedIndexState === maxIndex)
                return
            setHighlightedIndexState(highlightedIndexState + 1)
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (highlightedIndexState === null) {
                if (resultsState.length > 0)
                    setHighlightedIndexState(resultsState.length - 1)
                return
            }
            const minIndex = 0
            if (highlightedIndexState === minIndex)
                return
            setHighlightedIndexState(highlightedIndexState - 1)
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
                setSearchQueryState('')
                return
            }

            hideUI()
            return
        }
    }

    // filter results
    useEffect(() => {
        console.log('on:FILTER', searchQueryState)
        let results = [
            'test template', 'some template', 'cool', 'words', 'And long template names', 'with upper LETTERS',
            'test template', 'some template', 'cool', 'words', 'And long template names', 'with upper LETTERS',
            'test template', 'some template', 'cool', 'words', 'And long template names', 'with upper LETTERS',
        ]
        if (searchQueryState)
            results = results.filter(
                (result) => result.toLowerCase().includes(searchQueryState.toLowerCase())
            )

        setResultsState(results)
        updateHighlightFor(results)
    }, [searchQueryState])

    function updateHighlightFor(results) {
        if (results.length == 0) {
            setHighlightedIndexState(null)
            return
        }

        if (highlightedIndexState === null)
            setHighlightedIndexState(0)
        else
            if (highlightedIndexState >= results.length)
                setHighlightedIndexState(results.length - 1)
    }

    useEffect(() => {
        const itemsElement = document.getElementById('items')!
        resultsState.forEach((item, index) => {
            const div = itemsElement.childNodes[index] as HTMLDivElement
            if (highlightedIndexState === null || index !== highlightedIndexState)
                div.classList.remove('selected')
            else
                div.classList.add('selected')
        })
    }, [highlightedIndexState])

    const highlightItem = (event: MouseEvent) => {
        const currentItem = (event.target! as HTMLDivElement).closest('.item')
        const itemsElement = document.getElementById('items')!
        for (const [index, node] of Object.entries(itemsElement.childNodes)) {
            if (node === currentItem) {
                setHighlightedIndexState(Number(index))
                break
            }
        }
    }

    const insertHighlightedItem = () => {
        if (highlightedIndexState !== null)
            console.log('INSERT', resultsState[highlightedIndexState])
    }

    return (
        <div id="modal">
            <div id="overlay" />
            <div id="panel">
                <div id="panel-content">
                    <div id="content">
                        <div id="input-wrap">
                            <input
                                id="search-query-input"
                                type="text"
                                placeholder=" 🏛️ Search for a template or view..."
                                value={searchQueryState}
                                onKeyDown={actWithHighlightedItem}
                                onKeyUp={handleEscapeKey}
                                onInput={saveInputValue}
                                onfocusout={returnFocus}
                            />
                        </div>
                        <div id="results-wrap">
                            <div id="results">
                                <div id="items">
                                    {resultsState.map((item) => (
                                        <div className="item"
                                             onClick={insertHighlightedItem}
                                             onMouseDown={highlightItem}
                                             onMouseEnter={highlightItem}
                                        >
                                            <span>
                                                <div className="cell">
                                                    <span className="cell-left">{item}</span>
                                                    <div className="cell-right">
                                                        <code className="label">Template</code>
                                                    </div>
                                                </div>
                                            </span>
                                        </div>
                                    ))}
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
