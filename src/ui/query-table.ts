import { ILogseqContext as C, PageContext }  from '../context'
import { array_sorted, dev_get, dev_toHTML, ref } from "../tags"
import { escapeForHTML, html } from "../utils"


export const iconSortAsc = '<svg aria-hidden="true" version="1.1" viewBox="0 0 320 512" fill="currentColor" display="inline-block" class="h-4 w-4"><path d="M288.662 352H31.338c-17.818 0-26.741-21.543-14.142-34.142l128.662-128.662c7.81-7.81 20.474-7.81 28.284 0l128.662 128.662c12.6 12.599 3.676 34.142-14.142 34.142z"></path></svg>'
export const iconSortDesc = '<svg aria-hidden="true" version="1.1" viewBox="0 0 192 512" fill="currentColor" display="inline-block" class="h-4 w-4"><path d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z" fill-rule="evenodd"></path></svg>'


export function query_table_clickHeader(slot, index, order, saveState) {
    const block = top!.document.querySelector(`#${slot}`)!.closest('[blockid]')
    if (!block)
        return

    // @ts-expect-error
    const uuid = block.attributes.blockid.value!
    const container = top!.document.querySelector(
        `#${slot} .custom-query-results`) as HTMLElement

    const fields = JSON.parse(container.dataset.fields!)

    if (!order)
        order = 'asc'
    else if (order === 'asc')
        order = 'desc'
    else if (order === 'desc')
        order = ''

    if (saveState) {
        if (order) {
            // @ts-expect-error
            top!.logseq.api.upsert_block_property(uuid, 'query-sort-by', fields[index])
            // @ts-expect-error
            top!.logseq.api.upsert_block_property(uuid, 'query-sort-desc', order === 'desc')
        } else {
            // @ts-expect-error
            top!.logseq.api.remove_block_property(uuid, 'query-sort-by')
            // @ts-expect-error
            top!.logseq.api.remove_block_property(uuid, 'query-sort-desc')
        }

        return
    }


    const headerClass = '.fht-qt-header'
    const iconClass = '.fht-qt-icon'


    // remove sort marker from every header
    for (const header of top!.document.querySelectorAll(`#${slot} a${headerClass}`)) {
        (header as HTMLElement).dataset.order = ''

        const icon = header.querySelector(iconClass)!
        icon.innerHTML = ''
    }


    // update sort marker for current header
    const currentHeader = top!.document.querySelector(`#${slot} a${headerClass}[data-index="${index}"]`) as HTMLElement
    currentHeader.dataset.order = order

    const currentIcon = currentHeader.querySelector(iconClass)!
    if (order)
        currentIcon.innerHTML = order === 'asc' ? iconSortDesc : iconSortAsc
    else
        currentIcon.innerHTML = ''


    // update new items order
    let items = JSON.parse(sessionStorage.getItem(`fht-query-items-${slot}`)!)
    items.sorted = array_sorted
    items = items.map((x, i) => [...x, i])

    if (order === 'asc')
        items = items.sorted((x) => x[index])
    else if (order === 'desc')
        items = items.sorted((x) => x[index]).reverse()

    const table = top!.document.querySelector(`#${slot} .custom-query-results tbody`) as HTMLElement
    const htmlItems: HTMLElement[] = Array(table.children.length).fill(undefined)
    for (const node of table.children) {
        const element = node as HTMLElement
        htmlItems[Number(element.dataset.index)] = element
    }

    const sortedHTMLItems: HTMLElement[] = []
    for (const item of items)
        sortedHTMLItems.push(htmlItems[item.at(-1)])

    table.replaceChildren(...sortedHTMLItems)
}

export function query_table_no_save_state(c: C, rows: any[], fields?: string[],
    opts?: { orderBy?: string, orderDesc?: boolean },
) {
    const options: any = {}
    Object.assign(options, opts)
    options.fields = fields

    return query_table(c, rows, false, options)
}
export function query_table_save_state(c: C, rows: any[], fields?: string[]) {
    return query_table(c, rows, true, {fields})
}
function query_table(
    context: C,
    rows: any[],
    saveState: boolean,
    opts?: {
        fields?: string[],
        orderBy?: string,
        orderDesc?: boolean,
    },
) {
    let fields = opts?.fields
    if (!rows || rows.length === 0 || (fields && fields.length === 0))
        return html`
            <div class="custom-query">
                <div class="text-sm mt-2 opacity-90">No matched result</div>
            </div>
        `

    if (!Array.isArray(rows)) {
        if (typeof rows !== 'string' && rows[Symbol.iterator]) {
            const result: any[] = []
            for (const row of rows as Iterable<any>)
                result.push(row)
            rows = result
        }
        else
            rows = [rows]
    }

    const first = rows[0]

    // auto fill fields names
    if (!fields) {
        if (Array.isArray(first))
            fields = Array(first.length).fill('column ').map((x, i) => x + (i + 1))
        else if (first instanceof PageContext) {
            const propNames = Object.keys(first.props!)
            fields = ['page', ...propNames]
        }
        else if (typeof first === 'object' && typeof first['original-name'] === 'string') {
            // assume this is PageEntity
            const propNames = Object.keys(first['properties-text-values']!)
            fields = ['page', ...propNames]
        }
        else
            fields = ['column']
    }
    fields = fields.filter(f => !!f)

    let orderBy: string | undefined
    if (saveState) {
        // @ts-expect-error
        orderBy = top!.logseq.api.get_block_property(context.currentBlock.uuid, 'query-sort-by')
    }
    if (!orderBy)
        orderBy = opts?.orderBy

    let orderDesc: boolean | undefined
    if (saveState) {
        // @ts-expect-error
        orderDesc = top!.logseq.api.get_block_property(context.currentBlock.uuid, 'query-sort-desc')
    }
    if (!orderDesc)
        orderDesc = opts?.orderDesc

    const orderIndex = orderBy ? fields!.indexOf(orderBy) : -1
    const meta = {
        fields: fields!,
        order: {
            by: orderBy ?? null,
            index: orderIndex !== -1 ? orderIndex : null,
            desc: orderDesc ?? null,
        }
    }

    const orderByNonField = meta.order.by && meta.order.index === null

    // auto transform page objects
    if (!Array.isArray(first)) {
        let extendedFields = meta.fields
        if (orderByNonField)
            extendedFields = extendedFields.concat(meta.order.by!)

        if (typeof first !== 'object')
            rows = rows.map(o => [o])
        else {
            if (first instanceof PageContext) {
                const propNames = Object.keys(first.props!)
                rows = rows.map(
                    p => extendedFields.map(
                        f => {
                            if (f === 'page')
                                return ref(p.name)
                            if (propNames.includes(f)) {
                                // @ts-expect-error
                                if ((context.config._settings['property/separated-by-commas'] ?? []).includes(f))
                                    return p.propsRefs[f].map(r => ref(r)).join(', ')
                                return p.props[f]
                            }
                            return dev_get(context, f, p)
                        }
                    )
                )
            }
            else if (typeof first['original-name'] === 'string') {
                // assume this is PageEntity
                const propNames = Object.keys(first['properties-text-values'] ?? {})
                rows = rows.map(
                    p => extendedFields.map(
                        f => {
                            if (f === 'page')
                                return ref(p['original-name'])
                            if (propNames.includes(f)) {
                                // @ts-expect-error
                                if ((context.config._settings['property/separated-by-commas'] ?? []).includes(f))
                                    return p['properties'][f].map(r => ref(r)).join(', ')
                                return p['properties-text-values'][f]
                            }
                            return dev_get(context, f, p)
                        }
                    )
                )
            }
            else
                rows = rows.map(
                    row => extendedFields.map(
                        field => dev_get(context, field, row)
                    )
                )

            if (orderByNonField) {
                console.log('TRACING', rows)
                // @ts-expect-error
                rows.sorted = array_sorted
                // @ts-expect-error
                rows = rows.sorted(row => row.at(-1))
                rows = rows.map(row => row.slice(0, -1))
            }
        }

        if (orderByNonField)
            meta.order.by = null
    }

    // @ts-expect-error
    const slot = context.identity.slot

    function getCSS() {
        return html`
            #${slot}                                       { width: 100% }
            #${slot} > div:first-child                     { width: 100% }
            #${slot} > div:first-child > .fh_template-view { width: 100% }
            #${slot} .fht-qt-header { display: contents }
        `
    }
    function getHeader() {
        const htmlRow = meta.fields.map((name, index) => {
            return html`
                <th class="whitespace-nowrap">
                    <a class="fht-qt-header"
                       data-on-click="queryTableHeaderClick"
                       data-state="${saveState}"
                       data-slot="${slot}"
                       data-index="${index}"
                       data-order="${
                            meta.order.by === name
                                ? (meta.order.desc ? 'desc' : 'asc')
                                : ''
                            }"
                       >
                        <div class="flex items-center">
                            <span class="mr-1">${name}</span>
                            <span class="fht-qt-icon" style="font-family: 'tabler-icons'">${
                                meta.order.by === name
                                    ? (meta.order.desc ? iconSortDesc : iconSortAsc)
                                    : ''
                                }</span>
                        </div>
                    </a>
                </th>
            `
        }).join('\n')

        return `<tr>${htmlRow}</tr>`
    }
    function wrapRow(row) {
        const index = row.at(-1)
        const htmlRow = row.slice(0, -1).map(
            d => `<td class="whitespace-nowrap">${dev_toHTML(context, (d ?? '').toString())}</td>`
        ).join('\n')

        return `<tr data-index="${index}">${htmlRow}</tr>`
    }

    const fields_ = escapeForHTML(JSON.stringify(meta.fields))
    if (!saveState)
        sessionStorage.setItem(`fht-query-items-${slot}`, JSON.stringify(rows))


    // sorting

    // @ts-expect-error
    rows.sorted = array_sorted

    let sortedRows = rows.map((x, i) => [...x, i])
    if (meta.order.index !== -1) {
        // @ts-expect-error
        sortedRows = sortedRows.sorted((x) => x[meta.order.index!])
        if (meta.order.desc)
            sortedRows = sortedRows.reverse()
    }

    return html`
        <style>${getCSS()}</style>
        <div class="custom-query">
            <div class="th">
                <div class="flex flex-row items-center fade-in">
                    <span class="results-count">${rows.length} result${rows.length === 1 ? '' : 's'} </span>
                    <span class="cursor" data-on-click="editBlock" data-uuid="${context.currentBlock.uuid}" style="font-family: 'tabler-icons'; font-size: 15px; opacity: .9"></span>
                </div>
            </div>
            <div class="bd" data-on-click="false">
                <div class="custom-query-results" data-fields="${fields_}">
                    <div class="overflow-x-auto" style="width: 100%;">
                        <table class="table-auto table-resizable" style="table-layout: fixed;">
                            <thead>${getHeader()}</thead>
                            <tbody>${sortedRows.map(wrapRow).join('\n')}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
}
