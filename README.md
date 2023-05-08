[<img align="right" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/coffee.png" height="30"/>](https://www.buymeacoffee.com/stdword)
<br/>
<p align="center">
⚠️ <b>Under active development</b> ⚠️
</p>

<p align="center">
  <img align="center" width="15%" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/icon.png?raw=true"/>
</p>

<h1 align="center" style="text-align: center; width: fit-content; margin-left: auto; margin-right: auto;">Full House Templates</h1>

<div align="center">

[![Version](https://img.shields.io/github/v/release/stdword/logseq13-full-house-plugin?color=5895C9)](https://github.com/stdword/logseq13-full-house-plugin/releases)
[![Downloads](https://img.shields.io/github/downloads/stdword/logseq13-full-house-plugin/total.svg?color=D25584)](https://github.com/stdword/logseq13-full-house-plugin#from-logseq-marketplace-recommended-way)

</div>

<!-- <p align="center"><i>A part of the <a href="https://logseq.com"><img align="center" width="20px" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/logseq.png?raw=true"/></a> <b>Logseq13</b> family of plugins</i></p> -->

<p align="center">
  <a href="https://github.com/stdword/logseq13-full-house-plugin#readme">Home</a> |
  <a href="docs/tutorial.md">Tutorial</a> |
  <a src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/docs/index.html"> Documentation</a> |
  <a href="https://github.com/stdword/logseq13-full-house-plugin/discussions/categories/showroom?discussions_q=is%3Aopen+label%3Aoriginal+category%3AShowroom">Showcases</a>
</p>


## Summary

Super-configurable, JavaScript-based Logseq Templates for Humans ❤️ focused on UX and simplicity. This is the missing power in your Logseq knowledge base.


## ⚜️ Features
- 💪 Rendering templates :)
- 🤘 Accessing to any meta information: pages titles, blocks properties & content, your graph, etc.
- 📅 Full support of dates-work: parsing, formatting, shifting
- 👁‍🗨 Use views (or dynamic templates) to get freshly updated data of your graph
- ☘️ Focusing on UX and simplicity: no more headache on where to add a space to make it work
- 🔗 Easily make a reference to any journal page: relative to now moment, the current page, specific date or whatever you want
- 👻 Custom logic with JS vars, conditions, loops and environment (if you know what I mean 😈)
- 🛠 A set of handy template tags to work with
- ✨ The long list of valuable ideas to implement ⤵️


## Very quick overview
<img width="60%" src="https://user-images.githubusercontent.com/1984175/222939346-f29ac2e0-5b68-461c-aed3-3853d6c0c6a2.gif" />

See all plugin features in the [Tutorial](https://github.com/stdword/logseq13-full-house-plugin/blob/main/docs/tutorial.md).

<table><tr><td>

<details><summary>Template</summary><p>

```markdown
- template:: book
  - ``{ ! var [ authors, name ] = c.page.name.split(' — ') _}``
    alias:: ``{ ref(name) }``
		author:: ``{ authors.split(', ').map(ref).join(', ') }``
		category:: [[📖/productivity]]
		tags:: book,
  - # Book overview
  - ...
  - rendered with template «``{ c.template.name }``» [→] (``{ ref(c.template.block) }``)
  - on ``{ date.now }``
```

```markdown
- [[Tiago Forte — Building a Second Brain]]
```

```markdown
- alias:: [[Building a Second Brain]]
  author:: [[Tiago Forte]]
  category:: [[📖/productivity]]
  tags:: book,
- # Book overview
- ...
- rendered with template «book» [→](((6403ec06-...)))
- on Sun, 05 Mar 2023 01:12:01 GMT
```
</p></details> 

</td><td>

<details closed>
  <summary><b>Video</b></summary>
  <video src="https://user-images.githubusercontent.com/1984175/222938639-a46f94dc-2a91-41c0-9f6e-9c877dc7b61b.mp4" controls="controls" muted="muted" class="d-block rounded-bottom-2 border-top width-fit" style="max-height:640px; min-height: 200px">
  </video>
</details>

</td></tr></table>


## If you ❤️ what I'm doing — consider to support my work
<p align="left">
<a href="https://www.buymeacoffee.com/stdword" target="_blank"><img src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/coffee.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
</p>


## Installation
### From Logseq Marketplace (recommended way):
<span>    </span><img width="40%" src="https://user-images.githubusercontent.com/1984175/223046274-e1b6a192-b7b5-4973-98f4-d9d2ff5ee048.png" />

- Click «...» and open the «Plugins» section (or press `t p`)
- Click on the «Marketplace»
- On the «Plugins» tab search for «Full House Templates» plugin and click install
- See the [Tutorial](https://github.com/stdword/logseq13-full-house-plugin/blob/main/docs/tutorial.md) to start using your new superpower :)

### Manual way (in case of any troubles with recommended way)
- Enable «Developer mode» in «...» → Settings → Advanced
- Download the latest plugin release in a raw .zip archive from here and unzip it
- Go to the «...» → Plugins, click «Load unpacked plugin» and point to the unzipped plugin
- ⚠️ The important point here is: every new plugin release should be updated manually


## Alternatives
|Plugin|`🏛 Full House` support|Details|
|:-:|:-:|:--|
|[Dynamic Lookup](https://github.com/peanball/logseq-dynamic-lookup)| ✅ full | [→](https://github.com/stdword/logseq13-full-house-plugin/blob/main/docs/alternatives.md#dynamic-lookup) |
| [Smart Blocks](https://github.com/sawhney17/logseq-smartblocks) | ⚠️ partial | 🚫 NLP-dates <br/> 🚫 UI (buttons, template selection, variables) |
| [Power Blocks](https://github.com/hkgnp/logseq-powerblocks-plugin) | ⚠️ partial | 🚫 NLP-dates <br/> 🚫 UI (buttons, template selection, variables) |


## Roadmap
- UI: views & templates selection
- UI: user input & variables
- UI: buttons
- Extended contexts
- Template selectors
- Meta templates & automation
- Compatibility with standard templates
- Extended template tags
- Logseq query language
- ...


## Credits
- Inspiration:
  - [Obsidian Templater](https://github.com/SilentVoid13/Templater) by SilentVoid13
  - [Logseq SmartBlocks](https://github.com/sawhney17/logseq-smartblocks) by sawhney17
- Based on lightweight embedded JS templating engine: [Eta](https://github.com/eta-dev/eta)
- [Day.js](https://day.js.org) a minimalist JavaScript library for dates and times work
- Icon created by <a href="https://www.flaticon.com/free-icon/web-design_1085802" title="Flaticon">monkik</a>


## License
[MIT License](https://github.com/stdword/logseq13-full-house-plugin/blob/main/LICENSE)
