<h1 align="center">
<span align="left" height="30">                  </span>
Full House Templates
<a href="https://www.buymeacoffee.com/stdword">
  <img align="right" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/coffee.png?raw=true" height="30px"/>
</a>
</h1>

<p align="center">
  <a href="https://github.com/stdword/logseq13-full-house-plugin#readme">
    <img align="center" width="15%" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/icon.png?raw=true"/>
  </a>
</p>

<p align="center">
  <a href="https://stdword.github.io/logseq13-full-house-plugin/#/tutorial">Tutorial</a> |
  <a href="https://stdword.github.io/logseq13-full-house-plugin/">Documentation</a> |
  <a href="https://github.com/stdword/logseq13-full-house-plugin/discussions/categories/showroom?discussions_q=is%3Aopen+label%3Aoriginal+category%3AShowroom">Showcases</a>
</p>

<div align="center">

[![](https://img.shields.io/badge/status-support-e89829)](https://github.com/stdword/logseq13-full-house-plugin/releases)
[![Version](https://img.shields.io/github/v/release/stdword/logseq13-full-house-plugin?color=5895C9)](https://github.com/stdword/logseq13-full-house-plugin/releases)
[![Downloads](https://img.shields.io/github/downloads/stdword/logseq13-full-house-plugin/total.svg?color=D25584)](https://github.com/stdword/logseq13-full-house-plugin#from-logseq-marketplace-recommended-way)

</div>

<p align="center"><i>A part of the <a href="https://logseq.com"><img align="center" width="20px" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/logseq.png?raw=true"/></a> <b><a href="https://github.com/search?q=owner%3Astdword+logseq13&type=repositories">Logseq13</a></b> family of plugins</i></p>

> ‼️ The new Logseq DB version won't be supported.

## Summary

Super-configurable, JavaScript-based Logseq Templates for Humans ❤️ focused on UX and simplicity. This is the missing power in your Logseq knowledge base.


## ⚜️ Features
- 💪 Rendering templates :) Completely replaces standard templates (can render them all)
- 🤘 Accessing to any meta information: pages titles, blocks properties & content, your graph, etc.
- 📅 Full support of dates-work: parsing, formatting, shifting
- 👁‍🗨 Use views (or dynamic templates) to get freshly updated data of your graph
- ☘️ Focusing on UX and simplicity: no more headache on where to add a space to make it work
- 🔗 Easily make a reference to any journal page: relative to now moment, the current page, specific date or whatever you want
- 👻 High configurability with JavaScript logic: vars, conditions, loops (if you know what I mean 😈)
- 🛠 A set of handy [template tags](https://stdword.github.io/logseq13-full-house-plugin/#/reference__tags) to work with



## Very quick overview

### Create amazing views: `Glass Card` from Logseq.com landing page
<p align="center">
    <img src="https://user-images.githubusercontent.com/1984175/229943053-82aea6fb-3cd1-497a-967c-d76533a6cff4.png" width=45% />
    <img src="https://user-images.githubusercontent.com/1984175/229949828-01222090-bdbc-4a52-b39e-30dc5f91e2ce.gif" width=45% />
<table align="center"><tr><td>

<details><summary>details</summary><p>

See info about `glass-card` in [Showroom](https://github.com/stdword/logseq13-full-house-plugin/discussions/9).

</p></details> 

</td></tr></table>
</p>



### Insert templates from lovely UI 🤗
<img width="500px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/47bd578b-1781-47ed-a0b8-267d7474101f"/>

Use <kbd>⌘T</kbd> / <kbd>Ctrl + T</kbd> by default. See details in [documentation](https://stdword.github.io/logseq13-full-house-plugin/#/reference__commands?id=insertion-ui).



### Set cursor position after template insertion 🔱
<img width="450px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/82dd6aa4-b268-4ee6-af95-94b778da565d" />

See details in [documentation](https://stdword.github.io/logseq13-full-house-plugin/#/reference__syntax?id=cursor-positioning).



### Create parametrized data views 🪜
<img width="350px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/cd77cdb8-9336-4a44-94ee-00fb87961633"/>

<table><tr><td>

<details><summary>details</summary><p>

See info about `pages-tagged-with` in [Showroom](https://github.com/stdword/logseq13-full-house-plugin/discussions/21).

</p></details> 

</td></tr></table>

</p>



### Add logic to templates 📖
<p align="center">
  <b>                                                   template     →     rendered on page [[Tiago Forte — Building a Second Brain]]</b><br>
  <img src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/8fb8f5d0-c6d1-4759-98bd-891f9f6e5b51" width=49% />
  <img src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/28f29ada-13b4-485c-956f-667aa50c4d29" width=49% />


<table align="center"><tr><td>

<details><summary>details</summary><p>

```markdown
- template:: book
  - ``{ var [ authors, name ] = c.page.name.split(' — ') }``
    alias:: ``[name]``
		author:: ``authors.split(', ').map(ref).join(', ')``
		category:: [[📖/productivity]]
		tags:: book,
  - # Book overview
  - ...
  - rendered with template «``c.template.name``» [→] (``[c.template.block]``)
  - on ``date.now``
```
</p></details> 

</td></tr></table>

</p>



### Use shortcuts for templates 🎹
<img width="250px" src="https://github.com/user-attachments/assets/9e6f5678-9a7e-413d-ad9f-7d9ed4230869" />

See details in [documentation](https://stdword.github.io/logseq13-full-house-plugin/#/reference__configuring?id=insertion-shortcut).



### Create template buttons 🔘
<img width="550px" src="https://github.com/user-attachments/assets/7e1e3231-61c2-4eb2-8297-8c489c5fa9a5" />



### Easily perform actions on blocks 🥊
<img width="350px" src="https://github.com/user-attachments/assets/800b6078-c241-4010-b4e2-9b289f047ded" />

See details in [documentation](https://stdword.github.io/logseq13-full-house-plugin/#/reference__tags_advanced?id=blocks-actions).


### Create Live Views (auto-updated blocks) ✨
<img width="300px" src="https://github.com/user-attachments/assets/429bb925-18c0-470f-950b-346c0d981672" />

See details [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/55).


### Add missing Logseq commands ⌘
<img width="450px" src="https://github.com/user-attachments/assets/1a7e21f4-a7f1-43bc-861f-bde992ffd506" />

See details [here](https://github.com/stdword/logseq13-full-house-plugin/discussions/49).



### Create beutiful dashboards 🎛️
<img width="700px" src="https://github.com/user-attachments/assets/b6d0bbaf-0577-4fb4-a295-c931ad0d6948" />

<table><tr><td>
<details><summary>details</summary><p>

See info about `Monthly Pages` in [Showroom](https://github.com/stdword/logseq13-full-house-plugin/discussions/44).

</p></details>
</td></tr></table>



### Use query language to get pages info 📚
<p align="center">
  <b>template     →     rendered</b><br>
  <img src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/32bce2af-449e-439b-97cc-01c652d1ba7b" width=49% />
	
  <img src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/119ceed6-01f5-4f6c-b6bc-685d6f84ac28" width=49% />

<table align="center"><tr><td>

<details><summary>details</summary><p>

```javascript
``{
var books = query.pages()
  .tags('book')
  .property('likes')
    .value('>', '👍👍')
  .property('year')
    .value('>', 1994)
  .get()
  .sorted((p) => [p.props.likes, -p.props.year])
  .reverse()
  .groupby((p) => p.props.likes)
  .forEach(([likes, objs]) => {
     outn(likes)
     objs.forEach((p) => {
        out('   ' + p.props.year)
        outn(ref(p.propsRefs.alias.at(-1)))
     })
  })
}``
```
</p></details> 

</td></tr></table>

</p>



### And wrap query results to Logseq-like table view 📰
<img width="750px" src="https://github.com/user-attachments/assets/98e6aac1-4191-44e1-8f29-9bfa383a58ba" />

See details in [documentation](https://stdword.github.io/logseq13-full-house-plugin/#/reference__query_language__table).



### Mix with standard templates syntax 💥
<p align="center">
  <b>template     →     rendered</b><br>
  <img src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/d1724a02-9cb4-464b-8269-c4a2695c94f3" width=49% />
  <img src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/06afde10-ca50-4b4c-9869-a638ee808e40" width=49% />


<table align="center"><tr><td>

<details><summary>details</summary><p>

See details about `fold-page-ref` in [Showroom](https://github.com/stdword/logseq13-full-house-plugin/discussions/7).

```markdown
- Mixing [./Full House Templates]([[logseq/plugins/Full House Templates]]) and stadard {{renderer(:view,"c.page.namespace.parts[0]")}} templates syntax `'in one template'.bold()`
  template:: mix-syntax
  - Current page:
    - <% current page %>
    - `[c.page]`
    - `ref(c.page)` or `c.page.name`
  - Journal pages:
    - <% tomorrow %>
    - `[tomorrow]` or `date.tomorrow`
  - NLP dates:
    - <% in two days %>
    - `[date.nlp('in two days')]` or `date.nlp('in two days')`
```

<video src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/c0c45c08-66e4-41e3-8f76-533b6e91b372" controls="controls" muted="muted" class="d-block rounded-bottom-2 border-top width-fit" style="max-height:640px; min-height: 200px">
</video>

</p></details>

</td></tr></table>

</p>



### Create block references between template blocks 🖇️

<img width="400px" src="https://github.com/user-attachments/assets/ac0d6a63-f9ff-48f6-9f92-a37d2283a8ca"/>

See details in [documentation](https://stdword.github.io/logseq13-full-house-plugin/#/reference__tags_advanced?id=blocks-uuid).



### Mix with macros: Inline properties referencing example 🔭
<img width="800px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/d360c4a6-149b-449e-ae7f-2c68979ac074"/>

<table><tr><td>

<details><summary>details</summary><p>

See setup instructions in [Showroom](https://github.com/stdword/logseq13-full-house-plugin/discussions/34).

</p></details> 

</td></tr></table>



### See all plugin features in the [Tutorial](https://stdword.github.io/logseq13-full-house-plugin/#/tutorial)


## If you ❤️ what I'm doing — consider to support my work
<p align="left">
  <a href="https://www.buymeacoffee.com/stdword" target="_blank">
    <img src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/coffee.png?raw=true" alt="Buy Me A Coffee" height="60px" />
  </a>
</p>


## Installation
### From Logseq Marketplace (recommended way):
<span>    </span><img width="403px" src="https://user-images.githubusercontent.com/1984175/223046274-e1b6a192-b7b5-4973-98f4-d9d2ff5ee048.png" />

- Click «...» and open the «Plugins» section (or press `t p`)
- Click on the «Marketplace»
- On the «Plugins» tab search for «Full House Templates» plugin and click install
- See the [Tutorial](https://stdword.github.io/logseq13-full-house-plugin/#/tutorial) to start using your new superpower :)

### Manual way (in case of any troubles with recommended way)
- Enable «Developer mode» in «...» → Settings → Advanced
- Download the latest plugin release in a raw .zip archive from [here](https://github.com/stdword/logseq13-full-house-plugin/releases/latest) and unzip it
- Go to the «...» → Plugins, click «Load unpacked plugin» and point to the unzipped plugin
- ⚠️ The important point here is: every new plugin release should be updated manually


## FAQ
### How to fix colors of plugin UI for custom Logseq theme?
1. After the release of Logseq v0.10.5, some issues with plugin UI colors appeared
2. To fix them add following CSS rules to `custom.css`:
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

### How to insert frequently used templates rapidly fast?
0. Since `v4.2.0` you can use [shortctus](https://stdword.github.io/logseq13-full-house-plugin/#/reference__configuring?id=insertion-shortcut) feature.
1. **OR** you can create the `:command` in `config.edn`.
   **Hint**: to perform fast searches, use any command name, but add a special character (e.g. the dot «.»)
   ```clojure
   :commands
    [
    	["psy client session                                             [.]"
            [[:editor/input "{{renderer :template, psy → session, :page [[client ]], :online}}" {:backward-pos 13}]] ],
    ]
   ```
3. Restart Logseq with <kbd>⌘R</kbd> or <kbd>Ctrl+R</kbd>
4. Use `/`-command to insert template with only 3 key presses (`/.↩︎`):
   <img width="600px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/9d5f4314-9c67-4e84-96c6-a45a08d7d8f0"/>

### How to overcome the bug with new lines when using views?
It's Logseq's issue. Just append additional space «␣» to the end of every middle line.

<img width="200px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/8483a85a-6624-4dd0-8ccb-8a3856c566f7"/>


### How to use plugin with `:macros`?
**Short answer**: Use the more powerful [`:template-view`](https://stdword.github.io/logseq13-full-house-plugin/#/reference__commands?id=template-view-command) command instead, specially designed for this case.

The only reason to use macros is to reduce the length of text to type-in:
```
{{mymacro ARG1, ARG2}}
```
versus
```
{{renderer :template-view mytemplate, ARG1, ARG2}}
```
But for that purpose it is better to use `:commands` to [make it faster](#how-to-insert-frequently-used-templates-rapidly-fast).

**Long answer** is [here](https://stdword.github.io/logseq13-full-house-plugin/#/alt__macros).

## Alternatives
|Plugin|`🏛 Full House` support|Details|
|:-:|:-:|:--|
|[Smart Blocks](https://github.com/sawhney17/logseq-smartblocks)| ⚠️ partial | 🚫 forms |
|[Power Blocks](https://github.com/hkgnp/logseq-powerblocks-plugin)| ✅ full | |


## Credits
- *Inspiration*:
  - [Obsidian Templater](https://github.com/SilentVoid13/Templater) by SilentVoid13
  - [Logseq SmartBlocks](https://github.com/sawhney17/logseq-smartblocks) by sawhney17
  - [Logseq Assets Plus](https://github.com/xyhp915/logseq-assets-plus) by xyhp915
- *Tech*:
  - [Eta](https://github.com/eta-dev/eta): Lightweight embedded JS templating engine
  - [Day.js](https://day.js.org): A minimalist JavaScript library for dates and times work
  - [fuzzysort](https://github.com/farzher/fuzzysort): SublimeText-like fuzzy search
  - [NeatJSON](https://github.com/Phrogz/NeatJSON): Pretty-print JS-objects
- Icon created by <a href="https://www.flaticon.com/free-icon/web-design_1085802" title="Flaticon">monkik</a>


## License
[MIT License](https://github.com/stdword/logseq13-full-house-plugin/blob/main/LICENSE)
