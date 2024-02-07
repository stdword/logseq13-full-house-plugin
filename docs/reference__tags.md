## `ref` :id=ref
TODO

## `bref` :id=bref
TODO

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
- `moment`: moment to base relative dates on (default: `'now'`)
    - Use `'page'` to set relative moment to current journal's day
        - Acts like `'now'` if page is not a journal page
    - To set any custom moment use:
        - String in ISO format: `'2020-01-01'`
        - Dayjs object: `date.tomorrow`

<!-- panels:start -->
<!-- div:left-panel -->
Equivalent of `<% in two days %>`:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Standard Logseq syntax: `<% in two days %>` \
Plugin syntax: ` ``[ date.nlp('in two days') ]`` `

#### ***Rendered***
Standard Logseq syntax: [[2023-08-12]] \
Plugin syntax: [[2023-08-12]]
<!-- tabs:end -->


<!-- div:left-panel -->
Changing the relative moment:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Tomorrow: ` ``[ date.nlp('in two days', date.yesterday) ]`` ` \
The next day after date: ` ``[ date.nlp('tomorrow', '2020-01-01') ]`` `

#### ***Rendered***
Tomorrow: [[2023-08-13]] \
The next day after date: [[2020-01-02]]
<!-- tabs:end -->


<!-- div:left-panel -->
In journal page `[[2020-01-01]]`:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Next journal page: ` ``[ date.nlp('tomorrow', 'page') ]`` `

#### ***Rendered***
Next journal page: [[2020-01-02]]
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

### `.context.page` :id=dev-context-page
TODO

### `.context.block` :id=dev-context-block
TODO
