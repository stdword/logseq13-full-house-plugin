export class LogseqDayjsState {
    static #format = ''

    /**
     * Remap date format pattern
     *   Ex: yyyy-MM-dd EEE → YYYY-MM-DD ddd
     *
     * from: https://docs.oracle.com/en/java/javase/12/docs/api/java.base/java/text/SimpleDateFormat.html
     * to: https://day.js.org/docs/en/parse/string-format
     *     https://day.js.org/docs/en/display/format#list-of-localized-formats
     */
    static set format(f) {
        // NOTE: mapping is not full — it supports only formats listed in logseq
        //     https://github.com/logseq/logseq/blob/master/src/main/frontend/date.cljs#L22
        //
        // Not supported:
        //  'W': Week in month
        //  'D': Day in year

        // order is important to prevent intersections
        const remapRules = {
            // examples for date 2023-02-08

            'yyyy': 'YYYY',  // 2023
            'yy': 'YY',      // 23

            'MMMM': 'MMMM',  // February
            'MMM': 'MMM',    // Feb
            'MM': 'MM',      // 02
            'M': 'M',        // 2

            'dd': 'DD',      // 08
            'do': 'Do',      // 8th
            'd': 'D',        // 8

            'EEEE': 'dddd',  // Wednesday
            'EEE': 'ddd',    // Wed
            'EE': 'dd',      // We
            'u': 'd',        // 3 (Sunday is 0)

            'ww': 'ww',      // 06
            'w': 'w',        // 6
        }

        for (const [ from, to ] of Object.entries(remapRules))
            f = f.replaceAll(from, to)

        LogseqDayjsState.#format = f
    }
    static get format() {
        return LogseqDayjsState.#format
    }
}

function formatLikeJournalPage(dayjsObj): string {
    if (!LogseqDayjsState.format)
        return ''

    return dayjsObj.format(LogseqDayjsState.format)
 }

export default (option, dayjsClass, dayjsFactory) => {
    // extend dayjs()
    dayjsClass.prototype.toPage = function(args) {
        return formatLikeJournalPage(this)
    }
    dayjsClass.prototype.toLogseqInternalFormat = function(args) {
        return Number(this.format('YYYYMMDD'))
    }

    // extend dayjs
    Object.defineProperty(
        dayjsFactory,
        'logseqJournalPageFormat',
        { get: () => LogseqDayjsState.format },
    )

    // decorate dayjs().format(...)
    const oldFormat = dayjsClass.prototype.format
    dayjsClass.prototype.format = function(args) {
        if (args === 'page')
            return formatLikeJournalPage(this)

        return oldFormat.bind(this)(args)
    }
}
