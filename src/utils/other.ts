import {logseq as packageInfo} from '../../package.json'


try {
    navigator.locks
}
catch (error) {
    console.error('Cannot use Web Locks API')
}
const locks = navigator.locks


/* Tagged template printing function
 * @usage console.log(p`Hello, Logseq!`)
 */
export function p(strings: any, ...values: any[]) {
    return `#${packageInfo.id}: ` + String.raw({raw: strings}, ...values)
 }

/* Format-string
 * @usage f`Hello, ${'name'}!`({name: 'Logseq'})
 */
export function f(strings: any, ...values: any[]) {
    return (format: {[i: string]: any}) => String.raw({raw: strings}, ...values.map(v => format[v]))
 }

/**
 * ```typescript doctest
 * countOf('aaa, bbb, ccc', ',') // => 3
 * countOf('aaa, bbb, ccc', ', ') // => 3
 * countOf('aaa a', 'aa') // => 1
 * countOf('aaa', '') // => 0
 * ```
 */
export function countOf(string: string, substring: string): number {
    if (substring.length === 0)
        return 0

    const matchedCount = string.length - string.replaceAll(substring, '').length
    return matchedCount / substring.length
 }

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
        return async (...args: any) => {
            const key = idFunc(args)
            await locks.request(key, {ifAvailable: true}, async (lock) => {
                if (!lock) {
                    console.warn(p`Excess call of "${func.name}" with "${args}"`)
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
