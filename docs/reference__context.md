## `c`: whole context variable
The main variable to keep all context information.

?> You can always see whole context with `{{renderer :view, "c"}}`. \
Or individual one (e.g. `c.tags`) with `{{renderer :view, "c.tags"}}`.


### `c.page` & `c.currentPage` :id=page-context
Page contexts:
- `c.page`: current page or page provided with `:page` [argument](reference__configuring.md#page-argument)
- `c.currentPage` is always the current page

#### Schema
<!-- {docsify-ignore} -->
```
{
    id: (number) 11320,
    uuid: (string) '64d7d3a2-b635-487b-8aa9-0a44ad21e142',
    name: (string) 'logseq/plugins/Full House Templates',
    name_: (string) 'logseq/plugins/full house templates',
    namespace: {
        parts: [ 'logseq', 'plugins', 'Full House Templates' ],
        prefix: 'logseq/plugins',
        suffix: 'Full House Templates',
        pages: [ 'logseq', 'logseq/plugins' ]
    },
    file: (string) 'pages/logseq___plugins___Full House Templates.md',
    isJournal: (boolean) false,
    props: {
        icon: (string) 🏛,
        related: (string) '[[logseq]], [[logseq/plugins]]'
    },
    propsRefs: {
        icon: (array of string) [],
        related: : (array of string) ['logseq', 'logseq/plugins']
    }
}
```


### `c.block` & `c.currentBlock` :id=block-context
Block contexts:
- `c.block`: current block or block provided with `:block` [argument](reference__commands.md#block-argument)
- `c.currentBlock` is always block rendering occurs in

#### Schema
<!-- {docsify-ignore} -->
```
{
    id: (number) 25686,
    uuid: (string) '64d8c048-37dd-4666-a653-15fb14eda201',
    content: (string) '{{renderer :view, "c.block"}}\nproperty:: already existed',
    props: {
        property: (string) 'already existed'
    },
    propsRefs: {
        property: (array of string) []
    },

    page: (page) ...

    // NOTE: always starts from zero
    level: (number) 0,

    // NOTE: next fields not yet implemented
    // Watch for https://github.com/stdword/logseq13-full-house-plugin/issues/12
    children: (array of block) [...]
    parentBlock: { id: (number) 25640 },
    prevBlock: { id: (number) 25678 },
    refs: (array of page) [ { id: (number) 25679 } ]
}
```


### `c.template`
Template block context.

#### Schema
<!-- {docsify-ignore} -->
```
{
    name: (string) template name, page name or block UUID
    includingParent: (boolean) true
    block: (block) template block
    props: same as `block.props`
    propsRefs: same as `block.propsRefs`
}
```


### `c.self`
Context for currently rendering block of template. This is dynamic variable: it changes during rendering.

It is handy if you need to access properties of child template block.

!> Doesn't available for [*Inline Views*](reference__commands.md#inline-view-command)

?> Schema is the same as `c.block`

#### Structure
<!-- {docsify-ignore} -->
```
[[Test Page]] ← c.page

- template:: test ← c.template.block
  - child ← c.self
    - sub child ← c.self

- {{renderer :template, test}} ← c.block
```


### `c.args`
Arguments context. Accessing arguments by its names.

See detailed [Reference for arguments](reference__args.md).

#### Schema
<!-- {docsify-ignore} -->
```
{
    (string) arg name: (string or boolean) arg value
}
```


### `c.tags` :id=tags-context
Template tags context. Helpful utils for creating templates.
Every item available in two ways: `c.tags.<item>` and `<item>`.

See detailed [Reference for tags](reference__tags.md).

#### Schema
<!-- {docsify-ignore} -->
```
{
    (string) tag name: (function) signature
}
```


### `c.config`
Configuration context.

#### Schema
<!-- {docsify-ignore} -->
```
{
    appVersion: (string) '0.9.13',
    pluginVersion: (string) '3.0.0',
    preferredWorkflow: (string) 'now',
    preferredThemeMode: (string) 'light',
    preferredFormat: (string) 'markdown',
    preferredLanguage: (string) 'en-GB',
    preferredDateFormat: (string) 'yyyy-MM-dd EEE',
    preferredStartOfWeek: (number) 0,
    enabledFlashcards: (boolean) true,
    enabledJournals: (boolean) true,
    showBrackets: (boolean) true,

    graph: {
        name: (string) 'My Notes',
        path: (string) '/Users/User/Documents/My Notes',
        data: {
            favorites: (array of strings) [
                'logseq/plugins/Full House Templates',
                ...
            ],
            macros: {
                (string) 'plugin-name': (string) 'Full House Templates',
                ...
            },
            commands: (array of commands) [
                [
                    (string) 'eval clojure code',
                    (string) '```cljs :results\n\n```'
                ], ...
            ],
            shortcuts: {
                (string) 'command/toggle-favorite': (string) 'shift+meta+f',
                ...
            }
        }
    }
}
```


### `c.identity`
CSS context. Accessing CSS class names for currently rendering view.

Used for complex 🏛view development. See example [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9).

#### Schema
<!-- {docsify-ignore} -->
```
{
    slot: (string) 'slot__34emiluj'
    key: (string) '34emiluj'
}
```
