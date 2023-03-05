<p align="center">
  <img align="center" width="15%" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/icon.png?raw=true"/>
</p>

<h1 align="center" style="text-align: center; width: fit-content; margin-left: auto; margin-right: auto;">Full House Templates</h1>

<p align="center"><i>A part of the <a href="https://logseq.com"><img align="center" width="20px" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/logseq.png?raw=true"/></a> <b>Logseq13</b> family of plugins</i></p>
<p align="center">
  <a href="https://github.com/stdword/logseq13-full-house-plugin">Home</a> |
  Tutorial | Showcases | Documentation
</p>

## Summary

Super-configurable, JavaScript-based Logseq Templates for Humans ❤️ focused on UX and simplicity. This is the missing power in your Logseq knowledge base.

## ⚜️ Features
- 💪 Rendering templates :)
- 🤘 Accessing to any meta information: pages titles, block properties, content, your graph, etc.
- 📅 Full support of dates-work: parsing, formatting, shifting
- ☘️ Focusing on UX and simplicity: no more headache on where to add a space to make it work
- 🔗 Easily make a reference to any journal page: relative to now moment, the current page, specific date ow whatever you want
- 👻 Custom logic with JS vars, conditions, loops and environment (if you know what I mean 😈)
- 🛠 A set of handy template tags to work with
- ✨ The long list of valuable ideas to implement ⤵️

## Very quick overview
<img width="60%" src="https://user-images.githubusercontent.com/1984175/222939346-f29ac2e0-5b68-461c-aed3-3853d6c0c6a2.gif" />

<details closed>
  <summary><b>Video</b></summary>
  <video src="https://user-images.githubusercontent.com/1984175/222938639-a46f94dc-2a91-41c0-9f6e-9c877dc7b61b.mp4" controls="controls" muted="muted" class="d-block rounded-bottom-2 border-top width-fit" style="max-height:640px; min-height: 200px">
  </video>
</details>

```markdown
- template:: book
  - ``{ ! var [ authors, name ] = c.page.name.split(' — ') _}``
    alias:: ``{ ref(name) }``
		author:: ``{ authors.split(', ').map(ref).join(', ') }``
		category:: [[📖/art]]
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
  category:: [[📖/art]]
  tags:: book,
- # Book overview
- ...
- rendered with template «book» [→](((6403ec06-...)))
- on Sun, 05 Mar 2023 01:12:01 GMT
```


## Installation


## Roadmap
- Dynamic rendering
- Inline templates
- Variables
- UI & buttons
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
- Icon created by <a href="https://www.flaticon.com/free-icon/web-design_1085802" title="Flaticon">monkik</a>

## License
[MIT License](https://github.com/stdword/logseq13-full-house-plugin/blob/main/LICENSE)
