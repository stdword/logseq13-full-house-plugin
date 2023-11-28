import { logseq as packageInfo } from '../../package.json'


let locks: LockManager | null = null
try {
    locks = navigator.locks
}
catch (error) {
    if (process.env.NODE_ENV !== 'test')
        console.error('Cannot use Web Locks API')
}


/**
 * Tagged template printing function
 * @usage console.log(p`Hello, Logseq!`)
 * @usage console.debug(p``, {var})
 **/
export function p(strings: any, ...values: any[]): string {
    const raw = String.raw({raw: strings}, ...values)
    const space = raw ? ' ' : ''
    return `#${packageInfo.id}:${space}${raw}`
 }

/**
 * Format-string
 * @usage f`Hello, ${'name'}!`({name: 'Logseq'})
 * @usage
 *     const format = f`Hello, ${'name'}!`
 *     format({name: 'Logseq'}) // => 'Hello, Logseq!'
 **/
export function f(strings: any, ...values: any[]): Function {
    return (format: {[i: string]: any}) => String.raw({raw: strings}, ...values.map(v => format[v]))
 }

/**
 * Clear spaces from HTML-string
 * @usage
 *     html`
 *          <div>
 *              <p>Text</p>
 *          </div>
 *     ` // => '<div><p>Text</p></div>'
 **/
export function html(strings: any, ...values: any[]): string {
    const raw = String.raw({raw: strings}, ...values)
    return raw.trim().replaceAll(/^\s+/gm, '').replaceAll(/>\n</g, '><')
 }

/**
 * Count substrings in string
 */
export function countOf(string: string, substring: string): number {
    if (substring.length === 0)
        return 0

    const matchedCount = string.length - string.replaceAll(substring, '').length
    return matchedCount / substring.length
 }

/**
 * Find index of Nth substring in string
 */
export function indexOfNth(string: string, substring: string, count: number = 1): number | null {
    if (count <= 0)
        throw new Error('count param should be positive')

    const realCount = countOf(string, substring)
    if (count > realCount)
        return null

    return string.split(substring, count).join(substring).length
 }

export function lockOn(idFunc: ((args: any) => string)) {
    return (func: Function) => {
        if (!locks)
            return func

        return async (...args: any) => {
            const key = idFunc(args)
            await locks!.request(key, {ifAvailable: true}, async (lock) => {
                if (!lock) {
                    console.warn(p`Excess call of "${func.name}" with`, {func, args})
                    return
                }
                await func(...args)
            })
        }
    }
 }

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
 }

export function escapeForRegExp(str: string) {
    const specials = [
        // '-', '^', '$',
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\',
    ]

    const replacer = new RegExp('(\\' + specials.join('|\\') + ')', 'g')
    return str.replaceAll(replacer, '\\$1')

    // alternative from MDN
    // return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
    // $& means the whole matched string
}

export function escapeForHTML(unsafe: string) {
    return unsafe
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', "&quot;")
        .replaceAll("'", '&#039;')
 }

export function escapeForHiccup(unsafe: string) {
    return unsafe.replaceAll('"', "'")
 }

export function toISODate(date: Date) {
    const m = `${date.getMonth() + 1}`
    const d = date.getDate().toString()
    return `${date.getFullYear()}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
 }

export function getCSSVars(names) {
    const style = getComputedStyle(top!.document.body)
    return names.map((name) => style.getPropertyValue(name))
}

export function loadThemeVars(vars) {
    const vals = getCSSVars(vars)
    if (!vals)
        return

    const style = document.body.style
    vars.forEach((k, i) => {
        style.setProperty(k, vals[i])
    })
}
