## `Query for pages` :id=ql-pages
Retrieve pages information from Logseq in an easy way, *without complex datascript queries*.

Use cases:
- pages with specific title (or namespace)
- pages with specific property presence
- pages with specific property value
- pages with specific property reference

!> This is not a replacement for [Logseq advanced queries](https://docs.logseq.com/#/page/advanced%20queries)! But for a most common operations with pages. \
\
It doesn't support constructing *OR-expressions*, *sorting* and *joins*. This operations can be achieved with pure JavaScript in runtime.

`query.pages()`
- Use it to begin constructing query. Chain additional [filters](#filters) via «.»
- Chaining every filter completely copies the query, so you can assign it to variables. See an example [here](#filter-value).


### **Retrieving results**
Use these getters to retrieve results in different ways.

!> Almost every result getter accepts the `wrap?` argument for wrapping page objects with context wrappings (to be like [`c.page`](reference__context.md#page-context)). Otherwise, it will be Logseq API entities, which have differences in field names. \
To increase performance in handling a large number of pages, specify `wrap? = false`.

#### `.get`
Get an array with all resulted pages objects.

`.get(wrap? = true)`
- `wrap?`: use context wrappings (default: true)

<!-- tabs:start -->
#### ***Template***
- all pages count: `query.pages().get(false).length`
- list of all pages (could be slow):
  `query.pages().get().map((p) => ref(p)).join('\n')`

#### ***Rendered***
- all pages count: 4497
- list of all pages (could be slow): \
  [[logseq]] \
  [[logseq/plugins]] \
  [[logseq/plugins/Full House Templates]] \
  ...

<!-- tabs:end -->


#### `.getFirst`
Get the first one from all resulted pages.

`.getFirst(wrap? = true)`
- `wrap?`: use context wrappings (default: true)

<!-- tabs:start -->
#### ***Template***
The first page in my graph: ` ``[query.pages().getFirst()]`` `

#### ***Rendered***
The first page in my graph: [[logseq]]

<!-- tabs:end -->


#### `.getNames`
Get only names of all resulted pages.

`.getNames()`

<!-- tabs:start -->
#### ***Template***
List of all page names: \
`query.pages().getNames().join('\n')`

#### ***Rendered***
List of all page names: \
logseq \
logseq/plugins \
logseq/plugins/Full House Templates \
...

<!-- tabs:end -->


#### `.getRandom` & `.getSample`
Get random pages selected from all resulted pages.

- `.getRandom(wrap? = true)`
    -  Get one random page object
    - `wrap?`: use context wrappings (default: true)
- `.getSample(count, wrap? = true)`
    -  Get several random page objects (a sample)
    - `count`: size of the random pages sample
    - `wrap?`: use context wrappings (default: true)

<!-- tabs:start -->
#### ***Template***
- What to read next: \
  ` ``[query.pages().tags('book').noTags(['✅', '❌']).getRandom()]`` `
- Random finished books: \
  ` ``query.pages().tags(['book', '✅']).getSample(3).map((p) => ref(p)).join('\n')`` `

#### ***Rendered***
- What to read next: [[logseq/plugins/Full House Template/Documentation]]
- Random finished books: \
  [[Sönke Ahrens — How to Take Smart Notes]] \
  [[Tiago Forte — Building a Second Brain]] \
  [[Logseq Documentation]]

<!-- tabs:end -->



### **Examples**

?> Examples below will be in the short form for easy visual perception. Use full form to get them work in Logseq. \
The short form: `.get().length` \
The full form with inline 🏛️view: `{{renderer :view, "query.pages().get().length"}}`

<!-- tabs:start -->
#### ***Template***
- `query.pages().get().length` — all pages count
- `query.pages().namespace('logseq').get().length` — pages count in «logseq» namespace

#### ***Rendered***
- 4497 — all pages count
- 16 — pages count in «logseq» namespace

<!-- tabs:end -->

<!-- tabs:start -->
#### ***Template***
- `query.pages().getNames()` — all pages names
- `query.pages().get()` — all page meta-info
- `query.pages().getRandom()` — get random page
- `query.pages().getNames().map((n) => ref(n)).join('\n')` — the clickable list of all pages

#### ***Rendered***
- ```javascript
['logseq', 'Course about Logseq', ...]
```
- ```javascript
[
    {id: 11320, uuid: '64d...', name: 'logseq', ...},
    {id: 11524, uuid: '1a4...', name: 'Course about Logseq', ...},
    ...
]
```
- ```javascript
{id: 5213, uuid: 'b04...', name: 'logseq/plugins', ...}
```
- ```
  [[logseq]]
  [[Course about Logseq]]
  [[logseq/plugins]]
  ...
  ```

<!-- tabs:end -->

<!-- tabs:start -->
#### ***Template***
- `.property('year').get().length` — with «year» property
    - `.property('year').empty().get().length` — and empty value
    - `.property('year').nonEmpty().get().length` — and non-empty value
- `.noProperty('year').get().length` — without «year» property

#### ***Rendered***
- 325 — with «year» property
    - 241 — and empty value
    - 84 — and non-empty value
- 723 — without «year» property

<!-- tabs:end -->


<!-- tabs:start -->
#### ***Template***
- Pages tagged as «book» and missing «category» property:
  ```javascript
    query.pages()
        .property('tags')
            .reference('book')
        .noProperty('category')
        .getNames()
  ```
- Pages tagged as «book» and empty «category» property:
  ```javascript
    query.pages()
        .tags('book')
        .property('category')
            .empty()
        .getNames()
  ```
- Pages tagged as «book» and «✅», but not tagged as «❌»:
  ```javascript
    query.pages()
        .tags(['book', '✅'])
        .noTags('❌')
        .getNames()
  ```

<!-- tabs:end -->

<!-- tabs:start -->
#### ***Template***
- Value of «year» property of pages tagged as «book» only (no other tags), with «year» property contained range of years:
  ```javascript
    query.pages()
        .tags('book', true)
        .property('year')
            .value('regexp', '\\d+-\\d+')
        .get(false)
        .map((p) => p.properties.year)
        .join('\n')
  ```
- Sorted & unique years from the pages tagged as «book», with «rating» property greater than two stars:
  ```javascript
    query.pages()
        .property('rating')
            .value('>', '⭐️⭐️')
        .get(false)
        .map((p) => p.properties.year)
        .unique()
        .sort()
        .join('\n')
  ```
- Count of pages tagged as «book», with «year» property and value between range of years, grouped by years:
  ```javascript
    var g = query.pages()
        .tags('book')
        .property('year')
            .nonEmpty()
            .integerValue('>', 2000)
            .integerValue('<', 2010)
        .get(false)
        .groupby((p) => p.properties.year)

    Object.entries(g)
        .sort()
        .map(([k, v]) => k + ': ' + v.length)
        .join('\n')
  ```
#### ***Rendered***
- 1947-1977 (набор эссе) \
  1955-1963

- 1969 \
  1995 \
  2002 \
  2006 \
  2018 \
  2020
- 2001: 1 \
  2006: 5 \
  2008: 1 \
  2009: 2 \
  2010: 4

<!-- tabs:end -->


### **Filters** :id=filters

#### `.title`
Filter by page title.

- `.title(value)` — shortcut for `.title('includes', value)`
- `.title(operation, value)`
- `.title(operation, value, false)` — inversion form
    - `operation`: `=`, `!=`, `starts with`, `ends with`, `includes`, `regexp`
    - `value`: filtering operation argument applied to page title

<!-- tabs:start -->
#### ***Template***
- `.title('logseq')`
- `.title('starts with', 'logseq')`
- `.title('starts with', 'logseq').title('!=', 'logseq')`
- `.title('starts with', 'logseq', false)`
- `.title('regexp', 'logseq\\b(?!$)')`

#### ***Rendered***
- Course about Logseq \
  logseq/plugins \
  Logseq

- logseq/plugins \
  Logseq
- logseq/plugins
- Course about Logseq
- logseq/plugins

<!-- tabs:end -->



#### `.namespace` & `.innerNamespace`
Filter by page namespace.

- `.namespace(name)`
- `.namespace(name, false)` — inversion form
    - `name`: *all* pages inside this namespace

+ `.innerNamespace(name)`
+ `.innerNamespace(name, false)` — inversion form
    + `name`: *only* pages *directly* inside this namespace

<!-- tabs:start -->
#### ***Template***
- `.namespace('logseq')`

- `.innerNamespace('logseq')`

- `.namespace('logseq').namespace('logseq/plugins', false)`

#### ***Rendered***
- logseq/plugins \
  logseq/plugins/Full House Template \
  logseq/plugins/Shorten My Links \
  logseq/plugins/Missing Commands \
  Logseq \
  logseq/themes

- logseq/plugins \
  logseq/themes

- Logseq \
  logseq/themes

<!-- tabs:end -->


#### `.property` & `.noProperty` :id=filter-property
Filter by page property.

- `.property(name)`
    - `name`: pages which *have* this property

+ `.noProperty(name)`
    + `name`: pages which *don't have* this property

<!-- tabs:start -->
#### ***Template***
- `.property('year').get().length` — all books
- `.property('year').noProperty('category').get().length` — books which missed a category

#### ***Rendered***
- 325 — all books
- 11 — books which missed a category

<!-- tabs:end -->


#### `.empty` & `.nonEmpty`
Filter by page empty (or non-empty) property value. *Note*: the page may have no property at all or it may have a property with an empty value.

?> This filter must be preceded by [`.property`](#filter-property) as it interacts with property's value

- `.empty()`
- `.nonEmpty()`

<!-- tabs:start -->
#### ***Template***
- `.property('year').get().length` — all books
- `.property('year').empty().get().length` — books with an unset year value
- `.property('year').nonEmpty().get().length` — books with year value

#### ***Rendered***
- 325 — all books
- 241 — books with an unset year value
- 84 — books with year value

<!-- tabs:end -->


#### `.integerValue`
Filter by page property value. *Note*: this filter treats properties values as an integer numbers.

?> This filter must be preceded by [`.property`](#filter-property) as it interacts with property's value

!> Property values could be a mix of integers and strings, which introduces some caveats: \
For `=` and `!=` operations, all string values (including empty strings) will be ignored. \
For other comparison operations, all string values will be considered greater than integer values, and there is no way to filter out string values.

- `.integerValue(value)` — shortcut for `.integerValue('=', value)`
- `.integerValue(operation, value)`
    - `operation`: `=`, `!=`, `>`, `>=`, `<`, `<=`
    - `value`: value to compare to

<!-- tabs:start -->
#### ***Template***
- `.property('year').get().length` — all books
- `.property('year').integerValue('<', 2020).get().length` books published before 2020
    - `.property('year').integerValue('<', 2020).empty().get().length` of them with empty year
- `.property('year').integerValue('>=', 2020).get().length` books published after 2020
    - `.property('year').integerValue('>=', 2020).empty().get().length` of them with empty year

#### ***Rendered***
- 325 — all books
- 71 books published before 2020
    - 0 of them with empty year
- 254 books published after 2020
    - 241 of them with empty year

<!-- tabs:end -->


#### `.value` :id=filter-value
Filter by page property value. *Note*: this filter treats properties values as strings.

?> This filter must be preceded by [`.property`](#filter-property) as it interacts with property's value

!> Note for comparison operations: empty string value is less than any other string

- `.value(value)` — shortcut for `.value('=', value)`
- `.value(operation, value)`
- `.value(operation, value, false)` — inversion form
    - `operation`: `=`, `!=`, `>`, `>=`, `<`, `<=`, `starts with`, `ends with`, `includes`, `regexp`
    - `value`: value to compare to or search of

<!-- tabs:start -->
#### ***Template***
```javascript
``{
var all = query.pages().property('year')
var before2020 = all.value('<', 2020)
var after2020 = all.value('>=', 2020)
_}``

all: ``all.get().length``
before 2020: ``before2020.get().length`` (``before2020.empty().get().length`` empty)
after 2020: ``after2020.get().length`` (``after2020.empty().get().length`` empty)
```

#### ***Rendered***
all: 325 \
before 2020: 315 (241 empty) \
after 2020: 10 (0 empty)

<!-- tabs:end -->


#### `.reference` & `.tags` & `.noTags`
Filter by reference in page property value. *Note*: this filter searches references within properties values. And ignores all other text content.

?> This filter must be preceded by [`.property`](#filter-property) as it interacts with property's value

- `.reference(value)` — shortcut for `.reference('includes', value)`
- `.reference(operation, value)`
- `.reference(operation, value, false)` — inversion form
    - `operation`: `includes` or `includes only`
    - `value`: reference name to compare to or an array of names

+ `.tags(value, only?)` — shortcut for `.property('tags').reference(...)`
+ `.noTags(value, only?)` — inversion form
    + `value`: reference name to compare to or an array of names
    + `only?`: use `includes only` operation instead of `includes` (default: false)

<!-- tabs:start -->
#### ***Template***
```javascript
``{
var books = query.pages().tags('book')
var finished = books.tags('✅')
var best = finished
    .property('rating')
        .reference('includes only', '⭐️⭐️⭐️⭐️⭐️')
_}``

books: ``books.get().length``
finished: ``finished.get().length``
best: ``best.get().length``
```

#### ***Rendered***
books: 542 \
finished: 62 \
best: 13

<!-- tabs:end -->



## `Query for blocks` :id=ql-blocks
TBD
