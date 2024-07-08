
## `include` :id=nesting-include
Include another template by it's name.

There are different ways and different situations around inclusion:
- **Runtime** inclusion renders an included template or view at the moment of current template rendering.
- **Lazy** inclusion relies on the renderer macro (`{{renderer ...}}`) to render an included template or view at a later time, after the current template rendering is finished.

Use the table to select the appropriate template tag:

| intention ↓       rendering as → | [`template`](reference__commands.md#template-command) | [`view`](reference__commands.md#template-view-command) |
| :--                          | :--                                     | :--:      |
| Include (*runtime*)          | `include`                               | `include` |
| Include (*lazy*) as template | `include.template`                      | —         |
| Include (*lazy*) as view     | `include.view`<br/>`include.inlineView` | —         |

---


- `async include(name, args?)` → string
    - `name`: template name. Only templates with `template::` property can be included.
    - `args`: (optional) arguments for included template. Can be a string or an array of strings.
        - If not specified `template-usage::` property will be used to get default arguments' values.
        - If you need to ignore `template-usage::` and include template with no arguments: use explicit empty value `[]` or `''`.

!> **Returns only template head as a string!** Head children nodes and tail nodes will be spawned automatically. This template tag is not intended to access whole included template blocks tree!


<!-- tabs:start -->
#### ***Template***
This is ` ``await include('nested')`` `!

#### ***Template «nested»***
` ``c.template.name`` `

#### ***Rendered***
This is nested!
<!-- tabs:end -->


<!-- tabs:start -->
#### ***Template***
Args from usage string: ` ``await include('nested')`` ` \
No args: ` ``await include('nested', [])`` ` \
No args: ` ``await include('nested', '')`` ` \
Explicit args: ` ``await include('nested', ':value ARG')`` ` \
Explicit args: ` ``await include('nested', [':value ARG', ':another TOO'])`` `

#### ***Template «nested»***
```
- template:: nested
  template-usage:: :value USAGE
  - ``c.args.value``
```

#### ***Rendered***
Args from usage string: USAGE \
No args: \
No args: \
Explicit args: ARG \
Explicit args: ARG
<!-- tabs:end -->


<!-- tabs:start -->
#### ***Template***
Buy list: \
` ``{ for (const item of ['apple', 'orange', 'lemon']) { }`` ` \
    → ` ``await include('nested', item)`` ` \
` ``{ } }`` `

#### ***Template «nested»***
` ``c.args.$1.bold()`` `

#### ***Rendered***
Buy list: \
    → **apple** \
    → **orange** \
    → **lemon**
<!-- tabs:end -->

?> Note: if you need to place buy list items in child blocks, use [blocks spawning](reference__tags_advanced.md#blocks-spawn)


### `.template`
Lazy inclusion as template.

- `async include.template(name, args?)`

<!-- tabs:start -->
#### ***Template***
` ``await include.template('test', ':arg 13')`` `

#### ***Rendered***
`{{renderer :template, test, :arg 13}}`

<!-- tabs:end -->


### `.view`
Lazy inclusion as a view

- `async include.view(name, args?)`

<!-- tabs:start -->
#### ***Template***
` ``await include.view('test', ':arg 13')`` `

#### ***Rendered***
`{{renderer :template-view, test, :arg 13}}`

<!-- tabs:end -->


### `.inlineView`
Lazy inclusion as an inline view

- `async include.inlineView(body, args?)`
    - `body`: A string with JavaScript code for inline view. See details [here](reference__commands.md#inline-view-command).

<!-- tabs:start -->
#### ***Template***
` ``await include.inlineView('c.args.arg', ':arg 13')`` `

#### ***Rendered***
`{{renderer :view, "c.args.arg", :arg 13}}`

<!-- tabs:end -->


## `layout` :id=nesting-layout
Include another template by it's name. Acts like [`include`](#nesting-include) with the only difference: it preserves outer-template [arg-properties](reference__args.md#arg-properties). Use it to **inherit templates**.

Read the difference between lazy & runtime inclusion in [`include`](#nesting-include) section.

Use the table to select the appropriate template tag:

| intention ↓       rendering as → | [`template`](reference__commands.md#template-command) | [`view`](reference__commands.md#template-view-command) |
| :--                         | :--               | :--:     |
| Layout (*runtime*)          | `layout`          | `layout` |
| Layout (*lazy*) as template | `layout.template` | —        |
| Layout (*lazy*) as view     | not supported     | —        |

---

- `async layout(name, args?)`
    - See parameters description in [`include`](#nesting-include) section.

<!-- tabs:start -->
#### ***Template «included»***
```
- template:: included
  arg-test:: ORIGINAL
  - ``c.args.test``
```

#### ***Template «main»***
```
- template:: main
  arg-test:: OVERRIDED
  - ``await include('included')``
  - ``await layout('included')``
  - ``await layout('included', layout.args('test'))``
  - ``await layout('included', layout.args(['test', c.args.test]))``
  - ``await layout('included', layout.args({test: 'COMPUTED'}))``
```

#### ***Rendered***
- ORIGINAL
- OVERRIDED
- USER
- USER
- COMPUTED

<!-- tabs:end -->

?> Real life example is [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9#view-for-blocks), in the section «🏛view for blocks»


### `.template`
Lazy layout as template.

- `async layout.template(name, args?)`

<!-- tabs:start -->
#### ***Template***
` ``await layout.template('test', ':arg 13')`` `

#### ***Rendered***
`{{renderer :template, test, :arg 13}}`

<!-- tabs:end -->


### `.args`
Used to pass-through current arguments to layout template.

- `layout.args(...args?)`
    - `args`: (optional) an array or string
        - if unspecified: all arguments will be passed through automatically
        - if specified, every item could be:
            - the name of an argument
            - positional link to an argument: `$1`, `$2`, etc.
            - the pair of argument name and it's value: `[name, value]`
            - object with arguments' names as keys and values as values: `{name1: v1, name2: v2, ...}`

> See example of usage in [`layout`](#nesting-layout) section
