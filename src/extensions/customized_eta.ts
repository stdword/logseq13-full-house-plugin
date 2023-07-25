import { Eta } from 'eta'

import { dayjs } from '@src/context'


class CustomizedEta extends Eta {
}

export const eta = new CustomizedEta({
    useWith: true,  /** Make data available on the global object instead of `varName` */
    varName: 'fh',  /** Name of the data object. Default "it" */
    // functionHeader: 'const c = fh.c',  /** Raw JS code inserted in the template function. Useful for declaring global variables */

    autoEscape: false, /** Automatically XML-escape interpolations */
    // escapeFunction: eta.XMLEscape,

    autoFilter: true,  /** Apply a `filterFunction` to every interpolation or raw interpolation */
    filterFunction: function (value: any): string {
        if (value instanceof dayjs)
            // @ts-expect-error
            return value.toPage()

        if (typeof value === 'string')
            return value

        return String(value)
    },

    /** Configure automatic whitespace trimming: left & right */
    /** values:
     *    "nl" - trim new lines
     *    "slurp" - trim whitespaces
     *    false — no trimming
     * */
    autoTrim: [false, false],
    rmWhitespace: false,  /** Remove all safe-to-remove whitespace */

    tags: ['``{', '}``'],  /** Template code delimiters. Default `['<%', '%>']` */
    parse: {
        exec: '!',  /** Prefix for evaluation. Default is no prefix */
        interpolate: '',  /** Prefix for interpolation. Default "=" */
        raw: '~', /** Prefix for raw interpolation. Default "~" */
    },

    plugins: [], // [{processFnString: null, processAST: null, processTemplate: null}],
    // TODO: https://github.com/nebrelbug/eta_plugin_mixins

    cache: false,  /** cache templates if `name` or `filename` is passed */
    cacheFilepaths: false,  /** Holds cache of resolved filepaths */
    views: '',  /** Directory that contains templates */
    debug: true,  /** Pretty-format error messages (adds runtime penalties) */
})
