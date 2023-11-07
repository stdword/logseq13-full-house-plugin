## How to use `🏛templates` with `:macros`? :id=using-with-macros
?> **Short answer**: In no way \
Use the more powerful [`:template-view`](reference__commands.md#template-view-command) command instead, specially designed for this case. \
\
The reason the plugin cannot work with `:macros` is that Logseq doesn't provide information about which macro was just used to the plugin.

### Why do you need to use `:macros`?
#### 1) To get block rendered every time (not just once)
`🏛 Full House` can do *exactly* the same with [`:template-view`](reference__commands.md#template-view-command) command. Just use [UI](reference__commands.md#view-insertion-ui) to insert any template as `🏛️view`.

#### 2) To use arguments `$1`, `$2`, ...
`🏛 Full House` supports [arguments](reference__args.md) too. And they can be _named_ and have _default values_! \
See [wiki template](https://github.com/stdword/logseq13-full-house-plugin/discussions/8) showcase as an example.

#### 3) To use Logseq dynamic variables
`🏛 Full House` can render [Logseq dynamic variables](https://docs.logseq.com/#/page/60311eda-b6f7-4779-8187-8830545b3a64) too. And in a more powerful way. See [navigation for Daily Journals](https://github.com/stdword/logseq13-full-house-plugin/discussions/6) example.

?> You can use both Logseq syntax and [🏛syntax](reference__syntax.md#standard-syntax) with the plugin:

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


?> A frequent problem with standard dynamic variables is an inability to separate `[[ ]]` from results. But with 🏛️syntax it is easy: just erase the `[ ]`:

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
