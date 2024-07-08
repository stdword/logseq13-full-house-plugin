

### `include` :id=nesting-include
Include another template by it's name.

- `async include(name, args?, lazy?)`
    - `name`: template name. Only templates with `template::` property can be included.
    - `args`: (optional) arguments for included template. Can be a string or an array of strings.
        - If not specified `template-usage::` property will be used to get default arguments' values.
        - If you need to include template with no arguments: use empty value `[]` or `''`.
    - `lazy`: (optional, default: false) include template, but render it later.
        - Useful for heavy templates. Could be slow for lots of lazy inclusions.
        - Supported only with [render template](reference__commands.md#template-command) command.
- `async include.view(name, args?)`
    - Force inclusion as a view, regardless of the rendering command. It is always lazy.
- `include.inlineView(body, args?)`
    - Force inclusion as an inline view, regardless of the rendering command. It is always lazy.

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



### `layout` :id=nesting-layout
Include another template by it's name. Acts like [`include`](#nesting-include) with the only difference: it preserves outer-template [arg-properties](reference__args.md#arg-properties). Use it to **inherit templates**.

- `async layout(name, args?, lazy?)`
    - See parameters description in [`include`](#nesting-include) section.
- `layout.args(...names)` — used to pass through current arguments to layout template
    - `names`: an array
        - every item could be:
            - the name of an argument
            - positional link to an argument: `$1`, `$2`, etc.
            - argument name and it's value: `[name, value]`
            - object with arguments' names as key and values as values: `{name1: v1, name2: v2, ...}`
        - if unspecified: all arguments will be passed through automatically

<!-- tabs:start -->
#### ***Template «parent»***
```
- template:: parent
  arg-test:: ORIGINAL
  - ``c.args.test``
```

#### ***Template «child»***
```
- template:: child
  arg-test:: OVERRIDED
  - ``await include('parent')``
  - ``await layout('parent')``
  - ``await layout('parent', layout.args('test'))``
  - ``await layout('parent', layout.args(['test', c.args.test]))``
  - ``await layout('parent', layout.args({test: 'COMPUTED'}))``
```

#### ***Rendered***
- ORIGINAL
- OVERRIDED
- USER
- USER
- COMPUTED

<!-- tabs:end -->

?> Another example is [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9#view-for-blocks), in the section «🏛view for blocks»
