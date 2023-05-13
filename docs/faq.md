## How to use `🏛templates` with `:macros`?
### Short answer
- _In no way_. Use the `:template-view` command instead, specially designed for this case
  <!-- TODO: add documentation link for :template-view -->
- > ⚠️ The reason `🏛 Full House` cannot work with `:macros` is a [bug](https://github.com/logseq/logseq/issues/8904) in how Logseq communicates with plugin inside a macro

### Long answer: Why do you need to use `:macros`?
  #### To get block rendered every time (not just once) to view freshly updated data
  - `🏛 Full House` can do <ins>exactly</ins> the same with `:template-view` command:
    ```
    {{renderer :template-view, TEMPLATE NAME}}
    ```
  - This is a bit longer then via `:macro`. But can be shortened with `:command`:
    1. Add the following command to config.edn:
      ```clojure
      :commands [
          ["view" [[:editor/input "{{renderer :template-view, NAME}}" {:backward-pos 6}]] ],
      ]
      ```
    2. Call it with `<view` or `/view` input then adjust the NAME to your `🏛template`

  #### To get result of Logseq [ dynamic variables](https://docs.logseq.com/#/page/60311eda-b6f7-4779-8187-8830545b3a64)
  - `🏛 Full House` can render dynamic variables too (and in more powerful way):

    | **Logseq dynamic variable** | **renders to** | **and `🏛 Full House` analogue** | **without `[[ ]]`** |
    | :---: | :---: | :---: | :---: |
    | `<% today %>` | [[2023-03-27 Mon]] | ` ``{ ref(today) }`` ` | ` ``{ today }`` ` |
    | `<% yesterday %>` | [[2023-03-26 Sun]] | ` ``{ ref(yesterday) }`` ` | ` ``{ yesterday }`` ` |
    | `<% tomorrow %>` | [[2023-03-28 Tue]] | ` ``{ ref(tommorow) }`` ` | ` ``{ tommorow }`` ` |
    | `<% time %>` | 22:44 | ` ``{ time }`` ` | — |
    | `<% current page %>` | [[Full House Templates]] | ` ``{ ref(c.page) }`` ` | ` ``{ c.page.name }`` ` |

  - Though it doesn't support _Natural Language Dates_ yet. But will be 💪

    ##### And what is more "powerful" here?
    - As an example you could create `🏛view` [to current page reference](https://github.com/stdword/logseq13-full-house-plugin/discussions/7)
    - Or navigation `🏛view` for [Daily Journals](https://github.com/stdword/logseq13-full-house-plugin/discussions/6)
    - Note the last table column: Easy distinction of page name and page reference
      - This is a frequent problem with standard dynamic variables

  #### To use arguments `$1`, `$2`, ... and make agile work with data
  - `🏛 Full House` supports arguments too. And they can be _named_ and have _default values_!
  - `{{renderer :template-view, wiki, Logseq, :lang ru}}` (see [wiki template showcase](https://github.com/stdword/logseq13-full-house-plugin/discussions/8))
