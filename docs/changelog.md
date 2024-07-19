## NEXT

- **Query language for pages**:
  - [`.valueType`](reference__query_language.md#filter-value-type) filter with `.onlyStrings` & `.onlyNumbers` shortcuts to filter properties by values' type.
  - [`.journals` & `.day`](reference__query_language.md#filter-journals) filter deal with journal pages.
- New template tag [`blocks.uuid`](reference__tags_advanced.md#blocks-uuid) for creating block references between template blocks.

  <img width="400px" src="https://github.com/user-attachments/assets/ac0d6a63-f9ff-48f6-9f92-a37d2283a8ca"/>

- New array function [`.zipWith`](reference__syntax.md#extended-array-type).


## v4.0 :id=v40

### Set cursor position
🔥 It's exciting to announce that one of the most awaited features, [Cursor Positioning](reference__syntax.md#cursor-positioning), is now available! Set the cursor position after template insertion with the help of new syntax ` ``{|}`` ` or the template tag ``cursor()``.

<img width="450px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/82dd6aa4-b268-4ee6-af95-94b778da565d" />


### Cross-block variables
!> **Breaking change**: \
🔥 *Blocks can now share created variables*: the ones created in the first block are available in any child block and any sibling block. Therefore, it has become extremely important to execute code in the order that blocks are visible in Logseq. See details [here](reference__syntax.md#js-env).
- What exactly works differently?
  - Execution has become synchronous-like: async/await syntax is still available, but every next block waits for the previous one to finish.
  - The execution order is strictly top-to-bottom (depth-first search traversal, pre-order, NLR).
  - Global functions like `fetch` now need to be prefixed with `window`: `window.fetch`, `window.alert`, etc.
  - There may be other unintended differences, so it's better to test your templates.

<img width="450px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/ec57a12e-690c-45a9-8397-036b1643a323" />


### Templates inclusion reviewed & refined
!> **Breaking change**: \
*[`include`](reference__tags_nesting.md#nesting-include) & [`layout`](reference__tags_nesting.md#nesting-layout) have become fully runtime*. Previous versions worked in lazy mode via the `renderer` macro. This led to their execution being delayed and starting only after the current template execution. Now, the execution order is strictly top-to-bottom: the included template renders just at the moment of inclusion. Read more about different types of inclusion [here](reference__tags_nesting.md#nesting-include).
- New [`include.template`](reference__tags_nesting.md#include-template), [`layout.template`](reference__tags_nesting.md#layout-template), [`include.view`](reference__tags_nesting.md#include-view) & [`include.inlineView`](reference__tags_nesting.md#include-inline-view) template tags for **lazy** inclusion.
- New [`layout.args`](reference__tags_nesting.md#layout-args) template tag to use in pair with `layout` or `include` to pass-through current command arguments.


### Core runtime environment

<img width="450px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/3f480c08-4267-4e1f-b7a9-fe44af11b5be" />

- 🔥 A way to [dynamically create new blocks](reference__tags_advanced.md#blocks-spawn) from the current one: `blocks.spawn`, `blocks.spawn.tree`, `blocks.append`, `blocks.append.tree`.
- Added automatic [Macro Mode](reference__args.md#macro-mode) to combine `🏛️ views` with Logseq `:macros`.
- **Views**: added resolution of page's aliases when clicking on page reference.
- **Views**: added support of `==highlighting==` markdown syntax and improved overall compilation to HTML.
- New array [runtime function](reference__syntax.md#extended-array-type): `.countby`.
  - Also `.groupby` function now has the second argument: `wrapToObject?`.
- Array, simple objects and dayjs object returning from template now formatted with pretty printing.

!> **Breaking change**: say goodbye to auto selection of `🏛️syntax` (old prior to [v3.0](#v3-new-syntax) / new one, current) — it is removed now. All templates and views only support new syntax. To convert from old syntax use [special command](reference__commands.md#convert-syntax-command).


### Template tags
!> **Breaking change**: template tag `dev.walkTree` has been renamed to [`dev.tree.walkAsync`](reference__tags_dev.md#dev-walk-tree).
- New template tag [`dev.tree.walk`](reference__tags_dev.md#dev-walk-tree) — synchronous version of `dev.tree.walkAsync`.
- New template tag [`dev.tree.getNode`](reference__tags_dev.md#dev-walk-tree) for retrieving nodes by path in tree.
- 🔥 New set of template tags [`parse.refs`](reference__tags_advanced.md#parse-refs) to get *page*, *tag* & *block* references from any block or page:
  - [`parse.refs.blocks`](reference__tags_advanced.md#parse-refs-blocks)
  - [`parse.refs.pages`](reference__tags_advanced.md#parse-refs-pages)
  - [`parse.refs.pagesOnly`](reference__tags_advanced.md#parse-refs-pages-only)
  - [`parse.refs.tagsOnly`](reference__tags_advanced.md#parse-refs-tags-only)
- 🔥 New template tag [`parse.cleanMarkup`](reference__tags_advanced.md#clean-markup) to remove all Logseq markup from text.
- New template tag [`date.fromJournal`](reference__tags.md#date-from-journal) to convert Logseq journal dates (e.g. `20240614`) to `dayjs` objects.
- [`query.refs.journals`](reference__tags_advanced.md#query-refs-journals) and [`query.refs.pages`](reference__tags_advanced.md#query-refs-pages) now supports the additional return format with extended &eta-information about references.
- [`dev.links`](reference__tags_dev.md#dev-links) is replaced by new template tag [`parse.links`](reference__tags_advanced.md#parse-links) and it can catch links hidden deeply in markup.
- [`dev.get`](reference__tags_dev.md#dev-get) reviewed and now could return an array of references for property value with `@prop.all`. See examples in documentation.
- New template tag [`dev.dump`](reference__tags_dev.md#dev-dump) for pretty printing any JS objects.
- New template tag [`dev.compileMarkup`](reference__tags_dev.md#dev-compile-markup) to compile Logseq AST to HTML.


### Other changes
- **UI**: The Insertion UI now opens regardless of selected blocks or editing mode, to cover the case when you just need to jump to the template without inserting it.
- 🔥 **Documentation**: The reference section has been fully completed! It now covers all plugin features and details.
- **Query Language**: The filter [`.referenceCount`](reference__query_language.md#filter-reference-count) has been added to count references inside property value.
- **Core**: Plugin sets the date locale for internal `dayjs` library, based on user settings.

!> **Breaking change**! \
**Context**: Reviewed the content of the [`c.config`](reference__context.md#context-config) context variable.


### Fixed bugs
- The issue with views and redundant new lines is not a bug: here are the [details](https://github.com/stdword/logseq13-full-house-plugin?tab=readme-ov-file#how-to-overcome-the-bug-with-new-lines-when-using-views).
- **Documentation**: Fixed page scroll positioning while jumping on links.
- **Documentation**: Fixed highlighting of the current section in left & right sidebars.
- **Query Language**: Fixed operations `starts with`, `ends with`, `includes` for property filter [`.value`](reference__query_language.md#filter-value).
- The properties `template-list-as` and `template-usage` are now being removed when `template-including-parent` is set to YES.



## v3.4 :id=v340
### Core runtime environment
- New syntax [` ``@...`` `](reference__syntax.md#dates-nlp-syntax) for `date.nlp` template tag
- [Coercing to bool](reference__args.md#arg-properties) in template args ended with «?»
- `out` & `outn` [functions](reference__syntax.md#statement-syntax) to output info within ` ``{...}`` `
- Array [runtime functions](reference__syntax.md#extended-array-type): `.unique`, `.zip`, `.sorted`, `.groupby`

<img width="100%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/70fcdd38-41d6-4fb7-b577-bbc06903a77e"/>

### Query language for pages
- `query.pages` template tag for simple [pages query building](reference__query_language.md#ql-pages)
- `query.refs.*` namespace with [`.count`](reference__tags_advanced.md#query-refs-count), [`.journals`](reference__tags_advanced.md#query-refs-journals) and [`.pages`](reference__tags_advanced.md#query-refs-pages) template tags

[video](https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/54bfe297-b852-4529-8ea5-865b2b0f9e57 ':include :type=video controls width=80%')

<table><tr><td>
<details closed><summary>code</summary>

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
- A way to **inherit templates** with [`include`](reference__tags_nesting.md#nesting-include) & [`layout`](reference__tags_nesting.md#nesting-layout)
- [`tag`](reference__tags.md#tag)
- [`bool`](reference__tags.md#bool)
- [`dev.uuid`](reference__tags_dev.md#dev-uuid)
- [`dev.context.page`](reference__tags_dev.md#dev-context-page) & [`dev.context.block`](reference__tags_dev.md#dev-context-block)
- [`dev.walkTree`](reference__tags_dev.md#dev-walk-tree)

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



## v3.3
### Support Radix UI colors
<img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/3f871997-e21e-4305-8a06-70d2810b67c0"/>
<img width="70%" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/78e31cfc-4bb7-4a02-9ae3-19a5b009157e"/>



## v3.2
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



## v3.0 :id=v300
### New template syntax :id=v3-new-syntax
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
