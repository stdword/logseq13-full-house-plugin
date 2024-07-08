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


## `cursor`
?> See the separate page for details: [Cursor positioning](reference__syntax.md#cursor-positioning)


## `blocks`
### `.spawn` & `.append` :id=blocks-spawn
Creates blocks related to current at runtime. There could be child blocks (*spawned*) and sibling blocks (*appended*).

`blocks.spawn(content, properties?, data?)` — create child block
`blocks.append(content, properties?, data?)` — create sibling block
- `content`: string with block's content
- `properties`: (optional) object with block's properties and it's values
- `data`: (optional) additional setup for the block
    - Currently the only value could be `{cursorPosition: true}`. See example [here](reference__syntax.md#cursor-positioning) for additional details.


`blocks.spawn.tree(node)` — create child tree <br/>
`blocks.append.tree(node)` — create sibling tree
- `node`: object with block's structure representation
    - `content`, `properties`, `data` — same meaning as for [single blocks](#blocks-spawn)
    - `children`: (optional) an array of objects, representing child nodes (with the same structure)

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  blocks.spawn('Hello, Logseq!')
  blocks.spawn('Hello, plugin!', {plugin: 'Full House Templates'})
  blocks.append('The End')
}``
«Hello» block:
```

#### ***Rendered***
- «Hello» block:
    - Hello, Logseq!
    - Hello, plugin! \
      plugin:: Full House Templates
- The End

<!-- tabs:end -->

<!-- tabs:start -->
#### ***Template***
- ```javascript
  ``{
      blocks.spawn.tree({
        content: 'Hello, Logseq!',
        children: [{
            content: 'Hello, plugin!',
            properties: {plugin: 'Full House Templates'},
        }]
      })
  }``
  «Hello» block:
  ```

#### ***Rendered***
- «Hello» block:
    - Hello, Logseq!
        - Hello, plugin! \
          plugin:: Full House Templates

<!-- tabs:end -->
