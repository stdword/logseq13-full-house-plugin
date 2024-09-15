## `sleep` :id=sleep
System wait for a specified milliseconds.

`async sleep(ms)`
- `ms`: milliseconds (number) to sleep

<!-- tabs:start -->
#### ***Template***
` ``{ await sleep(20) }`` `

<!-- tabs:end -->



## `dev`

### `.uuid` :id=dev-uuid
Generate random UUID identifier.

`dev.uuid(shortForm? = false, forBlock? = false)`
- `shortForm`: (optional) use 11-digit form instead of long 32-digit one (default: false)
- `forBlock`: (optional) check for existed blocks & pages UUID before (default: false)

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

`dev.parseMarkup(markup)` → array of AST nodes
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


### `.compileMarkup` :id=dev-compile-markup
Compiles Logseq AST representation to HTML.

`dev.compileMarkup(nodes)` → HTML string
- `nodes`: array of AST nodes

<!-- tabs:start -->
#### ***Template***
```javascript
// AST for "*text* [[link]]"
dev.compileMarkup([
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
])
```

#### ***Rendered***
```html
<i>text</i> <span data-ref="link" class="page-reference">
  <span class="text-gray-500 bracket">[[</span>
  <div style="display: inline;">
    <a class="page-ref" data-ref="link" data-on-click="clickRef">link</a>
  </div>
  <span class="text-gray-500 bracket">]]</span>
</span>
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
Convert color from any CSS value to hex format. It is helpful for retrieving CSS color values from template properties.

`dev.color(value)`
- `value`: a string representation of any CSS color value

<!-- tabs:start -->
#### ***Template***
- `dev.color('fff')`
- `dev.color('rgb(128, 128, 128)')`
- `dev.color('hsl(256, 30%, 50%)')`

#### ***Rendered***
- `#fff`
- `#808080`
- `#6e59a6`

<!-- tabs:end -->



### `.cssVars` :id=dev-css-vars
Get the CSS variables values.

`dev.cssVars(names)`
- `names`: array of string with full CSS variable names

<!-- tabs:start -->
#### ***Template***
` ``dev.cssVars(['--ls-primary-text-color'])`` `

#### ***Template***
`hsl(27, 20%, 52%)`

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



### `.links` :id=dev-links
This is synchronous text-only version of the [`parse.links`](reference__tags_advanced.md#parse-links) template tag. Use it instead.



### <span style="font-weight: 550">`.refs`</span> :id=dev-refs
This is synchronous text-only version of the [`parse.refs`](reference__tags_advanced.md#parse-refs) template tag. Use it instead.


#### `.blocks`
This is synchronous text-only version of the [`parse.refs.blocks`](reference__tags_advanced.md#parse-refs-blocks) template tag. Use it instead.


#### `.pages`
This is synchronous text-only version of the [`parse.refs.pages`](reference__tags_advanced.md#parse-refs-pages) template tag. Use it instead.


#### `.pagesOnly`
This is synchronous text-only version of the [`parse.refs.pagesOnly`](reference__tags_advanced.md#parse-refs-pages-only) template tag. Use it instead.


#### `.tagsOnly`
This is synchronous text-only version of the [`parse.refs.tagsOnly`](reference__tags_advanced.md#parse-refs-tags-only) template tag. Use it instead.



### <span style="font-weight: 550">`.tree`</span>

#### `.walk` & `.walkAsync` :id=dev-walk-tree
Walks through whole tree structure. Helpful for working with Logseq API.

Every node in blocks tree should contain two attributes:
- `content`: string with block's content
- `children`: array of child nodes with it's own `content` and `children`

---

- `dev.tree.walk(root, callback)`
  - Works synchronously in Top-to-Bottom traversal order
  - `root`: the start node of tree
  - `callback(node, level, path)`: function returning boolean or void
    - `node`: (object) current visiting node of tree
    - `level`: (number) current level of blocks (root is always at the zero level)
    - `path`: (array of numbers) current path to node
    - The returning boolean value controls whether walking should be stopped (true) or not (false or no value returned)

- `async dev.tree.walkAsync(root, callback)`
  - Asynchronous version with concurrent traversal order
  - There is no way to stop execution
  - Arguments are the same as in synchronous version

<!-- tabs:start -->
#### ***Template***
```javascript
``{
    var tree = await logseq.Editor.getBlock(c.template.block.uuid, {includeChildren: true})
    let count = 0
    dev.tree.walk(tree, (b) => count++)
}``
Total blocks: ``count``
```

#### ***Rendered***
Total blocks: 2
<!-- tabs:end -->



#### `.getNode` :id=dev-tree-get-node
Walks through whole tree structure. Helpful for working with Logseq API.

- `dev.tree.getNode(root, path)` → node object according to `path` or null
  - `root`: the start node of tree
  - `path`: array of numbers representing path to certain tree node

<!-- tabs:start -->
#### ***Template***
````javascript
- template:: test
  - ```javascript
    ``{
        var tree = await logseq.Editor.getBlock(c.template.block.uuid, {includeChildren: true})
        dev.tree.getNode(tree, [0, 1])
    }``
    ```
    - Some text
    - the Node
````

#### ***Rendered***
```javascript
{
  "uuid": "668c593f-9b...",
  "content": "the Node",
  ...
}
```

<!-- tabs:end -->



#### `.syncRaw` :id=dev-tree-sync-raw
Sync custom blocks tree with specified block's structure.
Helpful for creating **live views**.

- `dev.tree.syncRaw(blocks, uuid, callbacks)`
  - `blocks`: list of `IBatchNode` blocks (in memory)
  - `uuid`: string with UUID of block to sync structure with (in storage)
  - `callbacks`: callbacks for different situations during sync
    - `flattern`: `boolean` flag for ignoring tree structure
    - `nodeIdentity(node: IBatchBlock, contentWithoutProps: string) => string`
      - hash function for a sync process
      - empty string means node will be ignored
    - `removedIdentity(node: IBatchBlock, contentWithoutProps: string) => string`
      - hash function for removed nodes (in case of it's existance) to restore them
      - empty string means node will be ignored
    - `async onInsert(path: number[], idnode: [hash, IBatchBlock], toIdNodes: [hash, IBatchBlock][])`
      - could be used to modify inserted node
      - can return `boolean` to prevent insertion
      - can return `number` to indicate where to insert new node: -1 means to the end
    - `async onAppend(path: number[], idnodes: [hash, IBatchBlock][], toIdNode: [hash, IBatchBlock] | null)`
      - could be used to modify appended node
      - empty `toIdNode` means the very top (root) level
      - can return `boolean` to prevent appending
    - `async onRemove(path: number[], idnode: [hash, IBatchBlock])`
      - could be used to modify removing node
      - can return `boolean` to prevent removing
    - `async onRestore(path: number[], idnode: [hash, IBatchBlock])`
      - could be used to modify restored node
      - can return `boolean` to prevent restoration


<!-- tabs:start -->
#### ***Source block***
- source
  - #link1
  - #link2
  - #link3

#### ***Template***
````javascript
- template:: test
  - ```javascript
    ``{
      const src = await logseq.Editor.getBlock('66e5c698-183...', {includeChildren: true})
      dev.tree.sync(
        src.children ?? [],
        c.block.uuid,
        {
          nodeIdentity: (node, content) => content.startsWith('#') ? content : '',
        },
      )
    }``
    synced
    ```
````

#### ***Before view rendering***
- `{{renderer :template-view, test}}`

#### ***After view rendering***
- synced
  - #link1
  - #link2
    - here could be any user text that will be preserved over view renderings
  - #link3

<!-- tabs:end -->



#### `.sync` :id=dev-tree-sync
Sync custom blocks tree with specified block's structure **with tracking changes**.
Helpful for creating **live views**.

- `dev.tree.sync(blocks, uuid, callbacks)`
  - `blocks`: list of `IBatchNode` blocks (in memory)
  - `uuid`: string with UUID of block to sync structure with (in storage)
  - `options`: callbacks for different situations during sync
    - `flattern`: `boolean` flag for ignoring tree structure
    - `nodeIdentity(node: IBatchBlock, contentWithoutProps: string) => string`
      - hash function for a sync process
      - empty string means node will be ignored
    - `newPrefix`: marker for just created blocks (default: 🆕)
    - `removedPrefix`: marker for just removed blocks (default: ❌)


?> See the great example of usage: [*Live Namespace View*](https://github.com/stdword/logseq13-full-house-plugin/discussions/55)



### <span style="font-weight: 550">`.context`</span>

#### `.page` :id=dev-context-page
Conversion from Logseq API page format to plugin's format. Helpful for working with [queries](reference__query_language.md).

`dev.context.page(entity)`
- `entity`: page object from Logseq API

<!-- tabs:start -->
#### ***Template***
```javascript
``{
    const page = await logseq.Editor.getPage(c.page.uuid)
    out(dev.context.page(page))
  }``
```

#### ***Rendered***
```javascript
{
  "id": 33271,
  "uuid": "668d19fe-0df5-4224-9a4f-d2eb67c44237",
  "name": "logseq/plugins/Full House Templates",
  "name_": "logseq/plugins/full house templates",
  "namespace": {
    "parts": [ "logseq", "plugins", "Full House Templates" ],
    "prefix": "logseq/plugins",
    "suffix": "Full House Templates",
    "pages": [ "logseq", "logseq/plugins" ]
  },
  "isJournal": false,
  "file": "pages/logseq___plugins___Full House Templates.md",
  "props": {
    "icon": "🏛"
  },
  "propsRefs": {
    "icon": []
  }
}
```
<!-- tabs:end -->



#### `.block` :id=dev-context-block
Conversion from Logseq API block format to plugin's format. Helpful for working with [queries](reference__query_language__blocks.md).

`dev.context.block(entity)`
- `entity`: block object from Logseq API

<!-- tabs:start -->
#### ***Template***
```javascript
``{
    const block = await logseq.Editor.getBlock(c.block.uuid)
    out(dev.context.block(block))
  }``
```

#### ***Rendered***
```javascript
{
  "id": 67915,
  "uuid": "668d19fe-e299-435c-a163-4724c708cd3c",
  "content": "{{renderer :template, test}}",
  "props": {},
  "propsRefs": {},
  "page": {
    "id": 33271
  },
  "parentBlock": {
    "id": 40072
  },
  "prevBlock": null,
  "level": 0,
  "children": [
    {}
  ],
  "refs": [
    {
      "id": 33271
    }
  ]
}
```
<!-- tabs:end -->
