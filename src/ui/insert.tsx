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
    const [highlightedResultState, setHighlightedResultState] = useState(null)

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
        console.log('on:SHOW', visible)

        if (visible)
            setTimeout(showUI, 100)
    }, [visible])

    useEffect(() => {
        console.log('on:INIT')

        logseq.on('ui:visible:changed', ({ visible }) => {
          if (visible)
            setVisible(true)
        })
    }, [])

    useEffect(() => {
        console.log('on:KEYUP')

        const handleKeyup = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (searchQueryState !== '') {
                    setSearchQueryState('')
                    return
                }

                hideUI()
                return
            }
        }

        document.addEventListener('keyup', handleKeyup, false)

        return () => {
            document.removeEventListener('keyup', handleKeyup)
        }
    }, [searchQueryState])

    useEffect(() => {
        console.log('on:FILTER', searchQueryState)
        let results = ['test template', 'some template', 'cool', 'words', 'And long template names', 'with upper LETTERS']
        if (searchQueryState)
            results = results.filter(
                (result) => result.toLowerCase().includes(searchQueryState.toLowerCase())
            )

        setResultsState(results)
    }, [searchQueryState])


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
                                onInput={(event) => {
                                    const input = event.target! as HTMLInputElement
                                    setSearchQueryState(input.value)
                                }}
                                onfocusout={(event) => {
                                    const input = event.target! as HTMLInputElement
                                    input.focus()
                                }}
                            />
                        </div>
                        <div id="results-wrap">
                            <div id="results">
                                <div id="items">
                                    {resultsState.map((item) => (
                                        <div className="item" /* onClick={insertBlocks} */>
                                            <a>
                                                <span>
                                                    <div className="cell">
                                                        <span className="cell-left">{item}</span>
                                                        <div className="cell-right">
                                                            <code className="label">Template</code>
                                                        </div>
                                                    </div>
                                                </span>
                                            </a>
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
