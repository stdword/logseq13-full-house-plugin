## `Reference operations` :id=section-refs

### `ref` :id=ref
Make a reference to page (`[[name]]`) or block (`((uuid))`).

?> Could be used implicitly with [` ``[...]`` `](reference__syntax.md#reference-interpolation-syntax) syntax

`ref(obj, label?)`
- `obj` is one of the following items:
    - page name
    - page context
    - block uuid
    - block context
    - dayjs object
    - date ISO string (YYYY-MM-DD)
- `label`: (optional) custom label for the reference

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
` ``['page name']`` `
`ref('the long page name', 'page')`

#### ***Rendered***
[[page name]] \
[[page]]
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

<!-- panels:start -->
<!-- div:left-panel -->
Example:

<!-- div:right-panel -->
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

<!-- panels:end -->



### `embed TODO` :id=embed



## `String operations` :id=section-string

### `empty TODO` :id=empty
TODO

### `when TODO` :id=when
TODO

### `fill TODO` :id=fill
TODO

### `zeros TODO` :id=zeros
TODO

### `spaces TODO` :id=spaces
TODO



## `Nesting templates` :id=section-nesting

### `include` :id=nesting-include
Include another template by name.

`async include(name, ...args?)`
- `name`: template name. Only templates with `template::` property can be included.
- `args`: (optional) arguments for included template. Can be a string or an array.
    - If not specified `template-usage::` property will be used to get default arguments' values.
    - If you need to include template with no arguments: use empty value `[]` or `''`.

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
Include another template by name. Acts like [`include`](#include) with the only difference: it preserves template [arg-properties](reference__args.md#arg-properties). Use it to inherit templates.

`async layout(name, ...args?)`

<!-- tabs:start -->
#### ***Template «parent»***
```
- template:: parent
  arg-value:: ORIGINAL
  - ``c.args.value``
```

#### ***Template «child»***
```
- template:: child
  arg-value:: OVERRIDED
  - ``await include('nested')``
  - ``await layout('nested')``
```

#### ***Rendered***
- ORIGINAL
- OVERRIDED

<!-- tabs:end -->



## `Date constants` :id=section-date-constants

### `time TODO` :id=time
TODO

### `yesterday TODO` :id=yesterday
TODO

### `today TODO` :id=today
TODO

### `tomorrow TODO` :id=tomorrow
TODO



## `date`

### `.now TODO` :id=date-now
TODO

### `.yesterday TODO` :id=date-yesterday
TODO

### `.today TODO` :id=date-today
TODO

### `.tomorrow TODO` :id=date-tomorrow
TODO

### `.from TODO` :id=date-from
TODO

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

<!-- panels:start -->
<!-- div:left-panel -->
Equivalent of `<% in two days %>`:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Standard Logseq syntax: `<% in two days %>` \
Plugin syntax: ` ``[ date.nlp('in two days') ]`` `

#### ***Rendered***
Standard Logseq syntax: [[2023-08-12 Sat]] \
Plugin syntax: [[2023-08-12 Sat]]
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



## `query.refs`

### `.count TODO` :id=query-refs-count
TODO

### `.journals TODO` :id=query-refs-journals
TODO

### `.pages TODO` :id=query-refs-pages
TODO



## `dev`

### `.parseMarkup TODO` :id=dev-parse-markup
TODO

### `.toHTML TODO` :id=dev-to-html
TODO

### `.asset TODO` :id=dev-asset
TODO

### `.color TODO` :id=dev-color
TODO

### `.get TODO` :id=dev-get
TODO

### `.links TODO` :id=dev-links
TODO

### `.walkTree TODO` :id=dev-walk-tree
TODO

### `.context.page TODO` :id=dev-context-page
TODO

### `.context.block TODO` :id=dev-context-block
TODO
