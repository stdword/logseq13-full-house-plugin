# [2.1.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v2.0.0...v2.1.0) (2023-04-01)


### Features

* **args:** simple notation of named arg (to set bool) ([ce33431](https://github.com/stdword/logseq13-full-house-plugin/commit/ce3343165bf12eec7671f82f67fd1ec697f9a91a))

# [2.0.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v1.5.0...v2.0.0) (2023-04-01)


### Bug Fixes

* check is rendering occurs from inside the macro ([320f059](https://github.com/stdword/logseq13-full-house-plugin/commit/320f0596bdb09144d69459e2bba0bb5fa7ff3b3f))
* error message not showing when template name is wrong ([58d8168](https://github.com/stdword/logseq13-full-house-plugin/commit/58d81689cac07f6645199ab012e473d9de6cae12))
* handle in-macro with missed block uuid ([be08ff1](https://github.com/stdword/logseq13-full-house-plugin/commit/be08ff1d089893036bbbd01dc10dc127df4455a7))
* multi block rendering view problem with paragraphs ([b5b7947](https://github.com/stdword/logseq13-full-house-plugin/commit/b5b7947ece2ab89d57cbc9fe8a48c757522ff6ca))
* preserve block uuid on copy command ([8f2af89](https://github.com/stdword/logseq13-full-house-plugin/commit/8f2af8990b5d97ed0069c21cf51621c045428d45))
* restrict plugin work inside the macro ([cfe9438](https://github.com/stdword/logseq13-full-house-plugin/commit/cfe94382c62108472a9fb3520ac87cf447c63abe))
* send single-char pages to context ([6668df9](https://github.com/stdword/logseq13-full-house-plugin/commit/6668df9fee918a0eb41482aae5afb1392911f8ed))


### Features

* **args:** removed positional page context argument ([fb79c1c](https://github.com/stdword/logseq13-full-house-plugin/commit/fb79c1cd0b6e5b3cbc37af5e4b171ba69c477ec9))
* beutify error messages for user ([a554ea9](https://github.com/stdword/logseq13-full-house-plugin/commit/a554ea98db8ff3c7c68c34921f1c1552a8bbe442))
* **notify:** breaking changes user notification ([c8cd377](https://github.com/stdword/logseq13-full-house-plugin/commit/c8cd377c33d09eb3957acbff7095f92ccffec043))
* **template-view:** :template-view command& replaces the macros system ([7023e5a](https://github.com/stdword/logseq13-full-house-plugin/commit/7023e5a83127d44de9188f39ed5be1143e7b2d46))
* **views:** add insert template view command ([6bdf913](https://github.com/stdword/logseq13-full-house-plugin/commit/6bdf9131f3b8af7d20019fae8ef6502b94fbf3d7))
* **views:** block ref displaying ([1435e24](https://github.com/stdword/logseq13-full-house-plugin/commit/1435e247b6af13d16d4d40e106f9d4853e1b3ba8))
* **views:** compile block references labels to html & make all compilation async ([07552d2](https://github.com/stdword/logseq13-full-house-plugin/commit/07552d280170fc5a73694bf9af5cdb429a507481))
* **views:** compiling block tree to html view ([bdff1c5](https://github.com/stdword/logseq13-full-house-plugin/commit/bdff1c543ced2d8e407ca79e5343e4e4e23e84f9))
* **views:** compiling external links ([d4e4c1c](https://github.com/stdword/logseq13-full-house-plugin/commit/d4e4c1c0013d4f7e4c951f21f27a8334f6b563fe))
* **views:** make refs clickable ([ada2e27](https://github.com/stdword/logseq13-full-house-plugin/commit/ada2e27a45d6b2b8d2a46d25df445ff48e3ad304))
* **views:** parsing mldoc ast to compile rendered view to html ([65fe95d](https://github.com/stdword/logseq13-full-house-plugin/commit/65fe95d85a258f0fa954b1555bffc0226a4f7936))
* **views:** restrict compiling by nesting levels ([bfd5992](https://github.com/stdword/logseq13-full-house-plugin/commit/bfd5992063f5ce279b61c8514aeb4ce573319975))
* **views:** show or hide ref brackets based on logseq config ([f98818c](https://github.com/stdword/logseq13-full-house-plugin/commit/f98818c666541593d0214de2d2c0c2a1b307d00a))
* **views:** special case for non-existent block ([d5ba14b](https://github.com/stdword/logseq13-full-house-plugin/commit/d5ba14b8c0619a00c16a06751cad6a3355543a60))
* **views:** support additional logseq markup syntax ([caa21cf](https://github.com/stdword/logseq13-full-house-plugin/commit/caa21cf958e6e789b68744cd5c954e00f14bb032))


### BREAKING CHANGES

* **args:** Args auto-shifts for the empty first arg case: {{renderer :template, wiki, —, ru}}
→ {{renderer :template, wiki, ru}}. But for non-empty — template behavior would be broken:
{{renderer :template, wiki, [[Logseq]], ru}} fills `c.page` with _current page_ instead of [[Logseq]].
And first positional argument would be [[Logseq]], not "ru". Manual change required: {{renderer
:template, wiki, :page [[Logseq]], ru}}

# [1.5.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v1.4.0...v1.5.0) (2023-03-22)


### Bug Fixes

* parsing properties ([ccaee78](https://github.com/stdword/logseq13-full-house-plugin/commit/ccaee78673c36ec4613372fae7b8c0e9bbb4d2eb))


### Features

* **template arguments:** use arguments inside the templates to customize rendering behaviour ([9ac9247](https://github.com/stdword/logseq13-full-house-plugin/commit/9ac92475f2b27d942794eef99870ae5c0cc9030c))

# [1.4.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v1.3.0...v1.4.0) (2023-03-21)


### Bug Fixes

* clearing template from system props ([3873243](https://github.com/stdword/logseq13-full-house-plugin/commit/3873243a4d4a470ae10236753d10f46905ceb83d))
* order of rendered blocks & bubling up wrong sibling ([94fc7a8](https://github.com/stdword/logseq13-full-house-plugin/commit/94fc7a8aa998b2ee94744da11359d6adf968d2ee)), closes [#1](https://github.com/stdword/logseq13-full-house-plugin/issues/1)


### Features

* replace only renderer macro during template rendering ([52b074b](https://github.com/stdword/logseq13-full-house-plugin/commit/52b074b7b285e197b5514aaa0b805fce67f9c549))

# [1.3.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v1.2.0...v1.3.0) (2023-03-20)


### Bug Fixes

* properties deletion; review properties erasing ([8764609](https://github.com/stdword/logseq13-full-house-plugin/commit/87646099fbb7ba8eedf74f00ac738dffacf840f1))


### Features

* **context:** `level` value & access to current `page` ([161f63e](https://github.com/stdword/logseq13-full-house-plugin/commit/161f63ee62a9802d84d15199937ca908a2e3d0c4))
* do not override block content on /-command inserting ([bcf8270](https://github.com/stdword/logseq13-full-house-plugin/commit/bcf82701ad38698e4446c361a98145a6d3e7a133))
* smart copy code context menu for template blocks ([fd45cb1](https://github.com/stdword/logseq13-full-house-plugin/commit/fd45cb15d2281b193cf3fd43690526e69320b745))
* **template tags:** `parentBlock` & `prevBlock`can be used to create refs; `bref` deprecated ([014ccbf](https://github.com/stdword/logseq13-full-house-plugin/commit/014ccbf9c5ef98e17877953098770b4ca0bbaa53))

# [1.2.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v1.1.0...v1.2.0) (2023-03-13)


### Bug Fixes

* added missed props context variable for page ([a0a56de](https://github.com/stdword/logseq13-full-house-plugin/commit/a0a56deeb06bd235810ad148e16c05f815d14b73))
* clear page properties in case of template rendering from page ([ba27389](https://github.com/stdword/logseq13-full-house-plugin/commit/ba2738910a460a36693628bc493029c71ebe65dc))
* date template tags refreshing ([7e42d92](https://github.com/stdword/logseq13-full-house-plugin/commit/7e42d925e99488cf4b55175cefb842448aba6af8))


### Features

* context command to render block ([b8aa85a](https://github.com/stdword/logseq13-full-house-plugin/commit/b8aa85a6d35c84af604db295239686abfb6b7a8e))

# [1.1.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v1.0.3...v1.1.0) (2023-03-08)


### Bug Fixes

* inserting renderer command ([1f3f1c9](https://github.com/stdword/logseq13-full-house-plugin/commit/1f3f1c9d331b5e27b92a6e46489357fb33cdc6e6))
* removing id property to prevent fake parent bug ([008d2e1](https://github.com/stdword/logseq13-full-house-plugin/commit/008d2e1ebae5a6138b6765120d9748806a1427d6))


### Features

* added possibility to override `template-including-parent` property when calling render ([ec0a5e1](https://github.com/stdword/logseq13-full-house-plugin/commit/ec0a5e1e25f969e8c43488c33dcf7846735c9f76))
* render page as a template rework & scan-rendering context variables ([16266dd](https://github.com/stdword/logseq13-full-house-plugin/commit/16266dd0f77204d8b2446fe2de3094ad4a65a9dc))
* render page as template ([832fc5d](https://github.com/stdword/logseq13-full-house-plugin/commit/832fc5d6fddb1369c23e0611e5b0743d58793b50))
* rendering non-template block incuding parent by default ([979693e](https://github.com/stdword/logseq13-full-house-plugin/commit/979693ec23387bf419535d95cf1ec0c8f441dc3c))

## [1.0.3](https://github.com/stdword/logseq13-full-house-plugin/compare/v1.0.2...v1.0.3) (2023-03-06)


### Bug Fixes

* review package structure — move icon to top-level ([87eaa70](https://github.com/stdword/logseq13-full-house-plugin/commit/87eaa70ac1d867a2294f53763f867917a89a110d))

## [1.0.2](https://github.com/stdword/logseq13-full-house-plugin/compare/v1.0.1...v1.0.2) (2023-03-06)


### Bug Fixes

* update tutorial and trigger build ([c9156df](https://github.com/stdword/logseq13-full-house-plugin/commit/c9156df8b67115cdd4660c0bc540858756c64677))

## [1.0.1](https://github.com/stdword/logseq13-full-house-plugin/compare/v1.0.0...v1.0.1) (2023-03-06)


### Bug Fixes

* return image for installation instructions ([01ec7f4](https://github.com/stdword/logseq13-full-house-plugin/commit/01ec7f411f8cea3ed0a6933bcc15123fa2b55908))

# 1.0.0 (2023-03-06)

> First public release

### Features

* add LogseqReference type to recognize any page or block refs ([238273e](https://github.com/stdword/logseq13-full-house-plugin/commit/238273e8403734ef7b6c865a0b6af0825e4ec4d6))
* universal reference to template ([0064e7b](https://github.com/stdword/logseq13-full-house-plugin/commit/0064e7b3dbaa5a3d2479a48c9d8f7ed15bac3c4e))
