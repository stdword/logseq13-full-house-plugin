## How to use `🏛templates` with `:macros`? :id=using-with-macros
?> **Short answer**: In no way \
Use the [`:template-view`](reference__commands.md#template-view-command) command instead, specially designed for this case \
\
The reason the plugin cannot work with `:macros` is a [bug](https://github.com/logseq/logseq/issues/8904) in how Logseq communicates with plugin inside a macro

### Long answer: Why do you need to use `:macros`?
#### 1) To get block rendered every time (not just once)
  - `🏛 Full House` can do <ins>exactly</ins> the same with [`:template-view`](reference__commands.md#template-view-command) command:
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

#### 2) To use arguments `$1`, `$2`, ...
`🏛 Full House` supports arguments too. And they can be _named_ and have _default values_! \
See [wiki template](https://github.com/stdword/logseq13-full-house-plugin/discussions/8) showcase or [*Reference*](reference__args.md) for arguments.

#### 3) To get result of Logseq [dynamic variables](https://docs.logseq.com/#/page/60311eda-b6f7-4779-8187-8830545b3a64)
`🏛 Full House` can render Logseq dynamic variables too. \
**NOTE**: You can use both Logseq syntax and 🏛syntax with the plugin. See details [here](reference__syntax.md#standard-syntax).

<!-- tabs:start -->
#### ***Logseq syntax***
`<% today %>` \
`<% yesterday %>` \
`<% tomorrow %>`

`<% time %>`

`<% current page %>`

#### ***🏛syntax***
` ``[today]`` ` \
` ``[yesterday]`` ` \
` ``[tomorrow]`` `

` ``time`` `

` ``[c.currentPage]`` `

#### ***Rendered result***
[[2023-03-27 Mon]] \
[[2023-03-26 Sun]] \
[[2023-03-28 Tue]]

22:44

[[Full House Templates]]
<!-- tabs:end -->

Also the plugin can render dynamic variables in a more powerful way:
- Creating `🏛view` instead of template. See examples: [folding references](https://github.com/stdword/logseq13-full-house-plugin/discussions/7), [navigation for Daily Journals](https://github.com/stdword/logseq13-full-house-plugin/discussions/6)
<!-- panels:start -->
<!-- div:left-panel -->
- A frequent problem with standard dynamic variables is an inability to separate `[[ ]]` from results. Just erase the `[ ]` in 🏛syntax to get:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***🏛syntax***
` ``today`` ` \
` ``yesterday`` ` \
` ``tomorrow`` `

#### ***Rendered result without `[[ ]]`***
2023-03-27 Mon \
2023-03-26 Sun \
2023-03-28 Tue
<!-- tabs:end -->
<!-- panels:end -->
