## Render template :id=template-command
Render existed template block, non-template block or page.

#### **Direct usage**
1. Call via `/`-command or *Command Palette* (`⌘⇧P` or `Ctrl+Shift+P`)
2. Select the `«Insert 🏛template»` command

#### **Indirect usage**
1. Right-click on any block's bullet to open *Block Context Menu*
2. Select the `«Copy as 🏛template»` item
3. Code to call the command will be copied to clipboard. Paste it to any block.

#### **Arguments**
##### `arg-`properties
Can be filled with properties with prefix `arg-`.

TODO

##### `:page`
TODO

##### `:block`
TODO

##### `:delay-until-rendered`

<!-- panels:start -->
<!-- div:left-panel -->
**Delay** the rendering process until the external rendering occurs. \
Use it when you need to **nest** a command inside another template and prevent it from rendering just in time.

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template «nested»***
``c.page.name``

#### ***Template***
Delayed rendering: \
*`{{renderer :template, nested, :delay-until-rendered}}`*

#### ***Rendered***
Delayed rendering: \
Test Page
<!-- tabs:end -->

<!-- panels:end -->

#### **Examples**
TODO


## Render view :id=template-view-command
Render existed template block, non-template block or page as 🏛view: rendering occurs every time the block becomes visible.

**Note**: rendered content will not be persisted. If you need to keep it, use [render template command](#template-command) instead.

**Note**: rendered page or block *references* will not be displayed in *Linked references* and *Block references* sections. If you need it to be displayed, use [render template command](#template-command) instead.

#### **Direct usage**
1. Call via `/`-command or *Command Palette* (`⌘⇧P` or `Ctrl+Shift+P`)
2. Select the `«Insert 🏛view»` command

#### **Indirect usage**
1. Right-click on any block's bullet to open *Block Context Menu*
2. Select the `«Copy as 🏛view»` item
3. Code to call the command will be copied to clipboard. Paste it to any block.

?> The arguments, examples and way of rendering are the same as for [render template command](#template-command). Only differences are reflected here.

TODO


## Render inline view :id=inline-view-command
Rendering inline view: fast way to render any 🏛syntax without creating a whole template block.

**Note**: The only syntax allowed here is [` `` `-syntax](reference__syntax.md#interpolation-syntax) and it will be **applied automatically**.

#### **Usage**
1. Call via `/`-command or *Command Palette* (`⌘⇧P` or `Ctrl+Shift+P`)
2. Select the `«Insert inline 🏛view»` command



## Convert template to new syntax style :id=convert-syntax-command
This command converts old template syntax style (used before `v3.0.0`) to new one. See details [here](changelog.md#new-syntax).

#### **Usage**
1. Select blocks with *old* plugin syntax
2. Run the *Command Palette* (`⌘⇧P` or `Ctrl+Shift+P`)
3. Select the `«Convert to new 🏛syntax»` command
