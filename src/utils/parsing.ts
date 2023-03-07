import { p } from './other'


// Subset of Unicode «Punctuation, Dash» category
const dashesValues = [
    '\u002D',  // HYPHEN-MINUS
    '\u058A',  // ARMENIAN HYPHEN
    '\u1806',  // MONGOLIAN TODO SOFT HYPHEN
    '\u2010',  // HYPHEN
    '\u2011',  // NON-BREAKING HYPHEN
    '\u2012',  // FIGURE DASH
    '\u2013',  // EN DASH
    '\u2014',  // EM DASH
    '\u2015',  // HORIZONTAL BAR
    '\u2E3A',  // TWO-EM DASH
    '\u2E3B',  // THREE-EM DASH
    '\uFE58',  // SMALL EM DASH
    '\uFE63',  // SMALL HYPHEN-MINUS
    '\uFF0D',  // FULLWIDTH HYPHEN-MINUS
 ]

// Subset of Unicode «Punctuation» category
const quotesValues = [
    '""',
    "''",
    '``',
    '«»',

    '\u2018\u2019',      // LEFT & RIGHT SINGLE QUOTATION MARK
    '\u201C\u201D',      // LEFT & RIGHT  DOUBLE QUOTATION MARK
    '\u276E\u276F',      // HEAVY LEFT- & RIGHT-POINTING ANGLE QUOTATION MARK ORNAMENT

    '\uFF02'.repeat(2),  // FULLWIDTH QUOTATION MARK
    '\uFF07'.repeat(2),  // FULLWIDTH APOSTROPHE
    '\u201B'.repeat(2),  // SINGLE HIGH-REVERSED-9 QUOTATION MARK
    '\u201F'.repeat(2),  // DOUBLE HIGH-REVERSED-9 QUOTATION MARK
    '\u201A'.repeat(2),  // SINGLE LOW-9 QUOTATION MARK
    '\u201E'.repeat(2),  // DOUBLE LOW-9 QUOTATION MARK
    '\u2E42'.repeat(2),  // DOUBLE LOW-REVERSED-9 QUOTATION MARK
    '\u301D'.repeat(2),  // REVERSED DOUBLE PRIME QUOTATION MARK
    '\u301F'.repeat(2),  // LOW DOUBLE PRIME QUOTATION MARK
    '\u301E'.repeat(2),  // DOUBLE PRIME QUOTATION MARK
 ]


export function isUUID(str: string) {
    const regex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    return !!str.match(regex)
 }

export function toCamelCase(text: string): string {
    text = text.replaceAll(/(?<=-)(\w)/g, (m, ch) => ch.toUpperCase())
    text = text.replaceAll(/(?<=_)(\w)/g, (m, ch) => ch.toUpperCase())
    text = text.replaceAll('-', '')
    text = text.replaceAll('_', '')
    text = text[0].toLowerCase() + text.slice(1)
    return text
 }

export function isBoolean(obj: any): boolean {
    // source: https://stackoverflow.com/a/28814865
    if (typeof obj === typeof true)
        return true

    if (typeof obj === 'object' && obj !== null && typeof obj.valueOf() === typeof true)
        return true

    return false
 }

export function isInteger(str: string): boolean {
    const x = Number(str)
    if (Number.isNaN(x))
        return false

    // detect float
    if (str.includes('.') || str.includes('e-'))
        return false

    return true
 }

export function isEmpty(obj: any): boolean {
    if (!obj) {
        return true
    }

    if (
        obj.constructor !== Object &&
        obj.constructor !== Array &&
        obj.constructor !== String
    ) {
        console.debug(p``, typeof obj, {obj})
        throw new Error('Cannot check user-class object for emptyness')
    }

    return Object.keys(obj).length === 0
 }

export function isEmptyString(obj: string): boolean {
    const emptyValues = [''].concat(quotesValues).concat(dashesValues)
    return emptyValues.includes(obj.trim())
 }

export function coerceStringToBool(str: string): boolean | null {
    if (isEmptyString(str))
        return null

    const trueValues = [
        '✅', '✔️', '☑️', '🔘',
        '+', '1',
        'v', 'y', 't',
        'on', 'yes', 'true',
        'ok', 'yep', 'yeah',
        'checked', 'enabled',
        'turned on', 'turn on',
    ]
    const falseValues = [
        '🚫', '❌', '✖️', '⛔️',
        '-', '0',
        'x', 'n', 'f',
        'off', 'no', 'false',
        'non', 'nope',
        'none', 'null', 'nil',
        'unchecked', 'empty', 'disabled',
        'turned off', 'turn off', 'dont', "don't",
    ]

    str = str.toString().toLowerCase().trim()
    if (trueValues.includes(str))
        return true
    if (falseValues.includes(str))
        return false

    return null
 }

/* Coerce to bool:
 *  - any bool object
 *  - non-empty string with value coercible to bool
 *  - empty value (including [] and {})
 */
export function coerceToBool(
    obj: any,
    opts?: {
        defaultForUncoercible?: boolean,
        defaultForEmpty?: boolean,
    }): boolean | null {
    if (isBoolean(obj))
        return !!obj

    if (isEmpty(obj))
        return opts?.defaultForEmpty ?? null

    const bool = coerceStringToBool(obj)
    if (bool !== null)
        return bool

    return opts?.defaultForUncoercible ?? null
 }

export function unquote(ref: string, qoutes: string[] = quotesValues): string {
    if (isEmptyString(ref))
        return ''

    for (const [open, close] of qoutes)
        if (ref.startsWith(open) && ref.endsWith(close))
            ref = unquote(ref.slice(1, -1), qoutes)

    return ref
 }
