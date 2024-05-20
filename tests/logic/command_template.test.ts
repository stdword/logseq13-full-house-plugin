import { v4 as uuid } from 'uuid'

import { LogseqMock } from '@tests/index'

import * as dayjs from 'dayjs'

import { _private as tags } from '@src/tags'
import { _private as app } from '@src/app'
import { IBlockNode, LogseqReferenceAccessType, RendererMacro, parseReference } from '@src/utils'
import { compileTemplateView, renderTemplateInBlock } from '@src/logic'
import { PageEntity } from '@logseq/libs/dist/LSPlugin'
import { Template } from '@src/template'
import { BlockContext, ILogseqCurrentContext, PageContext } from '@src/context'


let logseq: any
beforeEach(async () => {
    logseq = await LogseqMock(null, {preferredDateFormat: 'YYYY-MM-DD'})
})

async function testRender(
    syntax: string,
    expected?: string,
    page?: PageEntity,
    createTemplateFunc?: Function,
    executeRendering?: Function,
) {
    const name = 'test_name'
    const command = RendererMacro.command('template').arg(name)
    const block = logseq._createBlock(command.toString(), null, page)

    if (!createTemplateFunc)
        createTemplateFunc = logseq._createTemplateBlock
    const templateBlock = createTemplateFunc!(name, syntax)

    let mockedValues = templateBlock
    if (!Array.isArray(mockedValues))
        mockedValues = [mockedValues]

    for (const mockedValue of mockedValues)
        logseq.DB.datascriptQuery.mockReturnValueOnce([mockedValue])
    if (!executeRendering)
        executeRendering = async () => {
            await renderTemplateInBlock('slot__test', block.uuid, parseReference(name), command, [])
        }
    await executeRendering()

    expect(logseq.DB.datascriptQuery).toHaveBeenCalledTimes(mockedValues.length)
    if (expected !== undefined)
        expect(block.content).toBe(expected)

    return block
}

describe('template syntax', () => {
    test('no syntax', async () => {
        await testRender('text', 'text') })
    test('js expression', async () => {
        await testRender('``1 + 2``', '3') })
    test('js statement', async () => {
        await testRender('``{ console._checkMe = 13 }``', '')
        // @ts-expect-error
        expect(console._checkMe).toBe(13)
    })

    test('back ticks inside expression', async () => {
        await testRender('`` `1` + `2` ``', '12') })

    test('save spaces to the right', async () => {
        await testRender('``{ var x = 1 }``  text', '  text') })
    test('save spaces to the left', async () => {
        await testRender('text  ``{ var x = 1 }``', 'text  ') })
    test('strip one new line to the right', async () => {
        await testRender('``{ var x = 1 }``\n\ntext', '\ntext') })
    test('strip no one new lines to the left', async () => {
        await testRender('text\n\n``{ var x = 1 }``', 'text\n\n') })

    test('ref shortcut', async () => {
        await testRender('``["page"]``', '[[page]]') })
})

describe('backwards compatibility', () => {
    test('new syntax: no exclamation mark', async () => {
        await testRender('``{ var x = c.page.name }`` ``x``', ' PAGE') })

    test('don\'t mix new & old syntax', async () => {
        await testRender('``{ var x = c.page.name }`` ``{ x }``', ' ') })

    test('statement signs: var', async () => {
        await testRender('``{ var x = c.page.name }``', '') })
    test('statement signs: =', async () => {
        await testRender('``{ c.page.name = "new" }``', '') })
    test('statement signs: absent', async () => {
        await testRender('``{ c.page.name }``', '') })
})

describe('template context', () => {
    test('page name', async () => {
        await testRender('``c.page.name``', 'PAGE') })
    test('template name', async () => {
        await testRender('``c.template.name``', 'test_name') })
    test('identity', async () => {
        await testRender('``c.identity.slot``, ``c.identity.key``', 'slot__test, test') })
    test('full context', async () => {
        const block = await testRender('``c``')
        expect(block.content.slice(0, 9)).toBe('```json\n{')
        expect(block.content.slice(-5)).toBe('}\n```')
    })
})

describe('standard template syntax', () => {
    test('unknown dynamic variable', async () => {
        await testRender('<% UNknown %>', 'UNknown') })

    test('time', async () => {
        const time = dayjs().format('HH:mm')
        await testRender('<% time %>', time) })

    test('today page', async () => {
        const today = dayjs().format('page')
        await testRender('<% today %>', '[[' + today + ']]') })
    test('today page with different spaces and case', async () => {
        const today = dayjs().format('page')
        await testRender('<%toDAY      %>', '[[' + today + ']]') })

    test('yesterday page', async () => {
        const yesterday = dayjs().subtract(1, 'day').format('page')
        await testRender('<% yesterday %>', '[[' + yesterday + ']]') })

    test('tomorrow page', async () => {
        const tomorrow = dayjs().add(1, 'day').format('page')
        await testRender('<% tomorrow %>', '[[' + tomorrow + ']]') })

    test('current page', async () => {
        await testRender('<% current page %>', '[[PAGE]]') })

    test('NLP relative week day', async () => {
        const today = dayjs()
        let day: dayjs.Dayjs | string = today.day(5)
        if (day >= today)
            day = day.subtract(1, 'week')
        day = day.format('page')
        await testRender('<% last friday %>', '[[' + day + ']]') })
    test('NLP relative days count', async () => {
        const day = dayjs().subtract(5, 'day').format('page')
        await testRender('<% 5 days ago %>', '[[' + day + ']]') })
    test('NLP relative weeks count', async () => {
        const day = dayjs().add(2, 'week').format('page')
        await testRender('<% 2 weeks from now %>', '[[' + day + ']]') })

    test('NLP exact 1', async () => {
        await testRender('<% 17 August 2013 %>', '[[2013-08-17]]') })
    test('NLP exact 2', async () => {
        await testRender('<% Sat Aug 17 2013 %>', '[[2013-08-17]]') })
    test('NLP exact 3', async () => {
        await testRender('<% 2013-08-17 %>', '[[2013-08-17]]') })
})

describe('template tags', () => {
    test('date.nlp relative to now', async () => {
        const day = dayjs().add(2, 'day').format('page')
        await testRender('``date.nlp("in two days")``', day) })

    test('date.nlp relative to tomorrow via string', async () => {
        await testRender('``date.nlp("in two days", "2020-10-01")``', '2020-10-03') })
    test('date.nlp relative to tomorrow via obj', async () => {
        const day = dayjs().add(1, 'day').add(2, 'day').format('page')
        await testRender('``date.nlp("in two days", date.tomorrow)``', day) })

    test('date.nlp relative to now in journal page', async () => {
        const page = logseq._createJournalPage('2020-10-01')
        await testRender('``date.nlp("in two days", "page")``', '2020-10-03', page) })

    test('special syntax for date.nlp', async () => {
        const page = logseq._createJournalPage('2020-10-01')
        await testRender('``@in two days, page``', '[[2020-10-03]]', page) })
})

describe('template structure', () => {
    test('rendering children of first child block', async () => {
        const block = await testRender('parent', 'parent', undefined, (name, syntax) => {
            const block = logseq._createTemplateBlock(name, syntax)
            logseq._createBlock('child text 1', block.children[0])
            logseq._createBlock('child text 2', block.children[0])
            return block
        })
        expect(block.children).toHaveLength(2)
        expect(block.children[0].content).toBe('child text 1')
        expect(block.children[1].content).toBe('child text 2')
    })
    test('rendering children of second child block', async () => {
        const block = await testRender('parent 1', 'parent 1', undefined, (name, syntax) => {
            const block = logseq._createTemplateBlock(name, syntax)
            logseq._createBlock('parent 2', block)
            logseq._createBlock('child text 1', block.children[1])
            logseq._createBlock('child text 2', block.children[1])
            return block
        })
        expect(block.children).toHaveLength(0)

        const secondBlock = logseq._blocks.find(block => (block.content === 'parent 2')) ?? null
        expect(secondBlock).not.toBeNull()

        expect(secondBlock.children[0].content).toBe('child text 1')
        expect(secondBlock.children[1].content).toBe('child text 2')
    })
    test('template inclusion', async () => {
        await testRender('``await include("base")``', '{{renderer :template, base}}', undefined, (name, syntax) => {
            const blockBase = logseq._createTemplateBlock('base', 'base:``c.page.name``')
            const blockChild = logseq._createTemplateBlock(name, syntax)
            return [blockChild, blockBase]
        })
    })
    test('view inclusion', async () => {
        const name = 'test_view'
        const command = RendererMacro.command('template-view').arg(name)
        const block = logseq._createBlock(command.toString())

        const templateBlock = logseq._createTemplateBlock(
            name, 'child:``await include("base")``', {argProp: 'OVERRIDED', 'arg-prop': 'OVERRIDED'}
        )
        const templateBlockBase = logseq._createTemplateBlock(
            'base', 'base:``c.args.prop``', {argProp: 'BASE VALUE', 'arg-prop': 'BASE VALUE'})

        const [includingParent, accessedVia] = [false, 'name' as LogseqReferenceAccessType]
        const template = new Template(templateBlock, {name, includingParent, accessedVia})
        await template.init()

        logseq.DB.datascriptQuery.mockReturnValueOnce([templateBlockBase])

        const view = await compileTemplateView(
            'slot__test',
            template,
            [],
            {
                mode: 'view',
                currentPage: PageContext.createFromEntity(await logseq.Editor.getPage(block.page.id)),
                currentBlock: BlockContext.createFromEntity(block),
            } as ILogseqCurrentContext,
        )

        expect(logseq.DB.datascriptQuery).toHaveBeenCalledTimes(1)

        const expectedBase = 'base:BASE VALUE'
        const expectedChild = `child:${expectedBase}`
        expect(view).toBe(expectedChild)
    })
    test('view inheritance', async () => {
        const name = 'test_view'
        const command = RendererMacro.command('template-view').arg(name)
        const block = logseq._createBlock(command.toString())

        const templateBlock = logseq._createTemplateBlock(
            name, 'child:``await layout("base")``', {argProp: 'OVERRIDED', 'arg-prop': 'OVERRIDED'}
        )
        const templateBlockBase = logseq._createTemplateBlock(
            'base', 'base:``c.args.prop``', {argProp: 'BASE VALUE', 'arg-prop': 'BASE VALUE'})

        const [includingParent, accessedVia] = [false, 'name' as LogseqReferenceAccessType]
        const template = new Template(templateBlock, {name, includingParent, accessedVia})
        await template.init()

        logseq.DB.datascriptQuery.mockReturnValueOnce([templateBlockBase])

        const view = await compileTemplateView(
            'slot__test',
            template,
            [],
            {
                mode: 'view',
                currentPage: PageContext.createFromEntity(await logseq.Editor.getPage(block.page.id)),
                currentBlock: BlockContext.createFromEntity(block),
            } as ILogseqCurrentContext,
        )

        expect(logseq.DB.datascriptQuery).toHaveBeenCalledTimes(1)

        const expectedBase = 'base:OVERRIDED'
        const expectedChild = `child:${expectedBase}`
        expect(view).toBe(expectedChild)
    })
})
