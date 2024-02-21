## v3.4.0
### New syntax
- [New syntax](reference__syntax.md#dates-nlp-syntax) ` ``@...`` ` for `date.nlp` template tag
- [Coercing to bool](reference__args.md#arg-properties) in template args ended with «?»
- `out` & `outn` [functions](reference__syntax.md#statement-syntax) to output info within ` ``{...}`` `
- Array [runtime functions](reference__syntax.md#statement-syntax): `.unique`, `.zip`, `.sorted`, `.groupby`, `.countby`

<img width="100%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/70fcdd38-41d6-4fb7-b577-bbc06903a77e"/>

### Query language for pages
- `query.pages` template tag for simple [pages query building](reference__query_language.md#ql-pages)
- `query.refs.*` namespace with [`.count`](reference__tags.md#query-refs-count), [`.journals`](reference__tags.md#query-refs-journals) and [`.pages`](reference__tags.md#query-refs-pages) template tags

<table><tr><td>

<details closed><summary>video demo</summary>
  <video width="100%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/54bfe297-b852-4529-8ea5-865b2b0f9e57"></video>


  ```javascript
  ``{
    var books = query.pages()
      .property('likes')
        .value('>', '👍👍')
      .property('year')
        .integerValue('>', 1994)
        .nonEmpty()
    var data = books.get()
      .sorted((p) => [p.props.likes, -p.props.year])
      .reverse()
      .groupby((p) => p.props.likes)
      .map(([likes, objs]) => likes + '\n   ' +
        objs.map((p) => [
                    p.props.year,
                    ref(p.propsRefs.alias.at(-1))
                    ].join(' '))
           .join('\n   ')
      )
  _}``

  Total: ``books.get().length``

  ``data.join('\n')``
  ```
</details>

</td></tr></table>


### New template tags
- A way to **inherit templates** with [`include`](reference__tags.md#nesting-include) & [`layout`](reference__tags.md#nesting-layout)
- [`tag`](reference__tags.md#tag)
- [`bool`](reference__tags.md#bool)
- [`dev.uuid`](reference__tags.md#dev-uuid)
- [`dev.context.page`](reference__tags.md#dev-context-page) & [`dev.context.block`](reference__tags.md#dev-context-block)
- [`dev.walkTree`](reference__tags.md#dev-walk-tree)

### Engine changes
- Usage of `async / await` inside templates (by [@dsarman](https://github.com/dsarman))
- Improve rendering template errors readability

### UI changes
- Ordering templates in Insertion UI with respect to the *numeric characters*
- Own CSS variables to customize adaptation for any theme. To fix colors for any custom theme add this CSS to `custom.css`:
```css
  :root {
      --fht-footer-text: var(--ls-page-inline-code-color);
      --fht-hightlight: var(--ls-page-mark-bg-color);
      --fht-label-text: var(--ls-page-inline-code-color);
      --fht-active: var(--ls-quaternary-background-color);
      --fht-active-text: var(--ls-secondary-text-color);
      --fht-scrollbar-thumb: color-mix(in srgb, var(--ls-scrollbar-thumb-hover-color) 50%, transparent);
      --fht-scrollbar-thumb-hover: var(--ls-scrollbar-thumb-hover-color);
  }
```

### New meta-info to get from context
- [`c.tags`](reference__context.md#tags-context): to get all available template tags
- [`c.page.path`](reference__context.md#page-context): to get file path for page objects


### Other changes
- Removed protected mode for ` ``...`` `
- Allowed to return value of any type from ` ``{...}`` ` code block
- Added timezone plugin to `dayjs`
- Added start-of-week setup for `dayjs`
- Documentation: adapted toc & sidebar styles to fit more content and fix theme colors


### Fixed bugs
- Hidden properties prepending
- Rendering of tags in views
- `date.nlp` corner cases
- Displaying `c.tags.date` context
- XSS while building views & internal queries
- Bugs in `empty` & `when` template tags



## v3.3.0
### Support Radix UI colors
<img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/3f871997-e21e-4305-8a06-70d2810b67c0"/>
<img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/78e31cfc-4bb7-4a02-9ae3-19a5b009157e"/>



## v3.2.0
### Introduced UI for templates & views insertion :id=hello-ui
?> Stylized for any theme!
- [Insert templates or views](reference__commands.md#insertion-ui) <br/>
  <img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/de4dd3fe-83b7-4b6f-8dd1-a7064933b583"/>
- Fuzzy search by name, type, and parent page <br/>
  <img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/78105236-1b80-4282-870e-c28e9ca6ab16"/>
- Open page with the template by holding «Shift» key <br/>
  <img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/0f1be295-93be-44a3-a2e0-802a8cbbeb44"/>
- [Hide items from list with «.»](reference__configuring.md#hiding-from-list) <br/>
  <img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/a1afd929-4028-43a3-a5b3-d59e14e44ed0">
- [Restrict to View or Template only](reference__configuring.md#restricting-rendering) <br/>
  <img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/0e18fe13-626d-48d8-b60f-e6d27f6256e2"/>
- [Provide usage hint](reference__configuring.md#default-usage) <br/>
  <img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/ea605064-e9dc-477f-86ec-00e68e9ce118"/>
- [Control cursor position or text selection for arguments](reference__configuring.md#control-cursor) <br />
  <img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/f1139f82-0a60-4a5b-8080-f8c6758ba9ea"/>


### Updated «Copy as ...» commands
- To support [usage hint](reference__configuring.md#default-usage)
- Added to [*page context menu*](reference__commands.md#indirect)



## v3.0.0
### New template syntax :id=new-syntax
!> Breaking change!

This version introduces the [new template syntax](reference__syntax.md) to support agile syntax expansion and to make it more simple.

| Changes: |      |      |
| ---: | :---: | :---: |
| **Before** | ` ``{ c.page.name }`` ` | ` ``{ ! var x = c.page.name _}`` ` |
| **After** | ` ``c.page.name`` ` | ` ``{ var x = c.page.name }`` ` |

For now the plugin tries to auto-detect the syntax version. However, this behavior will be disabled in future versions.

To manually convert your existing templates, use [this](reference__commands.md#convert-syntax-command) command.


### Rendering standard Logseq templates
1. Rendering *dynamic variables* (inside `<% ... %>`) according to [Logseq Docs](https://docs.logseq.com/#/page/60311eda-b6f7-4779-8187-8830545b3a64). See [*Reference*](reference__syntax.md#id=standard-syntax) for more details.
2. Possibility to mix standard Logseq templates syntax with other plugin [*Syntax*](reference__syntax.md).


### Template tag `date.nlp` for getting NLP dates
1. Relative to now moment
2. Relative to any custom date
3. Relative to current journal's page

See [*Reference*](reference__tags.md#id=date-nlp) for more details.


### Accessing positional arguments, excluding named ones
This inline view `{{renderer :view, "c.args.$1", :first 1, 2}}` renders to `2`.
See details [here](reference__args.md#accessing).
