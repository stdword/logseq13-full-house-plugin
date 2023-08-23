## [3.1.1](https://github.com/stdword/logseq13-full-house-plugin/compare/v3.1.0...v3.1.1) (2023-08-23)


### Bug Fixes

* **rendering:** render page as a template ([54976ed](https://github.com/stdword/logseq13-full-house-plugin/commit/54976edac10e322ba389a26e3409c365cf6dc103))

# [3.1.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v3.0.0...v3.1.0) (2023-08-23)


### Bug Fixes

* **rendering:** inserting child blocks of first child node in non-inclusion parent mode ([a8bec22](https://github.com/stdword/logseq13-full-house-plugin/commit/a8bec2203b3259178cb432069e408259576e0333)), closes [#26](https://github.com/stdword/logseq13-full-house-plugin/issues/26)


### Features

* **tags:** support label param for `ref` ([78ab990](https://github.com/stdword/logseq13-full-house-plugin/commit/78ab9905b2e5ec2101add68b1f3261ae11fd92bb))

# [3.0.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v2.6.0...v3.0.0) (2023-08-14)


### Bug Fixes

* do not replace text if rendered template is empty ([8486445](https://github.com/stdword/logseq13-full-house-plugin/commit/8486445675f1d5d1df0a4a5ad72cc8289b65114d))
* **engine:** <% current page %> stands for current page, not for `c.page` ([af8156a](https://github.com/stdword/logseq13-full-house-plugin/commit/af8156a573157d987a4f334c3e04ab91e4eb0802))
* **engine:** add fool-protection for inline templates to prevent tags intersection ([b64136f](https://github.com/stdword/logseq13-full-house-plugin/commit/b64136f538464daf1044433ea89529948ec3870c))
* **engine:** handling quotes in protections code ([55a6af9](https://github.com/stdword/logseq13-full-house-plugin/commit/55a6af9958b09680bd39c2918134f8f476374e6c))
* **engine:** qoutes handling in corner cases ([6ca7be5](https://github.com/stdword/logseq13-full-house-plugin/commit/6ca7be558aef41f8a6f5e4a31c4b2716e85ac513))
* **engine:** trimming right whitespaces overriding ([6e975cc](https://github.com/stdword/logseq13-full-house-plugin/commit/6e975ccf23bad37a1f07b446cc205a7598bf97f3))
* fix link to docs in notification about :macros usage ([7003a07](https://github.com/stdword/logseq13-full-house-plugin/commit/7003a07b2912fbd2b3ff95fcce1b3a532286b4a8))
* propper c.template.name in case of accessing template by property name ([5738a47](https://github.com/stdword/logseq13-full-house-plugin/commit/5738a47517f09d53dd48c48fa4b97b597ea38d97))
* propper render of `c.identity` ([1bfb522](https://github.com/stdword/logseq13-full-house-plugin/commit/1bfb52224cc0172ef83d89a9585b75174dc27554))
* remove css rule for macros ([dbf38c1](https://github.com/stdword/logseq13-full-house-plugin/commit/dbf38c14b4dfaccc97d0d575f55301c8325d9308)), closes [#22](https://github.com/stdword/logseq13-full-house-plugin/issues/22)
* rendering `c.args` ([fbb3755](https://github.com/stdword/logseq13-full-house-plugin/commit/fbb3755fac0df3b1d919cedfbbb96f08c1326fbe))
* **rendering:** "template not found" when template is a first block of a page ([e022a56](https://github.com/stdword/logseq13-full-house-plugin/commit/e022a569201a6cbf621566ba4df106aa2c3681aa))
* **rendering:** prevent recursive rendering ([41458e1](https://github.com/stdword/logseq13-full-house-plugin/commit/41458e171872bca750bd6ad6865cf0f1c5b47acd))
* **tags:** `empty` template tag null value should be fallen back ([a2a225c](https://github.com/stdword/logseq13-full-house-plugin/commit/a2a225c65e81a9085644f651d4ad5e54de46ec28))
* **tags:** return null for `empty` template tag ([5c707a4](https://github.com/stdword/logseq13-full-house-plugin/commit/5c707a4a7e3302f1987881f20b756b107607b5a2))


### Features

* add isoWeek plugin for dayjs ([18196bf](https://github.com/stdword/logseq13-full-house-plugin/commit/18196bf386ae7c9ad1e8b344af99cdd5d534bddb))
* **args:** positional only args with syntax `c.args.$1` ([52f7caf](https://github.com/stdword/logseq13-full-house-plugin/commit/52f7caf07cdf7fbbb750a0391f445f62f7c4541f))
* **command:** command to convert template to a new syntax ([daf7ea9](https://github.com/stdword/logseq13-full-house-plugin/commit/daf7ea97a9d81d89ecd9a1f1336b0439d7f12eaa))
* **context:** added `page.namespace` ([73ba0bd](https://github.com/stdword/logseq13-full-house-plugin/commit/73ba0bda0cfbcb18247f4e20f52fbd272601a7e3))
* **engine:** autodetecting of syntax style ([ef6d611](https://github.com/stdword/logseq13-full-house-plugin/commit/ef6d6118e8d13bd9ddb841c83544cccbfea6ac56))
* **engine:** render basic standard templates syntax ([d61cb53](https://github.com/stdword/logseq13-full-house-plugin/commit/d61cb535a710cc897caa4ed57134f70658fa2639))
* **engine:** render standard templates syntax with nlp ([53d619d](https://github.com/stdword/logseq13-full-house-plugin/commit/53d619df2d749239fed04d933f865897a18a350d))
* **engine:** support new syntax for rendering tags ([ad75616](https://github.com/stdword/logseq13-full-house-plugin/commit/ad75616eb98cbdd958b298f749c268bcf908c128))
* **notifications:** add notification about new syntax; notify only old users ([c900fa4](https://github.com/stdword/logseq13-full-house-plugin/commit/c900fa46341c142934ad84e509068400431cbf18))
* provide delayed option for views ([3c1bb84](https://github.com/stdword/logseq13-full-house-plugin/commit/3c1bb84dddd6a8b8e251067beb1f4b9d66ad471e))
* **tags:** `date.nlp` template tag ([eef9e01](https://github.com/stdword/logseq13-full-house-plugin/commit/eef9e0193886ab6ce28d2375b899a2cb24645e93))


### BREAKING CHANGES

* **engine:** before: ``{ x }``, after: ``x``

# [2.6.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v2.5.1...v2.6.0) (2023-05-08)


### Features

* add option to delay rendering of `:template` command `:delay-until-rendered` ([51e902d](https://github.com/stdword/logseq13-full-house-plugin/commit/51e902d6c349733d45872d687412f01a23a32305))
* **context:** add `c.currentPage` & `c.currentBlock` ([5444b7a](https://github.com/stdword/logseq13-full-house-plugin/commit/5444b7a8b0088af64e359360ab1eb753d6128172))

## [2.5.1](https://github.com/stdword/logseq13-full-house-plugin/compare/v2.5.0...v2.5.1) (2023-04-13)


### Bug Fixes

* **views:** code block compiling ([7e62d8c](https://github.com/stdword/logseq13-full-house-plugin/commit/7e62d8c4ca32cc8233030db3a722e1c81626b61b))

# [2.5.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v2.4.0...v2.5.0) (2023-04-13)


### Features

* **inline views:** quickly create inline views in one edit ([592a1f1](https://github.com/stdword/logseq13-full-house-plugin/commit/592a1f1087b6b207dc48076d0ad3274f6be6b12e))
* **views:** support macros compiling to html ([a6a99e1](https://github.com/stdword/logseq13-full-house-plugin/commit/a6a99e1e7b055cdd7bd494e79fe3f9523d4ef719))

# [2.4.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v2.3.0...v2.4.0) (2023-04-11)


### Bug Fixes

* **args:** proper properties overriding with args ([98db356](https://github.com/stdword/logseq13-full-house-plugin/commit/98db35678468c0cce2bfa0df1904b948d406a513))
* html escape rendering error messages ([ad6665a](https://github.com/stdword/logseq13-full-house-plugin/commit/ad6665a94d3d5edce2a715c7e29823baf9dd4a1f))
* **template tags:** improve assets detection & fix dev.get ([479e388](https://github.com/stdword/logseq13-full-house-plugin/commit/479e388d80929adacc9733d7ab9aec5b79cc6d11))
* **views:** render image link only when "!" specified ([2f53eb2](https://github.com/stdword/logseq13-full-house-plugin/commit/2f53eb263359643f376841c3babd5be67ee0c708))


### Features

* **args:** default values for args via template block properties ([7161e1d](https://github.com/stdword/logseq13-full-house-plugin/commit/7161e1d13fedc5f5811892401536560b5ce674bb))
* **args:** specify false value for argument ([2937074](https://github.com/stdword/logseq13-full-house-plugin/commit/2937074f2c7513fd4b4833e6241cffde510b0fbd))
* code block parsing & assets protocol supporting for template tags ([b75ff38](https://github.com/stdword/logseq13-full-house-plugin/commit/b75ff38bde5a6da1ec732ec7972c07bfa3a0a3de))
* **context:** special `:block` arg to replace `c.block` context variable (behaves like a `:page`) ([d96640f](https://github.com/stdword/logseq13-full-house-plugin/commit/d96640f9cd9438a08e2d7557f3f7d8bbefbf71b1))
* support @-syntax for getting properties with dev.get ([3b0d95a](https://github.com/stdword/logseq13-full-house-plugin/commit/3b0d95ab87dbddaa7e529a8dd57612b23409ad92))
* **template tags:** added `dev.get` to access specified path for object ([3b5c680](https://github.com/stdword/logseq13-full-house-plugin/commit/3b5c680f70b0ac37f7c997008297eb1264543ded))
* **template tags:** added parseLinks ([c83bb22](https://github.com/stdword/logseq13-full-house-plugin/commit/c83bb22bbf4c4e8d1a0e5ea70aab97800c19101c))

# [2.3.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v2.2.0...v2.3.0) (2023-04-05)


### Features

* **context:** add extended graph info to `c.config` context var ([d15c817](https://github.com/stdword/logseq13-full-house-plugin/commit/d15c8178cd3437d241f0a505c0455cbed2f0b2fe))
* **context:** added c.identity.slot & c.identity.key to use with css inside the view ([56fad04](https://github.com/stdword/logseq13-full-house-plugin/commit/56fad04f119014e0f5aa45edd5dea5450966d90a))
* **template tags:** `when` now could reference its condition obj ([2df9944](https://github.com/stdword/logseq13-full-house-plugin/commit/2df99448dc1820ec77270540ca4129b7ae37f1ee))
* **template tags:** added dev.color ([7564a77](https://github.com/stdword/logseq13-full-house-plugin/commit/7564a77f10052ab5c4ea0e0b1e336412e15ea1c2))
* **template tags:** added when, dev.parseMarkup, dev.toHTML, dev.asset & update ref ([03f5f86](https://github.com/stdword/logseq13-full-house-plugin/commit/03f5f86e80e63687e52b0b6560f0c6022a0accc7))
* unwrap «```» before rendering any block ([0e7d1cd](https://github.com/stdword/logseq13-full-house-plugin/commit/0e7d1cd5e0f57b95aa62a78ab5c5a0ad0f351e20))
* **views:** support special assets url schema & links to images ([f51b31b](https://github.com/stdword/logseq13-full-house-plugin/commit/f51b31bea12c119384fcb1677db5155c10f63be8))

# [2.2.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v2.1.0...v2.2.0) (2023-04-02)


### Bug Fixes

* **args:** args are space sensitive in :template command ([30600eb](https://github.com/stdword/logseq13-full-house-plugin/commit/30600eb67a57dd0d3d9833526fbf1cd973e92415)), closes [#3](https://github.com/stdword/logseq13-full-house-plugin/issues/3)
* logseq reference with provided options bad parsing ([d88d37f](https://github.com/stdword/logseq13-full-house-plugin/commit/d88d37f76b5402b3c001a63fb052bb348eb351f5))
* template name is uuid whem there is no `template` property in block ([982d984](https://github.com/stdword/logseq13-full-house-plugin/commit/982d984f588cdf3fade0378fb0f0b17300f5b11e))
* **views:** single block view doesn't display ([2839d2f](https://github.com/stdword/logseq13-full-house-plugin/commit/2839d2f48a1cf8ee2683cb8e0826177b0633ba76))


### Features

* **args:** mask undefined named args with empty string ([7614029](https://github.com/stdword/logseq13-full-house-plugin/commit/761402949c5d10fefa0531731fab99451278e90c))

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
