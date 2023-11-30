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

[![Version](https://img.shields.io/github/v/release/stdword/logseq13-full-house-plugin?color=5895C9)](https://github.com/stdword/logseq13-full-house-plugin/releases)
[![Downloads](https://img.shields.io/github/downloads/stdword/logseq13-full-house-plugin/total.svg?color=D25584)](https://github.com/stdword/logseq13-full-house-plugin#from-logseq-marketplace-recommended-way)

</div>

<p align="center"><i>A part of the <a href="https://logseq.com"><img align="center" width="20px" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/logseq.png?raw=true"/></a> <b><a href="https://github.com/search?q=owner%3Astdword+logseq13&type=repositories">Logseq13</a></b> family of plugins</i></p>

<p align="center">
⚠️ <b>Under active development</b> ⚠️
</p>


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
### Insert from lovely UI 🤗
<img width="500px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/df132005-7c72-4470-8a80-52c98485ab76"/>

<table><tr><td>

<details><summary>details</summary><p>

See info about `pages-tagged-with` in [Showroom](https://github.com/stdword/logseq13-full-house-plugin/discussions/21).

</p></details> 

</td></tr></table>

</p>

### Book page 📖
<img width="450px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/702dbb48-f70c-41d3-b78f-2f8fe764846a"/>
<p align="center">
  </br></br>
  <b>template     →     rendered</b>
  <br>
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

### Syntax power 💥
<img width="450px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/356f6dd6-f4d5-4a6c-9f72-0b2b776eb97d"/>
<p align="center">
  </br></br>
  <b>template     →     rendered</b>
  <br>
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


### Inline properties referencing 🔭
<img width="800px" src="https://github.com/stdword/logseq13-full-house-plugin/assets/1984175/d360c4a6-149b-449e-ae7f-2c68979ac074"/>

<table><tr><td>

<details><summary>details</summary><p>

See setup instructions in [Showroom](https://github.com/stdword/logseq13-full-house-plugin/discussions/34).

</p></details> 

</td></tr></table>


#### See all plugin features in the [Tutorial](https://stdword.github.io/logseq13-full-house-plugin/#/tutorial)


## If you ❤️ what I'm doing — consider to support my work
<p align="left">
  <a href="https://www.buymeacoffee.com/stdword" target="_blank">
    <img src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/coffee.png?raw=true" alt="Buy Me A Coffee" height="60px" />
  </a>
</p>


## Installation
### From Logseq Marketplace (recommended way):
<span>    </span><img width="40%" src="https://user-images.githubusercontent.com/1984175/223046274-e1b6a192-b7b5-4973-98f4-d9d2ff5ee048.png" />

- Click «...» and open the «Plugins» section (or press `t p`)
- Click on the «Marketplace»
- On the «Plugins» tab search for «Full House Templates» plugin and click install
- See the [Tutorial](https://stdword.github.io/logseq13-full-house-plugin/#/tutorial) to start using your new superpower :)

### Manual way (in case of any troubles with recommended way)
- Enable «Developer mode» in «...» → Settings → Advanced
- Download the latest plugin release in a raw .zip archive from here and unzip it
- Go to the «...» → Plugins, click «Load unpacked plugin» and point to the unzipped plugin
- ⚠️ The important point here is: every new plugin release should be updated manually


## FAQ
### How to insert frequently used templates rapidly fast?
1. Create the `:command` in `config.edn`.
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

## Alternatives
|Plugin|`🏛 Full House` support|Details|
|:-:|:-:|:--|
|[Dynamic Lookup](https://github.com/peanball/logseq-dynamic-lookup)| ✅ full | [→](https://stdword.github.io/logseq13-full-house-plugin/#/alternatives?id=dynamic-lookup) |
| [Smart Blocks](https://github.com/sawhney17/logseq-smartblocks) | ⚠️ partial | 🚫 buttons, 🚫 variables |
| [Power Blocks](https://github.com/hkgnp/logseq-powerblocks-plugin) | ⚠️ partial | 🚫 buttons, 🚫 variables |


## Roadmap
- UI: buttons
- UI: user input & variables


## Credits
- *Inspiration*:
  - [Obsidian Templater](https://github.com/SilentVoid13/Templater) by SilentVoid13
  - [Logseq SmartBlocks](https://github.com/sawhney17/logseq-smartblocks) by sawhney17
  - [Logseq Assets Plus](https://github.com/xyhp915/logseq-assets-plus) by xyhp915
- *Tech*:
  - Based on lightweight embedded JS templating engine: [Eta](https://github.com/eta-dev/eta)
  - [Day.js](https://day.js.org): a minimalist JavaScript library for dates and times work
  - [fuzzysort](https://github.com/farzher/fuzzysort): SublimeText-like fuzzy search
- Icon created by <a href="https://www.flaticon.com/free-icon/web-design_1085802" title="Flaticon">monkik</a>


## License
[MIT License](https://github.com/stdword/logseq13-full-house-plugin/blob/main/LICENSE)
