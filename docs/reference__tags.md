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

## `date.now` :id=date-now
TODO

## `date.yesterday` :id=date-yesterday
TODO

## `date.today` :id=date-today
TODO

## `date.tomorrow` :id=date-tomorrow
TODO

## `date.from` :id=date-from
TODO

## `date.nlp(query, moment = 'now')` :id=date-nlp
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



## `dev.parseMarkup` :id=dev-parse-markup
TODO

## `dev.toHTML` :id=dev-to-html
TODO

## `dev.asset` :id=dev-asset
TODO

## `dev.color` :id=dev-color
TODO

## `dev.links` :id=dev-links
TODO
