# Showcases

An interesting ways of how to use `🏛templates` and `🏛views` to color your life in <a href="https://logseq.com"><img align="center" width="18px" src="https://github.com/stdword/logseq13-full-house-plugin/blob/main/assets/logseq.png?raw=true"/> Logseq</a>.

`🏛templates` means _enhanced templates_ from `Full House Templates` [plugin](https://github.com/stdword/logseq13-full-house-plugin#readme) ❤️

`🏛views` means a special way to render `🏛templates` (very similar to Logseq's `:macros`)

# Table of Contents
- [Daily Journal Template](#daily-journal-template)
- [Folding page reference](#folding-page-references)
- [Fast links to Wikipedia.org](#fast-links-to-wikipediaorg)

## Daily Journal Template

<img width="600px" src="https://user-images.githubusercontent.com/1984175/229267622-05da1ff3-1b5c-4632-a59c-fa0dc951e8a1.gif"/>

<details closed><summary>Steps</summary><p>

1) Setup standrad Logseq template (eg with name "journals")
2) Configure Logseq to use it in `config.edn`:
   ```clojure
   :default-templates {:journals "journal"}
   ```
3) Create `🏛view` with everything you need. Let's get this one:
   ```markdown
   template:: journal-embed
   - ``{ ! if (!c.page.day) return '[not in a journal page]' _}``
     ← [Yesterday](``{ ref(c.page.day.subtract(1, 'day')) }``) | [Tomorrow](``{ ref(c.page.day.add(1, 'day')) }``) →
   ```
4) Add code to render `🏛view` to "journals" template: `{{renderer :template-view, journal-embed}}`

</p></details>

<details closed><summary>Demo</summary>
  <video width="40%" src="https://user-images.githubusercontent.com/1984175/229267085-8819a19a-ae15-4d01-a63b-069f1a1649f3.mp4"/>
</details>


## Folding page references
<img width="500" src="https://user-images.githubusercontent.com/1984175/229267811-9e189490-f224-42ca-b1af-553d038d0018.gif"/>

<details closed><summary>Steps</summary><p>

1) Create *page* `🏛view`:
   ```markdown
   template:: page
   - ``{ ! var baseName = c.page.name.split('/').slice(-1)[0] _}``
     ``{ ! var prefix = c.page.name.indexOf('/') >= 0 ? '../' : '' _}``
     [``{ c.args.fold ? prefix + baseName : c.page.name }``](``{ ref(c.page) }``)
   ```
2) Use command `:template-view` to reference pages:
   ```clojure
   {{renderer :template-view, page}}
   {{renderer :template-view, page, :page Logseq}}
   ```
3) Or to fold references:
   ```clojure
   {{renderer :template-view, page, :fold}}
   ```
4) ⚠️ *Note*: these references wouldn't display in `Linked References` section

</p></details>

<details closed><summary>Demo</summary>
  <video width="40%" src="https://user-images.githubusercontent.com/1984175/229265422-ed83851b-0329-47a2-99a3-f35b91d0b5dd.mp4"/>
</details>



## Fast links to Wikipedia.org
<img width="420px" src="https://user-images.githubusercontent.com/1984175/229268302-08e508af-3820-4810-a8f9-2b62285762bc.gif"/>

<details closed><summary>Steps</summary><p>

1) Create *wiki* `🏛template`:
   ```markdown
   template:: wiki
   - ``{ ! var lang = c.args.lang ?? 'en' _}``
     [``{ c.page.name }`` — Wikipedia ``{ lang.toUpperCase() }``](https://``{ lang }``.wikipedia.org/wiki/``{ c.page.name }``)
   ```

2) Add new `:command` to Logseq `config.edn`:
   ```clojure
   :commands [
      ["wiki" "{{renderer :template, wiki, :lang ru}}"],
   ]
   ```
3) Type-in <kbd><</kbd> or <kbd>/</kbd> → `wiki` → <kbd>↩︎</kbd> while editing any block to render `🏛template`

</p></details>

<details closed><summary>Demo</summary>
  <video width="40%" src="https://user-images.githubusercontent.com/1984175/227012394-99e1819e-9a67-4ed9-975e-5af6db76776d.mp4"/>
</details>
