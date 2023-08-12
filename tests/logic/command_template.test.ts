import { v4 as uuid } from 'uuid'

import { LogseqMock } from '@tests/index'

import * as dayjs from 'dayjs'

import { _private as tags } from '@src/tags'
import { _private as app } from '@src/app'
import { RendererMacro, parseReference } from '@src/utils'
import { renderTemplateInBlock } from '@src/logic'


let logseq: any
beforeEach(async () => {
    logseq = await LogseqMock(null, {preferredDateFormat: 'YYYY-MM-DD'})
})

async function testRender(syntax: string, expected: string | null = null) {
    const name = 'test_name'
    const command = RendererMacro.command('template').arg(name)
    const block = logseq._createBlock(command.toString())
    if (expected === '')
        expected = block.content

    const templateBlock = logseq._createTemplateBlock(name, syntax)

    logseq.DB.datascriptQuery.mockReturnValue([templateBlock])
    await renderTemplateInBlock('slot__test', block.uuid, parseReference(name), command, [])

    expect(logseq.DB.datascriptQuery).toHaveBeenCalledTimes(1)
    if (expected !== null)
        expect(block.content).toBe(expected)

    return block.content
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
    test('old syntax: exclamation mark', async () => {
        await testRender('``{ ! var x = c.page.name }`` ``{ x }``', ' PAGE') })
    test('new syntax: no exclamation mark', async () => {
        await testRender('``{ var x = c.page.name }`` ``x``', ' PAGE') })

    test('don\'t mix old & new syntax', async () => {
        await testRender('``{ ! var x = c.page.name }`` ``x``', ' ``x``') })
    test('don\'t mix new & old syntax', async () => {
        await testRender('``{ var x = c.page.name }`` ``{ x }``', ' ') })

    test('statement signs: var', async () => {
        await testRender('``{ var x = c.page.name }``', '') })
    test('statement signs: =', async () => {
        await testRender('``{ c.page.name = "new" }``', '') })
    test('statement signs: absent', async () => {
        await testRender('``{ c.page.name }``', 'PAGE') })
})

describe('template context', () => {
    test('page name', async () => {
        await testRender('``c.page.name``', 'PAGE') })
    test('template name', async () => {
        await testRender('``c.template.name``', 'test_name') })
    test('identity', async () => {
        await testRender('``c.identity.slot``, ``c.identity.key``', 'slot__test, test') })
    test('full context', async () => {
        const content = await testRender('``c``')
        expect(content.slice(0, 9)).toBe('```json\n{')
        expect(content.slice(-5)).toBe('}\n```')
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
        if (day > today)
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
