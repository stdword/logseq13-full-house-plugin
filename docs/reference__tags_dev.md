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


### `.walkTree TODO` :id=dev-walk-tree
TODO


### `.context.page TODO` :id=dev-context-page
TODO


### `.context.block TODO` :id=dev-context-block
TODO
