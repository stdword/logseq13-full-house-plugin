## `ref` :id=ref

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
The next day after date: [[2020-01-03]]
<!-- tabs:end -->


<!-- div:left-panel -->
In journal page `[[2020-01-01]]`:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Next journal page: ` ``[ date.nlp('tommorow', 'page') ]`` `

#### ***Rendered***
Next journal page: [[2020-01-02]]
<!-- tabs:end -->

<!-- panels:end -->
