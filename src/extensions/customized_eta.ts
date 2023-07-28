import { Eta } from 'eta'

import { dayjs } from '../context'
import { IBlockNode, walkBlockTree } from '../utils'


class CustomizedEta extends Eta {
    compileBody: Function

    constructor(...args) {
        super(...args)
        this.compileBody = compileBody
        this.compileToString = compileToString
        this.parse = parse
    }
}

const etaForCompatibility = new Eta({
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

    tags: ['``{', '}``'],
    parse: {
        exec: '!',
        interpolate: '',
        raw: '~',
    },

    plugins: [], // [{processFnString: null, processAST: null, processTemplate: null}],
    // TODO: https://github.com/nebrelbug/eta_plugin_mixins

    cache: false,  /** cache templates if `name` or `filename` is passed */
    cacheFilepaths: false,  /** Holds cache of resolved filepaths */
    views: '',  /** Directory that contains templates */
    debug: false,  /** Pretty-format error messages (adds runtime penalties) */
 })

const eta = new CustomizedEta({
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

    /*
        trim: [false, 'nl'],
        parseFunction: null,
        compileFunction: null,
        autoFilter: false,
        filterFunction: null,
    */
    parseTags: {
        '``{...}``': {
            trimRight: 'nl',
            autoFilter: false,
            parseFunction: (content) => ({isStatement: true}),
            compileFunction: (meta, content) => (content + '\n'),
        },
        '``[...]``': {
            trimRight: false,
            autoFilter: true,
            compileFunction: (meta, content) => `ref(${content})`,
        },
        '``...``': {
            trimRight: false,
            autoFilter: true,
            parseFunction: (meta, content) => ({protectValue: true}),
        },
        // '<%...%>': {
        //   trimRight: false,
        //   autoFilter: false,
        //   filterFunction: RenderLogseqTemplate,
        // },
    },

    plugins: [], // [{processFnString: null, processAST: null, processTemplate: null}],
    // TODO: https://github.com/nebrelbug/eta_plugin_mixins

    cache: false,  /** cache templates if `name` or `filename` is passed */
    cacheFilepaths: false,  /** Holds cache of resolved filepaths */
    views: '',  /** Directory that contains templates */
    debug: false,  /** Pretty-format error messages (adds runtime penalties) */
 })

export async function isOldSyntax(block: IBlockNode) {
    let useOldSyntax = false

    const openTag_ = '``{'
    const [ openTag, closeTag ] = [ escapeRegExp(openTag_), escapeRegExp('}``') ]
    const prefix = escapeRegExp('!')
    const openTagWithPrefixRegexp = new RegExp(openTag + '(-|_)?\\s*(' + prefix + ')\\s', 'g')
    const statementsSignsRegexp = new RegExp(openTag + '(?<code>.*)(?<!.*\\b(=|var|let|const|return|if|switch|for|function|try|class|while)\\b.*)' + closeTag, 'gs')
    const captureInsideRegexp = new RegExp(openTag + '(?<code>.*)' + closeTag, 'gs')


    await walkBlockTree(block, async (b, lvl) => {
        if (b.content.indexOf(openTag_) === -1)
            return

        let m = openTagWithPrefixRegexp.exec(b.content)
        if (m) {
            useOldSyntax = true
            return
        }

        m = statementsSignsRegexp.exec(b.content)
        if (m) {
            m = captureInsideRegexp.exec(b.content)
            // has no single «=»
            if (!(m && m.groups && (m.groups.code.indexOf('=') !== -1 && m.groups.code.indexOf('==') === -1)))
                useOldSyntax = true
        }
    })

    return useOldSyntax
 }

export class RenderingSyntax {
    static latest(): Eta {
        return eta
    }
    static async autoSelect(block: IBlockNode): Promise<Eta> {
        return (await isOldSyntax(block)) ? etaForCompatibility : eta
    }
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

            if (meta.protectValue) {
                if (content.indexOf('`') === -1)
                    content = `(() => {
                        try {return eval(\`` + content + `\`)}
                        catch {return \`` + content + `\`}
                    })()`
                else if (content.indexOf("'") === -1)
                    content = `(() => {
                        try {return eval('${content}')}
                        catch {return '${content}'}
                    })()`
                else
                    content = `(() => {
                        try {return eval("${content}")}
                        catch {return "${content}"}
                    })()`
            }

            if (filterFunction)
                content = `this.config.parseTags[${currentBlock.t}].filterFunction(` + content + ')'

            if (autoFilter)
                content = '__eta.f(' + content + ')'

            returnStr += '__eta.res+=' + content + '\n'
        }
    }

    console.debug(returnStr)
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

    const openTagsReg = Object.values(config.parseTags).map((v: any) => escapeRegExp(v.tags[0])).join("|");
    const parseOpenReg = new RegExp("(" + openTagsReg + ")" + "(-|_)?\\s*", "g");
    let m;
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
        let closeTag;
        let currentObj: any = false;
        while (closeTag = parseCloseReg.exec(str)) {
            if (closeTag[1]) {
                const content = str.slice(lastIndex, closeTag.index);
                parseOpenReg.lastIndex = lastIndex = parseCloseReg.lastIndex;
                const tagClose = closeTag.groups.tag
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
            if (config.debug) {
                currentObj.lineNo = getLineNo(str, m.index);
            }
            buffer.push(currentObj);
        } else {
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


/* START copy from eta source code: just to support extension-ability */
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
    let leftTrim;
    let rightTrim;
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

function compileToString(str, options) {
    // complete copy from eta just to bind compileBody
    // @ts-expect-error
    const config = this.config;
    const isAsync = options && options.async;
    // @ts-expect-error
    const buffer = this.parse.call(this, str);
    // note: when the include function passes through options, the only parameter that matters is the filepath parameter
    let res = `${config.functionHeader}
let include = (template, data) => this.render(template, data, options);
let includeAsync = (template, data) => this.renderAsync(template, data, options);

let __eta = {res: "", e: this.config.escapeFunction, f: this.config.filterFunction${config.debug ? ', line: 1, templateStr: "' + str.replace(/\\|'/g, "\\$&").replace(/\r\n|\n|\r/g, "\\n") + '"' : ""}};

function layout(path, data) {
    __eta.layout = path;
    __eta.layoutData = data;
}${config.debug ? "try {" : ""}${config.useWith ? "with(" + config.varName + "||{}){" : ""}

${// @ts-expect-error
        compileBody.call(this, buffer)}
if (__eta.layout) {
    __eta.res = ${isAsync ? "await includeAsync" : "include"} (__eta.layout, {...${config.varName}, body: __eta.res, ...__eta.layoutData});
}
${config.useWith ? "}" : ""}${config.debug ? "} catch (e) { this.RuntimeErr(e, __eta.templateStr, __eta.line, options.filepath) }" : ""}
return __eta.res;
`;
    if (config.plugins) {
        for (let i = 0; i < config.plugins.length; i++) {
            const plugin = config.plugins[i];
            if (plugin.processFnString) {
                res = plugin.processFnString(res, config);
            }
        }
    }
    return res;
 }
/* END copy from eta source code */
