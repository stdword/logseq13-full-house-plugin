import { LogseqMock } from '@tests/index'

import { getTemplateTagsContext } from '@src/tags'
import { ILogseqContext, dayjs } from '@src/context'
import { toISODate } from '@src/utils'


describe('string dates values', () => {
    test('ok iso format', async () => {
        await LogseqMock(null, {preferredDateFormat: 'YYYY-MM-DD'})
        const tags = getTemplateTagsContext({} as ILogseqContext)

        expect( tags.yesterday ).toBe(dayjs().subtract(1, 'day').format('page'))
        expect( tags.tomorrow ).toBe(dayjs().add(1, 'day').format('page'))
        expect( tags.today ).toBe(dayjs().format('page'))

        expect( tags.time ).toBe(dayjs().format('HH:mm'))
    })
    test('ok date objects', async () => {
        await LogseqMock(null, {preferredDateFormat: 'YYYY-MM-DD'})
        const tags = getTemplateTagsContext({} as ILogseqContext)

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0)
        yesterday.setMinutes(0)
        yesterday.setSeconds(0)
        yesterday.setMilliseconds(0)

        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0)
        tomorrow.setMinutes(0)
        tomorrow.setSeconds(0)
        tomorrow.setMilliseconds(0)

        const today = new Date()
        today.setHours(0)
        today.setMinutes(0)
        today.setSeconds(0)
        today.setMilliseconds(0)

        const now = new Date()
        now.setMilliseconds(0)

        expect( tags.date.yesterday ).toEqual(dayjs(yesterday))
        expect( tags.date.today ).toEqual(dayjs(today))
        expect( tags.date.now ).toEqual(dayjs(now))
        expect( tags.date.tomorrow ).toEqual(dayjs(tomorrow))

        expect( tags.date.from ).toBe(dayjs)
    })
})
