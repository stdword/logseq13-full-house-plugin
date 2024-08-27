## `cursor`
?> See the separate page for details: [Cursor positioning](reference__syntax.md#cursor-positioning)



## `blocks`

### `.edit` :id=blocks-edit
Gets the selected blocks or the currently edited one with the last refreshed content.

`async blocks.edit(uuid, selectionPositions)` — returns list of block objects
- `uuid`: UUID of the block to edit
- `selectionPositions`: cursor position or selection of the block's content


<!-- tabs:start -->
#### ***Template***
- ` ``{ await blocks.edit(c.block.uuid, [-1]) }`` `
- ` ``{ await blocks.edit(c.block.uuid, [7, 11]) }`` `

#### ***Block***
- Hello, USER!

#### ***Block after rendering***
- Hello, USER <b>|</b> !
- Hello, <mark>USER</mark>!

<!-- tabs:end -->



### `.selected` :id=blocks-selected
Gets the selected blocks or the currently edited one with the last refreshed content.

`async blocks.selected(options)` — returns list of block objects
- `options`: object with options
  - `treatSingleBlockAsChildrenList`: (optional) when only one block is selected, get it's children instead (default: false)


<!-- tabs:start -->
#### ***Template***
- ` ``(await blocks.selected()).map(b => b.content)`` `
- ` ``(await blocks.selected({treatSingleBlockAsChildrenList: true})).map(b => b.content)`` `

#### ***Blocks***
```
- Parent block
  - item 1
  - item 2
  - item 3
```

#### ***Rendered for the 1st block***
- `Parent block`
- `item 1, item 2, item 3`

<!-- tabs:end -->



### `.skip` :id=blocks-skip
Prevents block or it's children or both from being rendered.

`blocks.skip(options)` — create sibling block
- `options`: object with options
  - `self`: (optional) skip current block content? (default: true)
  - `children`: (optional) skip current block's children? (default: false)

<!-- tabs:start -->
#### ***Template***
- We want to keep selected text (in edit mode) \
  OR whole block content (in blocks selection mode)
  \
  ` ``{ blocks.skip() }`` `
  - Visible block

#### ***Rendered***
- Original block content
  - Visible block

<!-- tabs:end -->

<!-- tabs:start -->
#### ***Template***
- This block will be rendered only in editing mode
  ```javascript
  ``{
    if ( !(await logseq.Editor.checkEditing()) )
        blocks.skip({children: true})
  }``
  ```
  - And this one too
- But not this one

#### ***Rendered (editing mode)***
- This block will be rendered only in editing mode
  - And this one too
- But not this one

#### ***Rendered (selection mode)***
- But not this one

<!-- tabs:end -->



### `.spawn` & `.append` :id=blocks-spawn
Creates blocks related to current at runtime. There could be child blocks (*spawned*) and sibling blocks (*appended*).

`blocks.spawn(content, properties?, data?)` — create child block
`blocks.append(content, properties?, data?)` — create sibling block
- `content`: string with block's content
- `properties`: (optional) object with block's properties and it's values
- `data`: (optional) additional setup for the block. Object with keys:
    - `cursorPosition: true` to set cursor position. See example [here](reference__syntax.md#cursor-positioning) for additional details.
    - `setUUID: '669958b1-ade...'` to set UUID for the future block. See example [here](#blocks-uuid) for additional details.


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



### `.uuid` :id=blocks-uuid
Gets the UUID of future block (after template insertion).

`blocks.uuid()` — return UUID string

<!-- tabs:start -->
#### ***Template***
```
- template:: test
  - A ``{ var uuid = blocks.uuid() }``
  - B with ref to A: ``[uuid]``
```

#### ***Rendered***
```
- A
  id:: 66995bfb-1891-47fa-95a6-39d9539ad42d
- B with ref to A: ((66995bfb-1891-47fa-95a6-39d9539ad42d))
```

<!-- tabs:end -->

To get the UUID of [spawned blocks](#blocks-spawn), use *setUUID* parameter and [`dev.uuid`](reference__tags_dev.md#dev-uuid) template tag:

<!-- tabs:start -->
#### ***Template***
- ```javascript
  ``{
      const uuid = dev.uuid()
      blocks.spawn('Hello, Logseq!', null, {setUUID: uuid})
  }``
  ```
- ```javascript
  ``{
      const uuid = dev.uuid()
      blocks.spawn.tree({
        content: 'Hello, Full House Templates!',
        data: {setUUID: uuid},
      })
  }``
  ```

<!-- tabs:end -->



### <span style="font-weight: 550">`.actions`</span> :id=blocks-actions

?> There is no need to use templates to render content when working with actions, so every action disables whole tree rendering (via [`blocks.skip`](#blocks-skip)) by default (see the `skipTree` option).

#### `.update` :id=blocks-actions-update
Update multiple blocks at once in different ways.

`async blocks.actions.update(callback, options)`
- `callback`: function called for every block with arguments:
  - `contentWithoutProperties`: block's content without properties
  - `properties`: block's properties
  - `level`: level # started with 0
  - `block`: block object
  - `data`: custom data to work with
  - `→`: returns:
    - nothing (to left content intact)
    - string with new content
    - pair: [new content, new properties]
- `options`: object with optional keys:
  - `skipTree`: turn rendering off (default: true),
  - `blocks`: list of blocks's UUIDs or block objects (default: auto-filled with current blocks selection),
  - `recursive`: walk through whole block structure (default: false),
  - `useMinimalUndoActions`: (default: true)
    - try to use blocks bulk insertion and removal if possible
    - only for recursive mode

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  await blocks.actions.update(async (content) => {
      return content + ' #card'
  }, {blocks: await blocks.selected({treatSingleBlockAsChildrenList: true})})
}``
```

#### ***Blocks***
```
- Cards block
  - item 1
  - item 2
  - item 3
```

#### ***Rendered for the 1st block***
```
- Cards block
  - item 1 #card
  - item 2 #card
  - item 3 #card
```

<!-- tabs:end -->



## `parse`

### `.cleanMarkup` :id=clean-markup
Clean any Logseq markup to leave only text.

`parse.cleanMarkup(markup, options?)` → cleaned text string
- `markup`: string with Logseq markup
- `options`: (optional) object with options:
  - `cleanRefs`: should brackets be cleaned for page references and hash signs for tags and link syntax for links, or should they be left as they are? (default: false)
  - `cleanLabels`: should labels be cleaned, or should references be replaced by them? (default: false)

<!-- tabs:start -->
#### ***Template***
- ` ``parse.cleanMarkup('*text* [[link]]')`` `
- ` ``parse.cleanMarkup('*text* [[link]]', {cleanRefs: true})`` `

#### ***Rendered***
- `text [[link]]`
- `text link`
<!-- tabs:end -->

<!-- tabs:start -->
#### ***Template***
- ` ``parse.cleanMarkup('[**label**](https://google.com)')`` `
- ` ``parse.cleanMarkup('[**label**](https://google.com)', {cleanLabels: true})`` `
- ` ``parse.cleanMarkup('[**label**](https://google.com)', {cleanLabels: true, cleanRefs: true})`` `

#### ***Rendered***
- `[label](https://google.com)`
- `[https://google.com](https://google.com)`
- `https://google.com`
<!-- tabs:end -->



### `.links` :id=parse-links
Retrieves links from the page or the particular block structure.

`async parse.links(text, withLabels?)` → array of links or array of pairs [link, label]
- `text`: text string with links in form `http://site.com` or `[Label](http://site.com)`
- `withLabels`: (optional) should labels be included to returned array or not? (default: false)

<!-- tabs:start -->
#### ***Template***
- ` ``await parse.links('Which one to use: https://google.com or https://duckduckgo.com?')`` `
- ` ``await parse.links('May be [Google](https://google.com)?', true)`` `
- ` ``await parse.links('No! https://duckduckgo.com', true)`` `

#### ***Rendered***
- ```javascript
['https://google.com', 'https://duckduckgo.com']
```
- ```javascript
[ ['https://google.com', 'Google'] ]
```
- ```javascript
[ ['https://duckduckgo.com', 'https://duckduckgo.com'] ]
```
<!-- tabs:end -->



### <span style="font-weight: 550">`.refs`</span> :id=parse-refs
Retrieves references from the page or the particular block structure.

There are several types of references:
- **block** references: `((44563ff-6467-...))` or `[label](((44563ff-6467-...)))`
- **page** references: `[[research papers]]` or `[label]([[research papers]])`
- **tag** references: `#note` (logseq doesn't support labels for tags)

`async parse.refs(text, withLabels?, only?)` → array of references or pairs [ref, label]
- `text`: text string with references
- `withLabels`: (optional) should labels be included to returned array or not? (default: false)
- `only`: (optional) an array with references types to include to result (default: [] — include all)

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  var text = '#note for [current](((44563ff-6467-...))) [[research papers]]'

  out(await parse.refs(text))
  out(await parse.refs(text, true))
  out(await parse.refs(text, false, ['tag']))
}``
```

#### ***Rendered***
- ```javascript
[
    ['tag', 'note'],
    ['block', '44563ff-6467-...'],
    ['page', 'research papers'],
]
```
- ```javascript
[
    ['tag', 'note', ''],
    ['block', '44563ff-6467-...', 'current'],
    ['page', 'research papers', ''],
]
```
- ```javascript
[ ['tag', 'note'] ]
```
<!-- tabs:end -->



#### `.blocks` :id=parse-refs-blocks
Retrieves **blocks** references from the text.

`async parse.refs.blocks(text, withLabels?)`
- Returns the same data as `parse.refs(text, withLabels?, ['block'])`.
- Except for the redundant reference type.

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  var text = '#note for [current](((44563ff-6467-...))) [[research papers]]'

  out(await parse.refs.blocks(text))
  out(await parse.refs.blocks(text, true))
}``
```

#### ***Rendered***
- ```javascript
[ '44563ff-6467-...' ]
```
- ```javascript
[ ['44563ff-6467-...', 'current'] ]
```
<!-- tabs:end -->



#### `.pages` :id=parse-refs-pages
Retrieves **pages** and **tags** references from the text.

`async parse.refs.pages(text, withLabels?)`
- Returns the same data as `parse.refs(text, withLabels?, ['page', 'tag'])`.
- Except for the redundant reference type.

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  var text = '#note for [current](((44563ff-6467-...))) [[research papers]]'

  out(await parse.refs.pages(text))
  out(await parse.refs.pages(text, true))
}``
```

#### ***Rendered***
- ```javascript
[ 'note', 'research papers' ]
```
- ```javascript
[
    ['note', ''],
    ['research papers', ''],
]
```
<!-- tabs:end -->



#### `.pagesOnly` :id=parse-refs-pages-only
Retrieves **pages** references from the text.

`async parse.refs.pagesOnly(text, withLabels?)`
- Returns the same data as `parse.refs(text, withLabels?, ['page'])`.
- Except for the redundant reference type.

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  var text = '#note for [current](((44563ff-6467-...))) [[research papers]]'

  out(await parse.refs.pagesOnly(text))
  out(await parse.refs.pagesOnly(text, true))
}``
```

#### ***Rendered***
- ```javascript
[ 'research papers' ]
```
- ```javascript
[
    ['research papers', ''],
]
```
<!-- tabs:end -->



#### `.tagsOnly` :id=parse-refs-tags-only
Retrieves **tags** references from the text.

`async parse.refs.tagsOnly(text)`
- Returns the same data as `parse.refs(text, false, ['tag'])`.
- Except for the redundant reference type.

<!-- tabs:start -->
#### ***Template***
` ``await parse.refs.tagsOnly('#note for [current](((44563ff-6467-...))) [[research papers]]'))`` `

#### ***Rendered***
- ```javascript
[ 'note' ]
```
<!-- tabs:end -->



## `query`

### `.pages`
?> See the separate page for details: [Query language → Pages](reference__query_language.md)


### `.blocks`
?> See the separate page for details: [Query language → Blocks](reference__query_language__blocks.md)


### `.table`
?> See the separate page for details: [Query language → Table View](reference__query_language__table.md)



### <span style="font-weight: 550">`.refs`</span>

#### `.count` :id=query-refs-count
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



#### `.journals` :id=query-refs-journals
Get the linked *journal* references for current or specified page in **descending** order.

- `query.refs.journals(name?)` → array of journal days (dayjs objects)
- `query.refs.journals(name, true)` → array of objects:
    - `.day`: dayjs object
    - `.name`: journal name
    - `.props`: properties of referencing block

<!-- tabs:start -->
#### ***Template***
- ```javascript
  query.refs.journals('books')
    .map((day) => day.toPage())
    .join('\n')
  ```
- ```javascript
  dev.dump(
    query.refs.journals('books', true)
  )
  ```

#### ***Rendered***
- 2024-01-31 Wed \
  2023-12-09 Sat \
  2023-06-26 Mon \
  2022-12-28 Wed
- ```javascript
  [
    {
        "day": "2024-01-30T21:00:00.000Z",
        "name": "2024-01-31 Wed",
        "props": {
            "source": "https://..."
        }
    },
    {
        "day": "2023-12-08T21:00:00.000Z",
        "name": "2023-12-09 Sat",
        "props": {}
    },
    ...
  ]
  ```
<!-- tabs:end -->



#### `.pages` :id=query-refs-pages
Get the linked *non-journal* references for current or specified page.

- `query.refs.pages(name?)` → array of page names
- `query.refs.pages(name, true)` → array of objects:
    - `.name`: page name
    - `.props`: properties of referencing block (see the example for [`query.refs.journals`](#query-refs-journals))

<!-- tabs:start -->
#### ***Template***
` ``query.refs.pages('books').join('\n')`` `

#### ***Rendered***
Library \
My Books \
UX Crash Course \
CS 501

<!-- tabs:end -->
