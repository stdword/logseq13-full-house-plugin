## `ref` :id=ref
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
- `label`: custom label for the reference (optional)

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



## `tag` :id=tag
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



## `embed` :id=embed
TODO

## `empty` :id=empty
TODO

## `when` :id=when
TODO

## `fill` :id=fill
TODO

## `zeros` :id=zeros
TODO

## `spaces` :id=spaces
TODO

## `time` :id=time
TODO

## `yesterday` :id=yesterday
TODO

## `today` :id=today
TODO

## `tomorrow` :id=tomorrow
TODO


## `date`
### `.now` :id=date-now
TODO

### `.yesterday` :id=date-yesterday
TODO

### `.today` :id=date-today
TODO

### `.tomorrow` :id=date-tomorrow
TODO

### `.from` :id=date-from
TODO

### `.nlp(query, moment = 'now')` :id=date-nlp
Getting dates via natural language processing.

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

### `.count` :id=query-refs-count
TODO

### `.journals` :id=query-refs-journals
TODO

### `.pages` :id=query-refs-pages
TODO


## `dev`
### `.parseMarkup` :id=dev-parse-markup
TODO

### `.toHTML` :id=dev-to-html
TODO

### `.asset` :id=dev-asset
TODO

### `.color` :id=dev-color
TODO

### `.get` :id=dev-get
TODO

### `.links` :id=dev-links
TODO

### `.walkTree` :id=dev-walk-tree
TODO

### `.context.page` :id=dev-context-page
TODO

### `.context.block` :id=dev-context-block
TODO

