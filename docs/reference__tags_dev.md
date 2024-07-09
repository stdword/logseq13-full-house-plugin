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


### `.cleanMarkup` :id=dev-clean-markup
Clean any Logseq markup to leave only text.

`dev.cleanMarkup(markup, options?)` → cleaned text string
- `markup`: string with Logseq markup
- `options`: (optional) object with options:
  - `cleanRefs`: should brackets be cleaned for page references and hash signs for tags and link syntax for links, or should they be left as they are? (default: false)
  - `cleanLabels`: should labels be cleaned, or should references be replaced by them? (default: false)

<!-- tabs:start -->
#### ***Template***
- ` ``dev.cleanMarkup('*text* [[link]]')`` `
- ` ``dev.cleanMarkup('*text* [[link]]', {cleanRefs: true})`` `

#### ***Rendered***
- `text [[link]]`
- `text link`
<!-- tabs:end -->

<!-- tabs:start -->
#### ***Template***
- ` ``dev.cleanMarkup('[**label**](https://google.com)')`` `
- ` ``dev.cleanMarkup('[**label**](https://google.com)', {cleanLabels: true})`` `
- ` ``dev.cleanMarkup('[**label**](https://google.com)', {cleanLabels: true, cleanRefs: true})`` `

#### ***Rendered***
- `[label](https://google.com)`
- `[https://google.com](https://google.com)`
- `https://google.com`
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



### `.links` :id=dev-links
Retrieves links from the text.

`dev.links(text, withLabels?)` → array of links or array of pairs [link, label]
- `text`: text string with links in form `http://site.com` or `[Label](http://site.com)`
- `withLabels`: (optional) should labels be included to returned array or not? (default: false)

<!-- tabs:start -->
#### ***Template***
- ` ``dev.links('Which one to use: https://google.com or https://duckduckgo.com?')`` `
- ` ``dev.links('May be [Google](https://google.com)?', true)`` `
- ` ``dev.links('No! https://duckduckgo.com', true)`` `

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

?> Another example of usage is [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9#view-for-blocks)



### **`.refs`** :id=dev-refs
Retrieves references from the text. There are several types of references:
- `((44563ff-6467-...))` or `[label](((44563ff-6467-...)))` — **block** references
- `[[research papers]]` or `[label]([[research papers]])` — **page** references
- `#note` — **tag** references (logseq doesn't support labels for tags)

`dev.refs(text, withLabels?, only?)` → array of references or array of pairs [ref, label]
- `text`: text string with references
- `withLabels`: (optional) should labels be included to returned array or not? (default: false)
- `only`: (optional) an array with references types to include to result (default: [] — include all)

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  var text = '#note for [current](((44563ff-6467-...))) [[research papers]]'

  out(dev.refs(text))
  out(dev.refs(text, true))
  out(dev.refs(text, false, ['tag']))
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



#### `.blocks` :id=dev-refs-blocks

`dev.refs.blocks(text, withLabels?)`
- Returns the same data as `dev.refs(text, withLabels?, ['block'])`.
- Except for the redundant reference type.

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  var text = '#note for [current](((44563ff-6467-...))) [[research papers]]'

  out(dev.refs.blocks(text))
  out(dev.refs.blocks(text, true))
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



#### `.pages` :id=dev-refs-pages

`dev.refs.pages(text, withLabels?)`
- Returns the same data as `dev.refs(text, withLabels?, ['page', 'tag'])`.
- Except for the redundant reference type.

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  var text = '#note for [current](((44563ff-6467-...))) [[research papers]]'

  out(dev.refs.pages(text))
  out(dev.refs.pages(text, true))
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



#### `.pagesOnly` :id=dev-refs-pages-only

`dev.refs.pagesOnly(text, withLabels?)`
- Returns the same data as `dev.refs(text, withLabels?, ['page'])`.
- Except for the redundant reference type.

<!-- tabs:start -->
#### ***Template***
```javascript
``{
  var text = '#note for [current](((44563ff-6467-...))) [[research papers]]'

  out(dev.refs.pagesOnly(text))
  out(dev.refs.pagesOnly(text, true))
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



#### `.tagsOnly` :id=dev-refs-tags-only

`dev.refs.tagsOnly(text)`
- Returns the same data as `dev.refs(text, false, ['tag'])`.
- Except for the redundant reference type.

<!-- tabs:start -->
#### ***Template***
` ``dev.refs.tagsOnly('#note for [current](((44563ff-6467-...))) [[research papers]]'))`` `

#### ***Rendered***
- ```javascript
[ 'note' ]
```
<!-- tabs:end -->



### **.tree**

#### `.walkTree` & `.walkTreeAsync` :id=dev-walk-tree
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



### **`.context`**

#### `.page` :id=dev-context-page
Conversion from Logseq API page format to plugin's format. Helpful for working with [queries](reference__query_language.md#ql-pages).

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
Conversion from Logseq API block format to plugin's format. Helpful for working with [queries](reference__query_language.md#ql-blocks).

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