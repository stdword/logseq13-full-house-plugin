## `Reference operations` :id=section-refs

### `ref` :id=ref
Make a reference to page (`[[name]]`) or block (`((uuid))`).

`ref(obj, label?)`
- `obj` is one of the following items:
    - page name
    - page context
    - block uuid
    - block context
    - dayjs object
    - date ISO string (YYYY-MM-DD)
- `label`: (optional) custom label for the reference

?> Could be used implicitly with [` ``[...]`` `](reference__syntax.md#reference-interpolation-syntax) syntax

<!-- panels:start -->
<!-- div:left-panel -->
Example:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`ref('page name')` \
`ref(c.currentPage)` \
`ref('64e61063-1689-483f-903f-409766d81b2e')` \
`ref(c.block)` \
`ref(date.tomorrow)` \
`ref('2020-01-01')`

#### ***Rendered***
[[page name]] \
[[page name]] \
((64e61063-1689-483f-903f-409766d81b2e)) \
((64e61063-1689-483f-903f-409766d81b2e)) \
[[2023-08-12 Sat]] \
[[2020-01-01 Wed]]
<!-- tabs:end -->

<!-- div:left-panel -->
Additional usage:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
- ` ``['page name']`` `
- `ref('the long page name', 'page')`

#### ***Rendered***
- [[page name]]
- [[page]]

<!-- tabs:end -->

<!-- panels:end -->



### `tag` :id=tag
Make a tag reference to page (`#name`).

`tag(obj)`
- `obj` is one of the following items:
    - page name
    - page context
    - dayjs object
    - date ISO string (YYYY-MM-DD)

<!-- tabs:start -->
#### ***Template***
`tag('name')` \
`tag(c.currentPage)` \
`tag(date.tomorrow)` \
`tag('2020-01-01')`

#### ***Rendered***
#name \
#[[page name]] \
#[[2023-08-12 Sat]] \
#[[2020-01-01 Wed]]
<!-- tabs:end -->



### `embed` :id=embed
Call an `embed` macro for pages `{{embed [[page]] }}` or blocks `{{embed ((uuid...)) }}`.

`embed(obj)`
- `obj`: one of the allowed objects for [`ref`](#ref)

<!-- tabs:start -->
#### ***Template***
`embed('page name')` \
`embed(c.currentPage)` \
`embed('64e61063-1689-483f-903f-409766d81b2e')` \
`embed(c.block)` \
`embed(date.tomorrow)` \
`embed('2020-01-01')`

#### ***Rendered***
{{embed [[page name]] }} \
{{embed [[page name]] }} \
{{embed ((64e61063-1689-483f-903f-409766d81b2e)) }} \
{{embed ((64e61063-1689-483f-903f-409766d81b2e)) }} \
{{embed [[2023-08-12 Sat]] }} \
{{embed [[2020-01-01 Wed]] }}
<!-- tabs:end -->



## `String operations` :id=section-string

### `empty` :id=empty
Checks whether the object is empty or not. If it is empty it will be replaced with fallback object.

`empty(obj, fallback = '') → obj, fallback`
- `obj`: value to check for emptyness
- `fallback`: replacement object (default: `''`)

!> It is very different than JavaScript «empty» values. \
\
*Empty* values example: \
`null`, `undefined`, `[]`, `{}`, `'     '`, `''`, `""`, ` `` `, `«»`, `-`, `—`, etc. \
\
*Non-empty* values example: \
`0`, `false`, etc.

<!-- tabs:start -->
#### ***Template***
` ``empty([1, 2, 3])`` ` \
` ``empty([])`` ` \
` ``empty([], 'empty array')`` `

#### ***Rendered***
[1, 2, 3] \
\
empty array
<!-- tabs:end -->



### `bool` :id=bool
Checks whether the string is `true`, `false` or non-boolean.

`bool(obj, fallback = '') → true, false, fallback`
- `obj`: value to check to be boolean
- `fallback`: replacement object (default: `''`)

!> It is very different than JavaScript «boolean» values. \
\
*true* values example: \
`✅`, `+`, `1`, `v`, `yes`, `ok`, `on`, etc. \
\
*false* values example: \
`❌`, `-`, `0`, `x`, `no`, `none`, `OFF`, etc.

<!-- tabs:start -->
#### ***Template***
` ``bool('true')`` ` \
` ``bool('f')`` ` \
` ``bool([])`` `

#### ***Rendered***
true \
false \
null
<!-- tabs:end -->



### `when` :id=when
If the object is empty (in JavaScript way) return `fallback`, otherwise return `result` (which can be based on object value).

`when(obj, result, fallback = '')`
- `obj`: value to check the emptyness
- `result`: value for non-empty case
    - Can contain `$1`, `${}`, `${_}`: these values will be replaces with object itself
- `fallback`: value for empty case (default: `''`)

<!-- tabs:start -->
#### ***Template***
This is ` ``when(c.page.day, 'journal page for $1 day', 'page')`` ` \
Root namespace: ` ``when(c.page.name.split('/').at(0), '$1')`` `

#### ***Rendered***
*In journal page:*
This is journal page for 2023-08-12 Sat
Root namespace: 2023-08-12 Sat

*In logseq/plugins page:*
This is journal page
Root namespace: logseq

<!-- tabs:end -->



### `fill` :id=fill
Complements the input string `value` with `char` characters to reach the `width` width.

`fill(value, char, width, align = 'right')`
- `value`: value to complement
- `char`: character to use as filler
- `width`: full width of result string
- `align`: align initial value to the *left*, *right* or *center* (default: `'right'`)

<!-- tabs:start -->
#### ***Template***
«` ``fill(1, '+', 2)`` `» \
«` ``fill(13, ' ', 4, 'center')`` `» \
«` ``fill('x', 'y', 3, 'left')`` `»

#### ***Rendered***
«+1» \
« 13 » \
«xyy»
<!-- tabs:end -->



### `zeros` :id=zeros
Shortcut for [`fill`](#fill) with zeros and right alignment.

`zeros(value, width)`
- Same as `fill(value, '0', width)`
- `value`: value to complement
- `width`: full width of result string

<!-- tabs:start -->
#### ***Template***
«` ``zeros(1, 2)`` `» \
«` ``zeros(13, 4)`` `»

#### ***Rendered***
«01» \
«0013»
<!-- tabs:end -->



### `spaces` :id=spaces
Shortcut for [`fill`](#fill) with spaces.

`spaces(value, width, align)`
- Same as `fill(value, ' ', width, align)`
- `value`: value to complement
- `width`: full width of result string
- `align`: align initial value to the *left*, *right* or *center* (default: `'right'`)

<!-- tabs:start -->
#### ***Template***
«` ``spaces(1, 2)`` `» \
«` ``spaces('hey', 5, 'center')`` `»

#### ***Rendered***
« 1» \
« hey »
<!-- tabs:end -->



## `Nesting templates` :id=section-nesting

### `include` :id=nesting-include
Include another template by it's name.

- `async include(name, args?, lazy?)`
    - `name`: template name. Only templates with `template::` property can be included.
    - `args`: (optional) arguments for included template. Can be a string or an array of strings.
        - If not specified `template-usage::` property will be used to get default arguments' values.
        - If you need to include template with no arguments: use empty value `[]` or `''`.
    - `lazy`: (optional, default: false) include template, but render it later.
        - Useful for heavy templates. Could be slow for lots of lazy inclusions.
        - Supported only with [render template](reference__commands.md#template-command) command.
- `async include.view(name, args?)`
    - Force inclusion as a view, regardless of the rendering command. It is always lazy.
- `include.inlineView(body, args?)`
    - Force inclusion as an inline view, regardless of the rendering command. It is always lazy.

<!-- tabs:start -->
#### ***Template***
This is ` ``await include('nested')`` `!

#### ***Template «nested»***
` ``c.template.name`` `

#### ***Rendered***
This is nested!
<!-- tabs:end -->


<!-- tabs:start -->
#### ***Template***
Args from usage string: ` ``await include('nested')`` ` \
No args: ` ``await include('nested', [])`` ` \
No args: ` ``await include('nested', '')`` ` \
Explicit args: ` ``await include('nested', ':value ARG')`` ` \
Explicit args: ` ``await include('nested', [':value ARG', ':another TOO'])`` `

#### ***Template «nested»***
```
- template:: nested
  template-usage:: :value USAGE
  - ``c.args.value``
```

#### ***Rendered***
Args from usage string: USAGE \
No args: \
No args: \
Explicit args: ARG \
Explicit args: ARG
<!-- tabs:end -->


<!-- tabs:start -->
#### ***Template***
Buy list: \
` ``{ for (const item of ['apple', 'orange', 'lemon']) { }`` ` \
    → ` ``await include('nested', item)`` ` \
` ``{ } }`` `

#### ***Template «nested»***
` ``c.args.$1.bold()`` `

#### ***Rendered***
Buy list: \
    → **apple** \
    → **orange** \
    → **lemon**
<!-- tabs:end -->



### `layout` :id=nesting-layout
Include another template by it's name. Acts like [`include`](#nesting-include) with the only difference: it preserves outer-template [arg-properties](reference__args.md#arg-properties). Use it to **inherit templates**.

- `async layout(name, args?, lazy?)`
    - See parameters description in [`include`](#nesting-include) section.
- `layout.args(...names)` — used to pass through current arguments to layout template
    - `names`: an array
        - every item could be:
            - the name of an argument
            - positional link to an argument: `$1`, `$2`, etc.
            - argument name and it's value: `[name, value]`
            - object with arguments' names as key and values as values: `{name1: v1, name2: v2, ...}`
        - if unspecified: all arguments will be passed through automatically

<!-- tabs:start -->
#### ***Template «parent»***
```
- template:: parent
  arg-test:: ORIGINAL
  - ``c.args.test``
```

#### ***Template «child»***
```
- template:: child
  arg-test:: OVERRIDED
  - ``await include('parent')``
  - ``await layout('parent')``
  - ``await layout('parent', layout.args('test'))``
  - ``await layout('parent', layout.args(['test', c.args.test]))``
  - ``await layout('parent', layout.args({test: 'COMPUTED'}))``
```

#### ***Rendered***
- ORIGINAL
- OVERRIDED
- USER
- USER
- COMPUTED

<!-- tabs:end -->

?> Another example is [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9#view-for-blocks), in the section «🏛view for blocks»



## `Date constants` :id=section-date-constants

### `time` :id=time
String time in format: `'HH:mm'`. In local timezone.

<!-- tabs:start -->
#### ***Template***
` ``time`` `

#### ***Rendered***
23:32
<!-- tabs:end -->



### `yesterday` :id=yesterday
String yesterday date in ISO format: `'YYYY-MM-DD'`. In local timezone.

<!-- tabs:start -->
#### ***Template***
` ``yesterday`` `

#### ***Rendered***
2023-08-11
<!-- tabs:end -->



### `today` :id=today
String today date in ISO format: `'YYYY-MM-DD'`. In local timezone.

<!-- tabs:start -->
#### ***Template***
` ``today`` `

#### ***Rendered***
2023-08-12
<!-- tabs:end -->



### `tomorrow` :id=tomorrow
String tomorrow date in ISO format: `'YYYY-MM-DD'`. In local timezone.

<!-- tabs:start -->
#### ***Template***
` ``tomorrow`` `

#### ***Rendered***
2023-08-13
<!-- tabs:end -->



## `date`

### `.now` :id=date-now
[Day.js](https://day.js.org) object with now date and time value.

<!-- tabs:start -->
#### ***Template***
Local timezone: ` ``date.now`` (``time``) ` \
UTC: ` ``date.now.toString()`` ` \
UTC ISO: ` ``date.now.toISOString()`` `

#### ***Rendered***
Local timezone: 2023-08-12 Wed (23:23) \
UTC: Wed, 12 Aug 2023 20:23:00 GMT \
UTC ISO: 2023-08-12T20:23:00.000Z
<!-- tabs:end -->

### `.today` :id=date-today
Same as [`date.now`](#date-now), but points to the starts of the day (00:00 in local timezone).

### `.yesterday` :id=date-yesterday
Same as [`date.today`](#date-today), but for yesterday date.

### `.tomorrow` :id=date-tomorrow
Same as [`date.today`](#date-today), but for tomorrow date.



### `.from` :id=date-from
[Day.js](https://day.js.org) object builder. See whole documentation section [here](https://day.js.org/docs/en/parse/parse) for details.

<!-- tabs:start -->
#### ***Template***
Timezone: ` ``date.from.tz.guess()``, ``date.from().offsetName()`` ` \
` ``date.from('2024').toISOString()`` ` \
` ``date.from('2024-08').toISOString()`` ` \
` ``date.from('2024-08-12').toISOString()`` ` \
` ``date.from('12|08|2024 (23h)', 'DD|MM|YYYY (HH[h])').toISOString()`` ` — escaping with `[]` for `h`

#### ***Rendered***
Europe/Minsk, GMT+3 \
2023-12-31T21:00:00.000Z \
2024-07-31T21:00:00.000Z \
2024-08-11T21:00:00.000Z \
2024-08-12T20:00:00.000Z — escaping with `[]` for `h`
<!-- tabs:end -->



### `.fromJournal` :id=date-from-journal
Conversion from Logseq internal date format (e.g. `20240820`) to [Day.js](https://day.js.org) object.

<!-- tabs:start -->
#### ***Template***
` ``date.fromJournal(20240820).toISOString()`` `

#### ***Rendered***
2024-08-20T21:00:00.000Z
<!-- tabs:end -->


### `.nlp` :id=date-nlp
Getting dates via natural language processing.

`date.nlp(query, moment = 'now')`
- `query`: string representation of NLP date
- `moment`: zero point to base relative dates on (default: `'now'`)
    - Use `'page'` to set relative moment to current journal's day
        - Acts like `'now'` if page is not a journal page
    - To set any custom moment use:
        - String in ISO format (e.g `'2020-01-01'`)
        - Dayjs object (e.g. `date.tomorrow`). See [*date.from*](#date-from) for details

?> Could be used implicitly with [` ``@...`` `](reference__syntax.md#dates-nlp-syntax) syntax

<!-- panels:start -->
<!-- div:left-panel -->
Equivalent of `<% in two days %>`:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
- Standard Logseq syntax: `<% in two days %>`
- Plugin syntax: ` ``[ date.nlp('in two days') ]`` `
- Shorthand syntax: ` ``@in two days`` `

#### ***Rendered***
- Standard Logseq syntax: [[2023-08-12 Sat]]
- Plugin syntax: [[2023-08-12 Sat]]
- Shorthand syntax: [[2023-08-12 Sat]]
<!-- tabs:end -->


<!-- div:left-panel -->
Changing the relative moment:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Tomorrow: ` ``[ date.nlp('in two days', date.yesterday) ]`` ` \
The next day after date: ` ``[ date.nlp('tomorrow', '2020-01-01') ]`` `

#### ***Rendered***
Tomorrow: [[2023-08-13 Sun]] \
The next day after date: [[2020-01-02 Thu]]
<!-- tabs:end -->


<!-- div:left-panel -->
In journal page `[[2020-01-01]]`:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Next journal page: ` ``[ date.nlp('tomorrow', 'page') ]`` `

#### ***Rendered***
Next journal page: [[2020-01-02 Thu]]
<!-- tabs:end -->

<!-- panels:end -->



## `query.pages`

?> See the separate page for details: [Query language → Pages](reference__query_language.md#ql-pages)



## `query.blocks`

?> See the separate page for details: [Query language → Blocks](reference__query_language.md#ql-blocks)



## `query.refs`

### `.count` :id=query-refs-count
Count the linked references for current or specified page.

`query.refs.count(name?) → number`

<!-- tabs:start -->
#### ***Template***
For current page: ` ``query.refs.count()`` ` \
For «books» page: ` ``query.refs.count('books')`` `

#### ***Rendered***
For current page: 13 \
For «books» page: 171

<!-- tabs:end -->



### `.journals` :id=query-refs-journals
Get the linked *journal* references for current or specified page in **descending** order.
Second boolean argument is for getting properties of reference block.

`query.refs.journals(name?) → array of page journal days (dayjs objects)`
`query.refs.journals(name, true) → array of objects with:` \
    `.day (dayjs object)` \
    `.name (journal name)` \
    `.props (properties and its values)`

<!-- tabs:start -->
#### ***Template***
```javascript
query.refs.journals('books')
    .map((day) => day.toPage())
    .join('\n')
```

#### ***Rendered***
2024-01-31 Wed \
2023-12-09 Sat \
2023-06-26 Mon \
2022-12-28 Wed

<!-- tabs:end -->



### `.pages` :id=query-refs-pages
Get the linked *non-journal* references for current or specified page.
Second boolean argument is for getting properties of reference block.

`query.refs.pages(name?) → array of page names`
`query.refs.pages(name, true) → array of objects with:` \
    `.name (page name)` \
    `.props (properties and its values)`

<!-- tabs:start -->
#### ***Template***
` ``query.refs.pages('books').join('\n')`` `

#### ***Rendered***
Library \
My Books \
UX Crash Course \
CS 501

<!-- tabs:end -->



## `dev`

### `.uuid` :id=dev-uuid
Generate random UUID identifier.

`dev.uuid(shortForm? = false)`
- `shortForm`: (optional) use 11-digit form instead of long 32-digit one (default: false)

<!-- tabs:start -->
#### ***Template***
` ``dev.uuid()`` ` \
` ``dev.uuid(true)`` `

#### ***Rendered***
915aa8bd-5e44-4fc7-a39b-0f0ba28191f7 \
ped5xte85rg

<!-- tabs:end -->


### `.dump` :id=dev-dump
Dumps and prettifies any JavaScript value

<!-- tabs:start -->
#### ***Template***
` ``dev.dump(["Emphasis", [["Bold"], [["Plain", "text"]]]])`` `

#### ***Rendered***
```javascript
[
  "Emphasis",
  [
    ["Bold"],
    [["Plain", "text"]]
  ]
]
```
<!-- tabs:end -->


### `.parseMarkup` :id=dev-parse-markup
Parses any Logseq markup to special AST representation.

`dev.parseMarkup(markup) → array of AST nodes`
- `markup`: string with Logseq markup

<!-- tabs:start -->
#### ***Template***
` ``dev.parseMarkup('*text* [[link]]')`` `

#### ***Rendered***
```javascript
[
  [
    "Emphasis",
    [
      ["Italic"],
      [["Plain", "text"]]
    ]
  ],
  ["Plain", " "],
  [
    "Link",
    {
      "url": ["Page_ref", "link"],
      "label": [["Plain", ""]],
      "full_text": "[[link]]",
      "metadata": "",
      "interpolation": ""
    }
  ]
]
```
<!-- tabs:end -->


### `.toHTML` :id=dev-to-html
Compiles any Logseq markup to HTML.

`dev.toHTML(markup)`
- `markup`: string with Logseq markup

<!-- tabs:start -->
#### ***Template***
` ``dev.toHTML('*text* [[link]]')`` `

#### ***Rendered***
```html
<i>text</i>
<span data-ref="link" class="page-reference">
    <span class="text-gray-500 bracket">[[</span>
    <div style="display: inline;">
        <a class="page-ref"
           data-ref="link"
           data-on-click="clickRef"
        >link</a>
    </div>
    <span class="text-gray-500 bracket">]]</span>
</span>
```
<!-- tabs:end -->

?> Another example of usage is [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9#view-for-blocks)


### `.asset` :id=dev-asset
Expands full file path to the asset.

`dev.asset(name)`
- `name`: the name of the asset or the logseq-like link to it


<!-- tabs:start -->
#### ***Template***
- ` ``dev.asset('../assets/image.png')`` `
- ` ``dev.asset('image.png')`` `
- ` ``dev.asset('assets://image.png')`` `
- ` ``dev.asset('file:///Users/<USER>/Documents/MyGraph/assets/image.png')`` `

<!--  -->
#### ***Rendered***
- `file:///Users/<USER>/Documents/MyGraph/assets/image.png`
- `file:///Users/<USER>/Documents/MyGraph/assets/image.png`
- `file:///Users/<USER>/Documents/MyGraph/assets/image.png`
- `file:///Users/<USER>/Documents/MyGraph/assets/image.png`
<!-- tabs:end -->

?> Another example of usage is [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9#view-for-blocks)


### `.color` :id=dev-color
Convert color to CSS value. It is helpful for retrieving CSS color values from template properties.

`dev.color(hex)`

<!-- tabs:start -->
#### ***Template***
```
- template:: test
  arg-color:: fff
    - `dev.color(c.args.color)`
```

#### ***Rendered***
`#fff`
<!-- tabs:end -->


### `.get` :id=dev-get
Retrieves values by following a specified path in the provided object. Helpful for parametrizing templates.

`dev.get(path, obj? = c)`
- `path`: a string representing the path to access the value.
    - Can contain attribute names separated by dots `.`.
    - It can also include `@` followed by the property name to access the property value.
    - After `@` and the property name, it can contain `.` followed by a numeric index to access the Nth reference inside the property value.
- `obj`: (optional) an object to retrieve the value from (default: context variable `c`)

<!-- tabs:start -->
#### ***Template***
```
- template:: test
    - ``dev.get('page.name')``
    - ``dev.get('.name', c.page)``
    - ``dev.get('.name', c.template)``
```

#### ***Rendered***
```
- Test Page
- Test Page
- test
```
<!-- tabs:end -->

<!-- tabs:start -->
#### ***Template***
```
- template:: test
  arg-value:: VALUE
  refs:: [[link]] to #page
    - ``dev.get('@arg-value', c.template)``
    - ``dev.get('@refs', c.template)``
    - ``dev.get('@refs.all', c.template)``
    - ``dev.get('@refs.1', c.template)``
```

#### ***Rendered***
```
- VALUE
- [[link]] to #page
- [[link]], [[page]]
- [[page]]
```
<!-- tabs:end -->

?> Another example of usage is [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9#view-for-blocks)


### `.links TODO` :id=dev-links
?> Another example of usage is [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9#view-for-blocks)


### `.walkTree TODO` :id=dev-walk-tree
TODO


### `.context.page TODO` :id=dev-context-page
TODO


### `.context.block TODO` :id=dev-context-block
TODO
