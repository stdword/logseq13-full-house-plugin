import { Eta } from 'eta'
import { EtaConfig, Options } from 'eta/dist/types/config'
import { AstObject } from 'eta/dist/types/parse'
import { TemplateFunction } from 'eta/dist/types/compile'

import * as Sherlock from 'sherlockjs'

import { dayjs } from '../context'
import { Template } from '../template'


interface CustomizedOptions extends Options {
    returnState?: boolean
}


class CustomizedEta extends Eta {
    constructor(customConfig?: object) {
        super(customConfig)

        // @ts-expect-error
        this.compile = compile
        // @ts-expect-error
        this.compileToString = compileToString
        this.compileBody = compileBody
        this.parse = parse
    }

    renderStringStateAsync(template, data) {
        const templateFn = this.compile(template, { async: true, returnState: true } as Options)
        return this.renderAsync.call(this, templateFn, data
            ) as unknown as Promise<{result: string, state: {[key: string]: any}}>
    }
}

export const eta = new CustomizedEta({
    useWith: true,  /** Make data available on the global object instead of `varName` */
    varName: 'fh',  /** Name of the data object. Default "it" */

    // Raw JS code inserted in the template function. Useful for declaring global variables
    //  source of `storeVars`: https://stackoverflow.com/a/41704827
    functionHeader: `
        function storeVars(target) {
          return new Proxy(target, {
            has(target, prop) { return true; },
            get(target, prop) { return (prop in target ? target : window)[prop]; } }) }
    `.trim(),

    // Raw JS code inserted after with (if `useWith` = true) and inside try block (if `debug` = true)
    bodyHeader: [
        '__init()',  // call initialization of context (ex: extend Array.prototype)

        'out = function(x){__eta.res+=__eta.f(x)}',
        'outn = function(x){__eta.res+=__eta.f(x)+"\\n"}',
        'state = function(o){return Object.assign(__eta.s,o)}',
    ].join('\n'),

    autoEscape: false, /** Automatically XML-escape interpolations */
    // escapeFunction: eta.XMLEscape,

    autoFilter: true,  /** Apply a `filterFunction` to every interpolation or raw interpolation */
    filterFunction: function (value: any): string {
        if (value === null || value === undefined)
            return ''

        if (value instanceof dayjs)
            // @ts-expect-error
            return value.toPage()

        if (typeof value === 'string')
            return value

        // make arrays and objects looks pretty
        if (typeof value === 'object')
            return Template.convertValueToPretty(value)

        return String(value)
    },

    /** Configure automatic whitespace trimming: left & right */
    /** values:
     *    "nl" - trim new lines
     *    "slurp" - trim whitespaces
     *    false — no trimming
     * */
    autoTrim: [false, false],

    /*
        trim: [false, 'nl']
        autoFilter: false
        openTagRegex: string
        parseFunction: null
            → isStatemtent: bool
            → allowMultiline: bool
            → ignore: bool
        compileFunction: null
    */
    parseTags: {
        '``{...}``': {
            trimRight: 'nl',
            autoFilter: false,
            parseFunction: (content) => ({isStatement: true}),
            compileFunction: (meta, content) => {
                if (content === '|')  // special case for cursor positioning
                    content = 'state({cursorPosition: true}); out("{|}")'
                return content + '\n'
            },
        },
        '``[...]``': {
            trimRight: false,
            autoFilter: true,
            compileFunction: (meta, content) => `ref(${content})`,
        },
        '``@...``': {
            trimRight: false,
            autoFilter: true,
            compileFunction: (meta, content) => {
                const parts = content.split(',')
                let now = 'now'
                if (parts.length > 1)
                    now = parts.pop().trim().toLowerCase()
                content = parts.join(',')
                return `ref(date.nlp('${content}', '${now}'))`
            },
        },
        '``...``': {
            openTagRegex: '(?<!`)``(?!`|$)',
            trimRight: false,
            autoFilter: true,
        },
        '<%...%>': {
            trimRight: false,
            autoFilter: false,
            compileFunction: (meta, content_) => {
                const content = content_.trim().toLowerCase()
                if (content === 'current page')
                    return '`[[${c.currentPage.name}]]`'
                else if (content === 'today')
                    return 'ref(date.today)'
                else if (content === 'yesterday')
                    return 'ref(date.yesterday)'
                else if (content === 'tomorrow')
                    return 'ref(date.tomorrow)'
                else if (content === 'time')
                    return 'time'

                // try NLP
                Sherlock._setNow(null)
                const parsed = Sherlock.parse(content)
                const { isAllDay, eventTitle, startDate, endDate } = parsed
                if (startDate) {
                    const day = dayjs(startDate).format('page')
                    return `'[[${day}]]'`
                }

                return '\'' + content_ + '\''
            },
        },
    },

    plugins: [
        {
            // processFnString: (fn, config) => {console.debug('ETA JS:', {fn}); return fn},
            processFnString: null,
            processAST: null,
            processTemplate: null,
        },
        // TODO: https://github.com/nebrelbug/eta_plugin_mixins
    ],

    cache: false,  /** cache templates if `name` or `filename` is passed */
    cacheFilepaths: false,  /** Holds cache of resolved filepaths */
    views: '',  /** Directory that contains templates */
    debug: true,  /** Pretty-format error messages (adds runtime penalties) */
})

const AsyncFunction = async function () {}.constructor
function compile(this: Eta, str: string, options?: Partial<CustomizedOptions>): TemplateFunction {
    const config: EtaConfig = this.config

    const ctor = options && options.async ? (AsyncFunction as FunctionConstructor) : Function
    try {
        return new ctor(config.varName, 'options',
            this.compileToString.call(this, str, options)
        ) as TemplateFunction
    } catch (e) {
        if (e instanceof SyntaxError) {
            const buffer: Array<AstObject> = this.parse.call(this, str)
            let body = this.compileBody.call(this, buffer)
            if (config.debug)
                body = body.replaceAll(/^__eta\.line=\d+$\n/gm, '')
            throw new EtaError(
                'Bad template syntax\n\n' +
                e.message + '\n' +
                Array(e.message.length + 1).join('=') + '\n' +
                body + '\n'
            )
        } else throw e
    }
}
function compileToString(this: Eta, str: string, options?: Partial<CustomizedOptions>): string {
    const config = this.config
    // @ts-expect-error
    const bodyHeader = config.bodyHeader
    const isAsync = options && options.async
    const returnState = options && options.returnState

    const compileBody = this.compileBody

    const buffer: Array<AstObject> = this.parse.call(this, str)

    // NOTE: with(storeVars(...)) hides (`options`: Options) variable in compiled function
    //      this is not an issue: `options` is unnecessary inside

    let res = `${config.functionHeader}
${config.useWith ? "with(storeVars(" + config.varName + "||{})){" : ""}
let __eta = {res: "", s: {}, e: this.config.escapeFunction, f: this.config.filterFunction${
    config.debug
      ? ', line: 1, templateStr: "' +
        str.replace(/\\|"/g, "\\$&").replace(/\r\n|\n|\r/g, "\\n") +
        '"'
      : ""
  }}
${config.debug ? "try {" : ""}
${bodyHeader}
${compileBody.call(this, buffer)}
${config.debug
    ? "} catch (e) { this.RuntimeErr(e, __eta.templateStr, __eta.line) }"
    : ""}
${returnState ? "return {result: __eta.res, state: __eta.s}" : "return __eta.res"}
${config.useWith ? "}" : ""}
`.trim()

    if (config.plugins) {
        for (let i = 0; i < config.plugins.length; i++) {
            const plugin = config.plugins[i]
            if (plugin.processFnString)
                res = plugin.processFnString(res, config)
        }
    }

    return res
}
function compileBody(buff) {
    // @ts-expect-error
    const config = this.config

    let returnStr = ''
    for (const currentBlock of buff) {
        if (typeof currentBlock === 'string') {
            const str = currentBlock
            // we know string exists
            returnStr += '__eta.res+=\'' + str + '\'\n'
        } else {
            if (config.debug)
                returnStr += '__eta.line=' + currentBlock.lineNo + '\n'

            let content = currentBlock.val || ''
            const parseInfo = config.parseTags[currentBlock.t]
            const { parseFunction, compileFunction, filterFunction } = parseInfo
            const autoFilter = parseInfo.autoFilter ?? config.autoFilter

            let meta: any = {}
            if (parseFunction)
                meta = parseFunction(content)

            if (compileFunction)
                content = compileFunction(meta, content)

            if (meta.isStatement) {
                returnStr += content
                continue
            }

            if (meta.ignore) {
                // just act as simple string
                content = content.replace(/\r\n|\n|\r/g, '\\n')

                // return tags
                const [openTag, closeTag] = parseInfo.tags
                content = openTag + content + closeTag

                returnStr += '__eta.res+=\'' + content + '\'\n'
                continue
            }

            if (autoFilter)
                content = '__eta.f(' + content + ')'

            returnStr += '__eta.res+=' + content + '\n'
        }
    }
    return returnStr
}
function parse(str) {
    // @ts-expect-error
    const config = this.config;
    let buffer: any[] = [];
    let trimLeftOfNextStr = false;
    let lastIndex = 0;
    for (const [ tags, info ] of Object.entries(config.parseTags)) {
        // @ts-expect-error
        info.tags = tags.split('...')
    }

    if (config.plugins) {
        for (let i = 0; i < config.plugins.length; i++) {
            const plugin = config.plugins[i];
            if (plugin.processTemplate) {
                str = plugin.processTemplate(str, config);
            }
        }
    }

    templateLitReg.lastIndex = 0;
    singleQuoteReg.lastIndex = 0;
    doubleQuoteReg.lastIndex = 0;

    function pushString(strng, shouldTrimRightOfString) {
        if (strng) {
            // if string is truthy it must be of type 'string'
            strng = trimWS(strng, config, trimLeftOfNextStr,
            // this will only be false on the first str, the next ones will be null or undefined
            shouldTrimRightOfString);
            if (strng) {
                // replace \ with \\, ' with \'
                // we're going to convert all CRLF to LF so it doesn't take more than one replace
                strng = strng.replace(/\\|'/g, "\\$&").replace(/\r\n|\n|\r/g, "\\n");

                buffer.push(strng);
            }
        }
    }

    const openTagsReg = Object.values(config.parseTags).map((v: any) => v.openTagRegex ?? escapeRegExp(v.tags[0]) ).join("|");
    const parseOpenReg = new RegExp("(" + openTagsReg + ")" + "(-|_)?\\s*", "g");
    let m: RegExpExecArray | null;
    while (m = parseOpenReg.exec(str)) {
        const precedingString = str.slice(lastIndex, m.index);
        lastIndex = m[0].length + m.index;

        const tagOpen = m[1];
        const wsLeft = m[2];
        pushString(precedingString, wsLeft);

        const closeTagsReg = Object.values(config.parseTags)
            .filter((v: any) => (v.tags[0] === tagOpen))
            .map((v: any) => escapeRegExp(v.tags[1])).join("|");
        const parseCloseReg = new RegExp("'|\"|\\/\\*|(\\s*(-|_)?" + "(?<tag>" + closeTagsReg + "))", "g");
        parseCloseReg.lastIndex = lastIndex;
        let closeTag: RegExpExecArray | null;
        let currentObj: any = false;
        while (closeTag = parseCloseReg.exec(str)) {
            if (closeTag[1]) {
                const content = str.slice(lastIndex, closeTag.index);
                parseOpenReg.lastIndex = lastIndex = parseCloseReg.lastIndex;
                const tagClose = closeTag.groups!.tag
                const currentTags = [tagOpen, tagClose].join("...");
                trimLeftOfNextStr =  closeTag[2] || config.parseTags[currentTags].trimRight;

                currentObj = {
                    t: currentTags,
                    val: content
                };
                break;
            } else {
                const char = closeTag[0];
                if (char === "/*") {
                    const commentCloseInd = str.indexOf("*/", parseCloseReg.lastIndex);
                    if (commentCloseInd === -1) {
                        ParseErr("unclosed comment", str, closeTag.index);
                    }
                    parseCloseReg.lastIndex = commentCloseInd;
                } else if (char === "'") {
                    singleQuoteReg.lastIndex = closeTag.index;
                    const singleQuoteMatch = singleQuoteReg.exec(str);
                    if (singleQuoteMatch) {
                        parseCloseReg.lastIndex = singleQuoteReg.lastIndex;
                    } else {
                        ParseErr("unclosed string", str, closeTag.index);
                    }
                } else if (char === '"') {
                    doubleQuoteReg.lastIndex = closeTag.index;
                    const doubleQuoteMatch = doubleQuoteReg.exec(str);
                    if (doubleQuoteMatch) {
                        parseCloseReg.lastIndex = doubleQuoteReg.lastIndex;
                    } else {
                        ParseErr("unclosed string", str, closeTag.index);
                    }
                } else if (char === "`") {
                    templateLitReg.lastIndex = closeTag.index;
                    const templateLitMatch = templateLitReg.exec(str);
                    if (templateLitMatch) {
                        parseCloseReg.lastIndex = templateLitReg.lastIndex;
                    } else {
                        ParseErr("unclosed string", str, closeTag.index);
                    }
                }
            }
        }

        if (currentObj) {
            if (config.debug)
                currentObj.lineNo = getLineNo(str, m.index);

            if (!currentObj.val.includes('\n')) {
                buffer.push(currentObj)
                continue
            }
            else {
                const currentConfig = config.parseTags[currentObj.t]
                if (currentConfig.parseFunction) {
                    const meta = currentConfig.parseFunction(currentObj.val)
                    if (meta.isStatement || meta.allowMultiline) {
                        buffer.push(currentObj)
                        continue
                    }
                }
            }

            // cancel current tags obj
            parseOpenReg.lastIndex = m.index + 1
            lastIndex = m.index
        }
        else {
            ParseErr("unclosed tag", str, m.index);
        }
    }
    pushString(str.slice(lastIndex, str.length), false);

    if (config.plugins) {
        for (let i = 0; i < config.plugins.length; i++) {
            const plugin = config.plugins[i];
            if (plugin.processAST) {
                buffer = plugin.processAST(buffer, config);
            }
        }
    }

    return buffer;
}


/* START copy from eta source code as is: just to support extension-ability */
const templateLitReg = /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})*}|(?!\${)[^\\`])*`/g;
const singleQuoteReg = /'(?:\\[\s\w"'\\`]|[^\n\r'\\])*?'/g;
const doubleQuoteReg = /"(?:\\[\s\w"'\\`]|[^\n\r"\\])*?"/g;

class EtaError extends Error {
    constructor(message) {
        super(message);
        this.name = "Eta Error";
    }
}
function ParseErr(message, str, indx) {
    const whitespace = str.slice(0, indx).split(/\n/);
    const lineNo = whitespace.length;
    const colNo = whitespace[lineNo - 1].length + 1;
    message += " at line " + lineNo + " col " + colNo + ":\n\n" + "  " + str.split(/\n/)[lineNo - 1] + "\n" + "  " + Array(colNo).join(" ") + "^";
    throw new EtaError(message);
}

function trimWS(str, config, wsLeft, wsRight) {
    let leftTrim: string;
    let rightTrim: string;
    if (Array.isArray(config.autoTrim)) {
        // Slightly confusing,
        // but _}} will trim the left side of the following string
        leftTrim = config.autoTrim[1];
        rightTrim = config.autoTrim[0];
    } else {
        leftTrim = rightTrim = config.autoTrim;
    }
    if (wsLeft || wsLeft === false) {
        leftTrim = wsLeft;
    }
    if (wsRight || wsRight === false) {
        rightTrim = wsRight;
    }
    if (!rightTrim && !leftTrim) {
        return str;
    }
    if (leftTrim === "slurp" && rightTrim === "slurp") {
        return str.trim();
    }
    if (leftTrim === "_" || leftTrim === "slurp") {
        // full slurp
        str = str.trimStart();
    } else if (leftTrim === "-" || leftTrim === "nl") {
        // nl trim
        str = str.replace(/^(?:\r\n|\n|\r)/, "");
    }
    if (rightTrim === "_" || rightTrim === "slurp") {
        // full slurp
        str = str.trimEnd();
    } else if (rightTrim === "-" || rightTrim === "nl") {
        // nl trim
        str = str.replace(/(?:\r\n|\n|\r)$/, "");
    }
    return str;
}

function escapeRegExp(string) {
    // From MDN
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
function getLineNo(str, index) {
    return str.slice(0, index).split("\n").length;
}
/* END copy from eta source code */
