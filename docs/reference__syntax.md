Inside template you can write any text you want. But there is special syntax to access JavaScript environment.

## JavaScript environment :id=js-env
Has some particular qualities:
- Logseq blocks can share variables created in JS environment. The ones created in the first block are available in any child block and any sibling block.
  - Only `var` variables can be shared, not `let` & `const`.
  - To share a function or a class assign it to `var` variable.
- JS code execution runs in the order that blocks are visible in Logseq. And it is synchronous-like: async/await syntax is available, but every next block waits for the previous one to finish.
- Global functions like `fetch` need to be prefixed with `window`: `window.fetch`, `window.alert`, etc.


##  \`\`...\`\` :id=interpolation-syntax
Use double back-tick «` `` `» to *start* and *finish* JavaScript expression.

<!-- panels:start -->
<!-- div:left-panel -->
Simple JavaScript expressions:

<!-- div:right-panel -->
<!-- tabs:start -->
    #### ***Template***
    Calculate: ` ``1 + 2`` `

    #### ***Rendered***
    Calculate: 3
<!-- tabs:end -->

<!-- div:left-panel -->
Accessing [context](reference__context.md) data:

<!-- div:right-panel -->
<!-- tabs:start -->
    #### ***Template***
    Current page name: ` ``c.page.name.italics()`` `

    #### ***Rendered***
    Current page name: *Test Page*
<!-- tabs:end -->


<!-- div:left-panel -->
[Template tags](reference__tags.md) usage:

<!-- div:right-panel -->
<!-- tabs:start -->
    #### ***Template***
    Argument value: ` ``empty(c.args.some_arg, 'Unspecified')`` `

    #### ***Rendered***
    Argument value: Unspecified
<!-- tabs:end -->

<!-- panels:end -->



## \`\`[...]\`\` :id=reference-interpolation-syntax
Use «` ``[ `» and «` ]`` `» to call [`ref`](reference__tags.md#ref) template tag in a short form.

<!-- panels:start -->
<!-- div:left-panel -->
These lines are completely the same:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Reference to current page: ` ``[c.page]`` ` \
Reference to current page: ` ``ref(c.page)`` `

#### ***Rendered***
Reference to current page: [[Test Page]] \
Reference to current page: [[Test Page]]
<!-- tabs:end -->
<!-- panels:end -->

<!-- panels:start -->
<!-- div:left-panel -->
Use an alias for reference:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Reference to current page: ` ``[c.page, "Current"]`` `

#### ***Rendered***
Reference to current page: [Current]([[Test Page]])
<!-- tabs:end -->
<!-- panels:end -->



## \`\`@...\`\` :id=dates-nlp-syntax
Use «` ``@ `» and «` `` `» to call [`date.nlp`](reference__tags.md#date-nlp) template tag in a short form.

<!-- panels:start -->
<!-- div:left-panel -->
These lines are completely the same:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
- ` ``@in two days`` `
- ` ``ref(date.nlp('in two days'))`` `

#### ***Rendered***
- [[2023-08-14 Mon]]
- [[2023-08-14 Mon]]

<!-- tabs:end -->
<!-- panels:end -->

<!-- panels:start -->
<!-- div:left-panel -->
Start from current journal page or any date:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
- Current journal: ` ``c.page.name.italics()`` `
- ` ``@in two days, page`` `
- ` ``@in two days, 2020-01-02`` `

#### ***Rendered***
- Current journal: *2020-01-01 Wed*
- [[2020-01-03 Fri]]
- [[2020-01-04 Sat]]

<!-- tabs:end -->
<!-- panels:end -->



## \`\`{...}\`\` :id=statement-syntax
Use «` ``{ `» and «` }`` `» to execute custom JavaScript code.

<!-- panels:start -->
<!-- div:left-panel -->
JavaScript statements:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
` ``{ var x = 13 }`` ` \
Value of variable: ` ``x`` `

#### ***Rendered***
Value of variable: 13
<!-- tabs:end -->


<!-- div:left-panel -->
**Note**. There is no interpolation to value:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
No result: ` ``{ c.page.name }`` `

#### ***Rendered***
No result:
<!-- tabs:end -->
<!-- panels:end -->

But there are the special `out` & `outn` functions to output info within ` ``{...}`` `:

<!-- tabs:start -->
#### ***Template***
- ```javascript
  ``{ for (const i of [1, 2, 3]) out(i) }``
  ```
- ```javascript
  ``{ for (const i of [1, 2, 3]) outn(i) }``
  ```

#### ***Rendered***
- 123
- 1 \
  2 \
  3

<!-- tabs:end -->



### Cursor positioning with ` ``{|}`` ` :id=cursor-positioning
This special syntax positions the cursor after template insertion.

- Use ` ``{|}`` ` once to position cursor at the specified place.
- Use ` ``{|}`` ` twice to make a selection between two cursor positions.

?> This will activate edit mode. However, due to Logseq restrictions, only one block can be edited at a time. Therefore, you can only use this syntax once in the entire template."

<!-- tabs:start -->
#### ***Template***
- The cursor is before this ``{|}``word
- And this ``{|}``word``{|}`` will be selected

#### ***Rendered***
- The cursor is before this   **|** word
- And this <mark>word</mark> will be selected

<!-- tabs:end -->

To position the cursor from code inside curly brackets, use `cursor()` template tag:

<!-- tabs:start -->
#### ***Template***
```javascript
``{
    var sentence = `Hello, ${cursor()}user${cursor()}!`
  }``

``sentence``
```

#### ***Rendered***
Hello, <mark>user</mark>!

<!-- tabs:end -->

To position cursor inside [spawned blocks](reference__tags_advanced.md#blocks-spawn), use *cursorPosition* parameter:

<!-- tabs:start -->
#### ***Template***
- ```javascript
  ``{
      blocks.spawn('Hello, {|}Logseq{|}!', null, {cursorPosition: true})
  }``
  ```
- ```javascript
  ``{
      blocks.spawn.tree({
        content: 'Hello, {|}Full House Templates{|}!',
        data: {cursorPosition: true},
      })
  }``
  ```

#### ***Rendered***
- Hello, <mark>Logseq</mark>!
- Hello, <mark>Full House Templates</mark>!

<!-- tabs:end -->



### Extended `Array` type :id=extended-array-type
The `Array` type is extended with helpful functions:
- `Array.zip(...arrays)`
- `Array.unique()`
- `Array.sorted(keyfunc)`
- `Array.groupby(keyfunc, wrapToObject? = true)`
- `Array.countby(keyfunc, wrapToObject? = true)`

<!-- tabs:start -->
#### ***Template***
- ```javascript
  ``Array.zip([1, 2, 3], ['a', 'b'])``
  ```
- ```javascript
  ``[1, 2, 2, 3, 2, 1, 1].unique()``
  ```

#### ***Rendered***
- [[1,"a"], [2,"b"]]
- 1,2,3

<!-- tabs:end -->


<!-- tabs:start -->
#### ***Template***
- ```javascript
  var items = [
    { type: "vegetables", quantity: 5  },
    { type: "fruit",      quantity: 1  },
    { type: "meat",       quantity: 23 },
    { type: "fruit",      quantity: 5  },
    { type: "meat",       quantity: 22 },
  ]
  ```
- ```javascript
  ``items.sorted((x) => [x.type, x.quantity]).join('\n')``
  ```
- ```javascript
  ``items.groupby((x) => x.type)``
  ```
- ```javascript
  ``items.countby((x) => x.type)``
  ``items.countby((x) => x.type, false)``
  ```

#### ***Rendered***
- ```javascript
// .sorted
{"type": "fruit",      "quantity": 1  }
{"type": "fruit",      "quantity": 5  }
{"type": "meat",       "quantity": 22 }
{"type": "meat",       "quantity": 23 }
{"type": "vegetables", "quantity": 5  }
```
- ```javascript
// .groupby
{
    "vegetables": [
        {"type": "vegetables", "quantity": 5 }
    ],
    "fruit": [
        { "type": "fruit", "quantity": 1 },
        { "type": "fruit", "quantity": 5 }
    ],
    "meat": [
        { "type": "meat", "quantity": 23 },
        { "type": "meat", "quantity": 22 }
    ]
}
```
- ```javascript
  // .countby
  {
      "vegetables": 1,
      "fruit": 2,
      "meat": 2
  }

  [ ["vegetables", 1], ["fruit", 2], ["meat", 2] ]
  ```

<!-- tabs:end -->



## <%...%> :id=standard-syntax
Use «`<%`» and «`%>`» to render standard Logseq Templates

<!-- panels:start -->
<!-- div:left-panel -->
Accessing pages & current time:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Time: `<% time %>`

Reference to current page: `<% current page %>`

Today's journal page: `<% today %>` \
Yesterday's journal page: `<% yesterday %>` \
Tomorrow's journal page: `<% tomorrow %>`

#### ***Rendered***
Time: 20:32

Reference to current page: [[Test Page]]

Today's journal page: [[2023-08-12]] \
Yesterday's journal page: [[2023-08-11]] \
Tomorrow's journal page: [[2023-08-13]]
<!-- tabs:end -->


<!-- div:left-panel -->
Journal pages via natural language dates:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Relative: \
`<% last friday %>` \
`<% 5 days ago %> %>` \
`<% 2 weeks from now %>`

Specified: \
`<% 17 August 2013 %>` \
`<% Sat Aug 17 2013 %>` \
`<% 2013-08-17 %>`

#### ***Rendered***
Relative: \
[[2023-08-11]] \
[[2023-08-07]] \
[[2023-08-26]]

Specified: \
[[2013-08-17]] \
[[2013-08-17]] \
[[2013-08-17]]
<!-- tabs:end -->

<!-- panels:end -->
