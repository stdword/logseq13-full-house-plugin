import {
    p, f, html,
    countOf, indexOfNth,
    escapeForRegExp, escapeForHTML, escapeForHiccup,
} from '@src/utils/other'


test('formatting string with f-template literal', () => {
    const format = f`Hello, ${'name'}!`
    expect(
        format({name: 'Logseq'})
    ).toBe('Hello, Logseq!')
 })

test('constructing strings prefixed with plugin-id with p-template literal', () => {
    expect(
        p`Hello, Logseq!`
    ).toBe('#logseq13-full-house: Hello, Logseq!')
 })

test('removing spaces from html code with html-template literal', () => {
    expect(
        html`
            <div>
                <p>Text</p>
            </div>
        `
    ).toBe('<div><p>Text</p></div>')

    expect(
        html`

            <div>

                <p>Text</p>

            </div>

        `
    ).toBe('<div>\n\n<p>Text</p>\n\n</div>')
 })

test('counting of substring in string', () => {
    expect( countOf('aaa, bbb, ccc', ',') ).toBe(2)
    expect( countOf('aaa, bbb, ccc', ', ') ).toBe(2)

    expect( countOf('aaa, bbb, ccc', 'aaa') ).toBe(1)
    expect( countOf('aaa, bbb, ccc', 'aaa, bbb, ccc') ).toBe(1)

    expect( countOf('aaa a', 'a') ).toBe(4)
    expect( countOf('aaa a', 'a ') ).toBe(1)
    expect( countOf('aaa a', ' a') ).toBe(1)
    expect( countOf('aaa a', 'aa') ).toBe(1)
    expect( countOf('aaa a', 'aaa') ).toBe(1)

    expect( countOf('aaa', '') ).toBe(0)
 })

test('finding index of Nth substring in string', () => {
    expect( indexOfNth('aaa, bbb, ccc', ',', 1) ).toBe(3)
    expect( indexOfNth('aaa, bbb, ccc', ',', 2) ).toBe(8)
    expect( indexOfNth('aaa, bbb, ccc', ', ', 1) ).toBe(3)
    expect( indexOfNth('aaa, bbb, ccc', ', ', 2) ).toBe(8)

    expect( indexOfNth('aaa, bbb, ccc', ', ', 3) ).toBe(null)

    expect( indexOfNth('aaa, bbb, ccc', 'aaa', 1) ).toBe(0)
    expect( indexOfNth('aaa, bbb, ccc', 'aaa, bbb, ccc', 1) ).toBe(0)

    expect( indexOfNth('aaa a', 'a', 1) ).toBe(0)
    expect( indexOfNth('aaa a', 'a', 4) ).toBe(4)
    expect( indexOfNth('aaa a', 'aa', 1) ).toBe(0)

    expect( indexOfNth('aaa', '') ).toBe(null)
 })

test('escaping string to use as is in regexp', () => {
    expect( escapeForRegExp('(hell[\\o])')).toBe('\\(hell\\[\\\\o\\]\\)')
 })

test('escaping string to use in html', () => {
    expect( escapeForHTML('<tag attr="val">text</tag>')).toBe('&lt;tag attr=&quot;val&quot;&gt;text&lt;/tag&gt;')
    expect( escapeForHTML("'&'")).toBe("&#039;&amp;&#039;")
 })

test('escaping string to use in hiccup', () => {
    expect( escapeForHiccup('<tag attr="val">text</tag>')).toBe("<tag attr='val'>text</tag>")
 })
