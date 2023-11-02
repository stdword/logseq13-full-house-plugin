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
        const width = panel!.dataset.origWidth || panel!.clientWidth
        const height = panel!.dataset.origHeight || panel!.clientHeight
        panel!.style.width = `${width}px`
        panel!.style.height = `${height}px`
        console.log('ASD', width, height)

        const input = document.getElementById('search-query-input')
        input!.focus()
    }

    function hideUI() {
        logseq.hideMainUI({ restoreEditingCursor: true })

        // handle show/hide animation
        const panel = document.getElementById('panel')
        panel!.style.opacity = '0'
        panel!.dataset.origWidth = panel!.style.width.replace('px', '')
        panel!.dataset.origHeight = panel!.style.height.replace('px', '')
        panel!.style.width = `${panel!.clientWidth - 20}px`
        panel!.style.height = `${panel!.clientHeight - 5}px`

        const overlay = document.getElementById('overlay')
        overlay!.style.opacity = '0'

        setSearchQueryState('')
        setVisible(false)
    }

    useEffect(() => {
        // called on UI show
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
        let results = ['test template', 'some template']
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
                        <div class="command-results-wrap">
                            <div id="ui__ac" class="cp__palette-results">
                                <div id="ui__ac-inner" class="hide-scrollbar">
                                    {resultsState.map((item) => (
                                        <div class="menu-link-wrap" /* onClick={insertBlocks} */>
                                            <a id="ac-0"
                                                class="flex justify-between px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link">
                                                <span class="flex-1">
                                                    <div class="inline-grid grid-cols-4 items-center w-full">
                                                        <span class="col-span-3">{item}</span>
                                                        <div class="col-span-1 flex justify-end tip">
                                                            <code class="opacity-40 bg-transparent">Template</code>
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
