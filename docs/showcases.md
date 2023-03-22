`🏛template` means enhanced template from `Full House Templates` [plugin](https://github.com/stdword/logseq13-full-house-plugin#readme) ❤️

---

# Showcases

An interesting ways of how to use 🏛templates to color your life in Logseq

# Table of Contents
- [Daily Journal 🏛template](#daily-journal-template)
- [Fast links to Wikipedia.org](#fast-links-to-wikipediaorg)


## Daily Journal 🏛template

1) Setup standrad logseq template (with name "journals" for example)
2) Configure Logseq to use it in `config.edn`:
  ```clojure
  :default-templates {:journals "journal"}
  ```
3) Create 🏛template with everything you need. Let's get this one:
  ```markdown
  template:: journal-embed
  - ← [Yesterday](``{ ref(c.page.day.subtract(1, 'day')) }``) | [Tomorrow](``{ ref(c.page.day.add(1, 'day')) }``) →
  ```
4) Add macro for rendring 🏛template to "journals" template: `{{renderer :template, journal-embed, }}`
5) Note a special hanging comma after template name: this is hack to prevent macro from being rendered

> **Restriction 1**: You need to manually remove that comma every time you open a new day. But `Full House Templates` WILL have appropriate feature to do it for you — keep an eye on updates 👽

> **Restriction 2**: Logseq doesn't render "journal" template for new day on «Tomorrow» link click. It seems to be a Logseq bug 👿

Videos with these steps:
<table><tr><td>

<details closed><summary>1</summary>
  <video src="https://user-images.githubusercontent.com/1984175/226189999-4bfe8f12-b5c1-485a-95d6-bbee7970e24f.mp4"/>
</details>

</td><td>

<details closed><summary>2</summary>
  <video src="https://user-images.githubusercontent.com/1984175/226191378-e7361458-3272-45b9-ad34-72c0d819f8ed.mp4"/>
</details>
  
</td></tr></table>


## Fast links to Wikipedia.org

1) Create `wiki` 🏛template:
  ```markdown
  template:: wiki
  - ``{ ! var lang = c.args.lang ?? c.args.$1 ?? 'en' _}``
    [``{ c.page.name }`` — Wikipedia ``{ lang.toUpperCase() }``](https://``{ lang }``.wikipedia.org/wiki/``{ c.page.name }``)
  ```
  <img width="740px" src="https://user-images.githubusercontent.com/1984175/227020818-c245efbf-1ce0-4fa9-b07e-82b2e49d7d88.png"/>

2) Add new `:commnd` to Logseq `config.edn`:
  ```clojure
  :commands [
     ["wiki" "{{renderer :template, wiki, —, :lang en}}"],
  ]
  ```
3) Type-in `<wiki``↩︎` while editing any block:
  <img width="740px" src="https://user-images.githubusercontent.com/1984175/227035547-53e9580e-9843-49a4-bbb9-0f738c908c99.gif"/>

<table><tr><td>

<details closed><summary>Video with these steps</summary>
  <video width="40%" src="https://user-images.githubusercontent.com/1984175/227012394-99e1819e-9a67-4ed9-975e-5af6db76776d.mp4"/>
</details>
  
</td></tr></table>
