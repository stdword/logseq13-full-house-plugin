## Render template :id=template-command
Render existed template block, non-template block or page.

#### Via insertion UI  :id=insertion-ui

<!-- panels:start -->
<!-- div:left-panel -->
1. Use `⌘t` (or `ctrl+t`) shortcut

<!-- div:right-panel -->
1a. Use `/`-command or *Command Palette* (`⌘⇧P` or `Ctrl+Shift+P`)

1b. Select the `«Insert 🏛template or 🏛️view»` command
<!-- panels:end -->

2. Then select the appropriate template.

?> You cannot render non-template blocks or pages via UI. To do that use another approach:

#### Via block / page context menu :id=indirect
1. Right-click on any block's bullet or page title to open *Context Menu*
2. Select the `«Copy as 🏛template»` item
3. Code to call the command will be copied to clipboard. Paste it to any block.


### Examples :id=template-command-examples

#### Rendering template by name :id=template-command-rendering-by-name
Standard way of rendering templates.
Plugin will find the block with the property `template` and it's specified name.
- The property `template-including-parent` with any bool value could be used to change the parent block inclusion. By default it is set to «*No*» (in opposite to standard Logseq templates).
    - This can be configured with [inclusion control](reference__configuring.md#parent-block-inclusion-control) to ignore `template-including-parent` property.

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, template name}}` \
`{{renderer :template, "template name, with comma"}}`
<!-- tabs:end -->


#### Rendering any non-template block
Use block reference to specify the block. Copy it from *Block Context Menu* directly or use [indirect way](#indirect).
- By default the parent block will be included (in opposite to [rendering by name](#template-command-rendering-by-name)).
    - This still can be configured with [inclusion control](reference__configuring.md#parent-block-inclusion-control).

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, ((64e61063-1689-483f-903f-409766d81b2e)) }}`
<!-- tabs:end -->


#### Rendering page as a template
Use page reference to specify the page. Enter it manually or use [*Context Menu*](#indirect). Only **first page block** and all it's **children** will be used as the template.
- By default the first block will **not** be included.
    - This still can be configured with [inclusion control](reference__configuring.md#parent-block-inclusion-control).

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, [[Template Page]] }}` \
`{{renderer :template, "[[Template Page, with comma]]" }}`
<!-- tabs:end -->

### Configuring arguments
See documentation [here](reference__configuring.md#configure-arguments).



## Render view :id=template-view-command
Render existed template block, non-template block or page as 🏛view. For views rendering occurs every time the block becomes visible.

!> Rendered content will not be persisted. If you need to keep it, use [render template command](#template-command) instead.

!> Rendered page or block *references* will not be displayed in *Linked references* and *Block references* sections. If you need it to be displayed, use [render template command](#template-command) instead.

Another reason to use 🏛view is availability of applying custom CSS. See example [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/9).


#### Via insertion UI :id=view-insertion-ui

<!-- panels:start -->
<!-- div:left-panel -->
1. Use `⌘t` (or `ctrl+t`) shortcut

<!-- div:right-panel -->
1a. Use `/`-command or *Command Palette* (`⌘⇧P` or `Ctrl+Shift+P`)

1b. Select the `«Insert 🏛template or 🏛️view»` command
<!-- panels:end -->

2. Then select the appropriate view. Or select the template and hold `⌘` or `Ctrl` to insert it as view.

?> You cannot render non-template blocks or pages via UI. To do that use another approach:

#### Via block / page context menu :id=indirect
1. Right-click on any block's bullet or page title to open *Context Menu*
2. Select the `«Copy as 🏛view»` item
3. Code to call the command will be copied to clipboard. Paste it to any block.

#### Examples
?> [Arguments](reference__configuring.md#configure-arguments), [examples and way of rendering](#template-command-examples) are very similar to [render template command](#template-command). Only differences are reflected below.

<!-- panels:start -->
<!-- div:left-panel -->
🏛View always displays in one block.

1. The parent block of template and it's first-level children will be displayed as wall of text.

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
```
- parent
    - child 1
    - child 2
```

#### ***Rendered w/o parent***
child 1 \
child 2

#### ***Rendered w/ parent***
parent \
child 1 \
child 2
<!-- tabs:end -->
<!-- panels:end -->


<!-- panels:start -->
<!-- div:left-panel -->
2. The every other level of children will be displayed as bullet list.

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
```
- parent
    - child 1
        - item
    - child 2
        - item
        - item
```

#### ***Rendered w/o parent***
child 1
- item

child 2
- item
- item

#### ***Rendered w/ parent***
parent \
child 1
- item

child 2
- item
- item

<!-- tabs:end -->
<!-- panels:end -->



## Render inline view :id=inline-view-command
Rendering inline view: fast way to render any 🏛syntax without creating a whole template block.

?> The only syntax allowed here is [` `` `-syntax](reference__syntax.md#interpolation-syntax) and it will be **applied automatically**.

#### Usage
<!-- {docsify-ignore} -->

1. Call via `/`-command or *Command Palette* (`⌘⇧P` or `Ctrl+Shift+P`)
2. Select the `«Insert inline 🏛view»` command

<!-- panels:start -->
<!-- div:left-panel -->
There is no need to use back-tick «\`» quotes:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`{{renderer :view, c.page.name}}`

#### ***Rendered***
[[Test Page]]

<!-- tabs:end -->
<!-- panels:end -->



## Convert template to new syntax style :id=convert-syntax-command
This command converts old template syntax style (used before `v3.0.0`) to new one. See details [here](changelog.md#new-syntax).

#### Usage
<!-- {docsify-ignore} -->

1. Select blocks with *old* plugin syntax
2. Run the *Command Palette* (`⌘⇧P` or `Ctrl+Shift+P`)
3. Select the `«Convert to new 🏛syntax»` command
