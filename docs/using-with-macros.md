# How to use `🏛 Full House Templates` with Logseq `:macros`?
> **Short answer**: _in no way_. Use the `:template-view` command instead, specially designed for this case

⚠️ The reason `🏛 Full House` cannot work with `:macros` is a [bug](https://github.com/logseq/logseq/issues/8904) in how Logseq communicates with plugin inside a macro

## Long answer: Why do you need to use `:macros`?
  - To get result of Logseq [dynamic variables](https://docs.logseq.com/#/page/60311eda-b6f7-4779-8187-8830545b3a64)
    - `🏛 Full House` can render dynamic variables too (and in more powerfull way):

      | **Logseq dynamic variable** | **renders to** | **and `🏛 Full House` analogue** | **without `[[ ]]`** |
      | :---: | :---: | :---: | :---: |
      | `<% today %>` | [[2023-03-27 Mon]] | ` ``{ ref(today) }`` ` | ` ``{ today }`` ` |
      | `<% yesterday %>` | [[2023-03-26 Sun]] | ` ``{ ref(yesterday) }`` ` | ` ``{ yesterday }`` ` |
      | `<% tomorrow %>` | [[2023-03-28 Tue]] | ` ``{ ref(tommorow) }`` ` | ` ``{ tommorow }`` ` |
      | `<% time %>` | 22:44 | ` ``{ time }`` ` | — |
      | `<% current page %>` | [[Full House Templates]] | ` ``{ ref(c.page) }`` ` | ` ``{ c.page.name }`` ` |
    
    - Thus it doesn't support _Natural Language Dates_. But will be
      
  - To get block rendered every time (not just once) to view freshly updated data
    - `🏛 Full House` can do <ins>exactly</ins> the same with `:template-view` command
    - `{{renderer :template-view, TEMPLATE NAME}}`
    - This is a bit longer then via `:macro`. But can be shortened with `:command`:
      - Add to config.edn following command:
        ```clojure
        :commands [
            "view" "{{renderer :template-view, NAME}}",
        ]
        ```
      - Call `view` with `<view` or `/view` input

  - To use arguments `$1`, `$2`, ... and make agile work with data
    - `🏛 Full House` supports arguments too. And the can be named and have default values!
    - `{{renderer :template-view, TEMPLATE NAME, arg1, :name arg2, ...}}`
