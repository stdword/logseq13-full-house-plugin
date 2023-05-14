import 'global-jsdom/register'

import {
    _private as P
} from '@src/tags'


test('ref', () => {
    expect(
        P.ref('page')
    ).toBe('[[page]]')
 })
