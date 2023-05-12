import { f } from '@src/utils/other'


test('adds 1 + 2 to equal 3', () => {
    const format = f`Hello, ${'name'}!`
    expect(
        format({name: 'Logseq'})
    ).toBe('Hello, Logseq!')
})
