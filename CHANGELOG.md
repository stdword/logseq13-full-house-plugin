## [4.3.2](https://github.com/stdword/logseq13-full-house-plugin/compare/v4.3.1...v4.3.2) (2024-09-18)


### Bug Fixes

* **views:** display mode for different div-blocks ([6502ad4](https://github.com/stdword/logseq13-full-house-plugin/commit/6502ad4789f5898ccbae4f8be7bf67995672cf3f))

## [4.3.1](https://github.com/stdword/logseq13-full-house-plugin/compare/v4.3.0...v4.3.1) (2024-09-16)


### Bug Fixes

* **views:** css for displaying in breadcrumbs ([4154907](https://github.com/stdword/logseq13-full-house-plugin/commit/415490774ed27504da1ae2216ef40335cd64f4c6))

# [4.3.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v4.2.2...v4.3.0) (2024-09-15)


### Bug Fixes

* **context:** full overview ([6ec454a](https://github.com/stdword/logseq13-full-house-plugin/commit/6ec454a12434d4a78a7508e2372df3331dc269b2))
* **core:** sync filtering value for ``...`` and ``{ return ...}`` ways ([4eb9ff4](https://github.com/stdword/logseq13-full-house-plugin/commit/4eb9ff410af20ed66ba4b0ccf3cc3a43068c44cd))
* **tags:** dev.tree.sync improvements ([352b4ba](https://github.com/stdword/logseq13-full-house-plugin/commit/352b4bafa5ed639f93c32ba677d3de48d448ec2b))
* **tags:** display all template tags on `c.tags` ([bfedf9d](https://github.com/stdword/logseq13-full-house-plugin/commit/bfedf9d8910cde8d408323d54c8b7ef6f7412d56))
* **ui:** css colors for default white & black logseq themes ([bb2924c](https://github.com/stdword/logseq13-full-house-plugin/commit/bb2924cfe148b9d934ebc9bee1e1501d1764250c))
* **ui:** template / view insertion modes ([986f24f](https://github.com/stdword/logseq13-full-house-plugin/commit/986f24faaca927767eeb08c8776abc3ba550d8dc))


### Features

* **commands:** template buttons ([598e21b](https://github.com/stdword/logseq13-full-house-plugin/commit/598e21b31f198aa79d075d32cb386144fd4e2ca3))
* **tags:** live views via dev.tree.sync ([748aa66](https://github.com/stdword/logseq13-full-house-plugin/commit/748aa6663c17524333c19361f007d0ca6aaebf63))

## [4.2.2](https://github.com/stdword/logseq13-full-house-plugin/compare/v4.2.1...v4.2.2) (2024-09-02)


### Bug Fixes

* remove race condition whe positioning cursor in selection mode ([34e4a80](https://github.com/stdword/logseq13-full-house-plugin/commit/34e4a8097f4ff2834aad12ebc291e09da0bcb990))

## [4.2.1](https://github.com/stdword/logseq13-full-house-plugin/compare/v4.2.0...v4.2.1) (2024-08-27)


### Bug Fixes

* add new notification for users about version release ([7179eb7](https://github.com/stdword/logseq13-full-house-plugin/commit/7179eb703ab79d899f6a304365eb93167e58887b))

# [4.2.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v4.1.0...v4.2.0) (2024-08-27)


### Bug Fixes

* **core:** do not parse ``...`` when there is new line inside ([fe4a2be](https://github.com/stdword/logseq13-full-house-plugin/commit/fe4a2bebc11a2e90b6c7c4927614fe4df8fdaa9b))
* **core:** fail on returning null or undefined in template body ([f40078c](https://github.com/stdword/logseq13-full-house-plugin/commit/f40078c3d81bf8167d1eecbb5e3db9efe94002b0))
* forgotten lines ([fc88613](https://github.com/stdword/logseq13-full-house-plugin/commit/fc886139dbe46fe065ee8415a37c0e8a26e363a1))
* linter warnings ([011147f](https://github.com/stdword/logseq13-full-house-plugin/commit/011147f07e4e52e75252ed8b10b4b44de4226cd6))
* **tags:** dev.context.page fix for different object structures ([59d17e1](https://github.com/stdword/logseq13-full-house-plugin/commit/59d17e1addc2e544c8db4349c3f9ce4988f2c386))
* **tags:** layout.args for boolean values ([f0bd749](https://github.com/stdword/logseq13-full-house-plugin/commit/f0bd749db27f6ebefadfd7b26e247dd082670244))
* typescript errors & tests ([e7ca1a7](https://github.com/stdword/logseq13-full-house-plugin/commit/e7ca1a75c5da4af0f70e74720d70e45670cb3380))
* wrong import ([5f0d181](https://github.com/stdword/logseq13-full-house-plugin/commit/5f0d1818fb6c2f5ebf1e9ae312a7a5a33c3f8b51))


### Features

* **core:** a way to skip unwrapping code block (with added space after ```) ([90c5940](https://github.com/stdword/logseq13-full-house-plugin/commit/90c5940bbd937d23051f5d1c19ea86b0a797fc29))
* **core:** add .ignore flag to parsing options ([e1ec3d4](https://github.com/stdword/logseq13-full-house-plugin/commit/e1ec3d4a8e595dc8f7b80c1831bf745c00a1fe4e))
* **core:** block rendering of sub-tree with `return undefined` statement ([62c9e76](https://github.com/stdword/logseq13-full-house-plugin/commit/62c9e769166c7e4a0d8183a02f34c0cfb7b6dd8a))
* **core:** don't reqire edit mode or selection mode for templates with shortcuts ([80b197b](https://github.com/stdword/logseq13-full-house-plugin/commit/80b197b5ba26a727a87ea3b05a3741ba5e4991a2))
* **core:** render current block slash-command ([ba52e58](https://github.com/stdword/logseq13-full-house-plugin/commit/ba52e589e1698161b3d20dda151fc3b831d46baf))
* notify user about frocing insertion as view or template ([6f2a609](https://github.com/stdword/logseq13-full-house-plugin/commit/6f2a609b2ceea133da7bbf5baf6bd2f8c8bff7bf))
* refactor cursor positioning after insertion ([4266e99](https://github.com/stdword/logseq13-full-house-plugin/commit/4266e994b6a60bcb951d4522c3ee65e772cbddab))
* **rendering:** instant templates insertion ([a0320c9](https://github.com/stdword/logseq13-full-house-plugin/commit/a0320c92a49c9f62991f283572f71d37650aa255))
* shortcuts for templates ([b75db7a](https://github.com/stdword/logseq13-full-house-plugin/commit/b75db7af80332b404b97fc67be380369d79579af))
* sync changed shortcuts for template ([afd024d](https://github.com/stdword/logseq13-full-house-plugin/commit/afd024d5990cabde9738c89b28353cb4c03212d7))
* **tags:** blocks.actions.update ([050e2e6](https://github.com/stdword/logseq13-full-house-plugin/commit/050e2e66b62d582f66c030b1ab8e1b3c0bc93114))
* **tags:** blocks.edit ([12077a1](https://github.com/stdword/logseq13-full-house-plugin/commit/12077a10c15dadeeed6d506e57f3c2e144e413c0))
* **tags:** blocks.selected ([e838d84](https://github.com/stdword/logseq13-full-house-plugin/commit/e838d8405f277ba4806cc0e97bb10a00dc0219cb))
* **tags:** blocks.skip ([fb30043](https://github.com/stdword/logseq13-full-house-plugin/commit/fb3004342cabac86da0f02305562185e81a462bf))
* **tags:** dev.color improved ([e38b259](https://github.com/stdword/logseq13-full-house-plugin/commit/e38b259bf49b005765840010222c1802a65fffd6))
* **tags:** template tags: sleep, dev.cssVars, cursor.selection ([aa92538](https://github.com/stdword/logseq13-full-house-plugin/commit/aa92538557ad06ffebba75e62a3024a8dc5433f1))
* try to keep cursor position for render-this-block command ([e1e32cd](https://github.com/stdword/logseq13-full-house-plugin/commit/e1e32cd407ad30505412abafe359f7edfe35339e))
* **ui:** show template shortcut in the ui list ([6d5b3da](https://github.com/stdword/logseq13-full-house-plugin/commit/6d5b3da97965d2d094588ff23270f385cffc6c92))

# [4.1.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v4.0.0...v4.1.0) (2024-07-22)


### Bug Fixes

* **inserting:** update props of current block with props from head block ([5be70b6](https://github.com/stdword/logseq13-full-house-plugin/commit/5be70b6187bcd754eeb0800da2aeff697c93206a))
* **tags:** block.uuid return real uuid for template head block (no need to replace refs) ([5cecf97](https://github.com/stdword/logseq13-full-house-plugin/commit/5cecf976246196c2c1979f9c64f43ef52ab69439))
* **tags:** blocks.uuid for view rendering ([9c75045](https://github.com/stdword/logseq13-full-house-plugin/commit/9c7504568198d3de67a9f53d8d0c51a642a600c6))
* **tags:** dev.get usage of negative index ([f8ff2d6](https://github.com/stdword/logseq13-full-house-plugin/commit/f8ff2d6d93194b7ea91ebcfaf3233afa852a8705))
* **tags:** query.table corner cases ([e9544c4](https://github.com/stdword/logseq13-full-house-plugin/commit/e9544c42a4685c69fc7fdeccb376ea8295571b3f))
* **views:** rendering of ref to unexisted block ([3d8770f](https://github.com/stdword/logseq13-full-house-plugin/commit/3d8770f12b8ec5ef2a6b6cb543f639984bab66c7))


### Features

* **args:** mixed named & positional access to args ([6daec59](https://github.com/stdword/logseq13-full-house-plugin/commit/6daec5937c31f4d56eaea569acbb85332f7d05f7))
* **query for pages:** filter by journals ([fa3400f](https://github.com/stdword/logseq13-full-house-plugin/commit/fa3400fd8087452c771a6d619a5d2543c559c985))
* **query language:** .valueType filter ([106a38a](https://github.com/stdword/logseq13-full-house-plugin/commit/106a38afa55cbe018842b02abdc8249d2d8db8dc))
* **tags:** array function .zipWith ([946f666](https://github.com/stdword/logseq13-full-house-plugin/commit/946f666dc493aeeacac9cf704415971516884db5))
* **tags:** blocks.uuid for future block UUID ([42c7332](https://github.com/stdword/logseq13-full-house-plugin/commit/42c73329a58ae61fc911c1afe12d21310ce24496)), closes [#46](https://github.com/stdword/logseq13-full-house-plugin/issues/46)
* **tags:** query.table & query.table_ ([b6ed240](https://github.com/stdword/logseq13-full-house-plugin/commit/b6ed240b2303c52701886ec47e1da00fa9844a93))
* **tags:** query.table: accessing custom fields & sorting by custom field ([2eec704](https://github.com/stdword/logseq13-full-house-plugin/commit/2eec70412b37656e896f7352ed6a1afcae39d78f))
* **tags:** setUUID support for spawned blocks ([d97f66b](https://github.com/stdword/logseq13-full-house-plugin/commit/d97f66b689ebad285764afcdfa050c950efbd4e1))

# [4.0.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v3.4.0...v4.0.0) (2024-07-11)


### Bug Fixes

* **context:** review c.config contents ([4938926](https://github.com/stdword/logseq13-full-house-plugin/commit/493892677352e4871b7374a88cf312df5c69ace2))
* **core:** cursor positioning bug with empty spaces before and after cursor marker ([969cb87](https://github.com/stdword/logseq13-full-house-plugin/commit/969cb87cdf9301a2dbce24ca56fe1a12e2505bef))
* **core:** cursor positioning find order ([61d572c](https://github.com/stdword/logseq13-full-house-plugin/commit/61d572cdf53760d74a0b439d70dd44f08c05579a))
* **core:** cursor positioning when including templates: corner case for head ([9832fa1](https://github.com/stdword/logseq13-full-house-plugin/commit/9832fa17da91a501d64bf4ebaac3ea6ad12548de))
* **core:** order of code execution: as block follows ([a753c9d](https://github.com/stdword/logseq13-full-house-plugin/commit/a753c9d4d9b7f33e2474c5489e68b8ded8433fd5))
* **docs:** scrolling to anchor bug ([334fa2d](https://github.com/stdword/logseq13-full-house-plugin/commit/334fa2d72c3e2e8404b9d42aee8e55232c1b8950))
* **docs:** toc scroll highlighting bug ([51a694d](https://github.com/stdword/logseq13-full-house-plugin/commit/51a694d7eadf7683c812be0e8a179ab9f19ff6a4))
* escaping named args while transcluding templates ([1482583](https://github.com/stdword/logseq13-full-house-plugin/commit/1482583063e6609b5dd5002860ca36cbdb891135))
* improve nacro mode pattern matching ([5ea6083](https://github.com/stdword/logseq13-full-house-plugin/commit/5ea60834be4474165c588cef1a41e52d61811075))
* insertion ui: losing focus on tab key ([d6bf556](https://github.com/stdword/logseq13-full-house-plugin/commit/d6bf55670aa4daa3ee98885942a430690ce39209))
* propper work of escaping regex ([55792b2](https://github.com/stdword/logseq13-full-house-plugin/commit/55792b2ff672c107ba2095e5f7ed975e35cc855c))
* **query:** filtering by value for includes, starts with & ends with operations ([7f253ce](https://github.com/stdword/logseq13-full-house-plugin/commit/7f253ce8c96bab7b6cbc2c348343f7e4a03fac48))
* remove autoselection of syntax ([76499f7](https://github.com/stdword/logseq13-full-house-plugin/commit/76499f74f598aa1b8ed91569657c660c972a6924))
* remove template-list-as and template-usage properties when template-including-parent is YES ([1ae4566](https://github.com/stdword/logseq13-full-house-plugin/commit/1ae4566f95725f06b5a824ded7ebd49d2f43f684)), closes [#39](https://github.com/stdword/logseq13-full-house-plugin/issues/39)
* rendering template when user return custom value within template ([68e1f74](https://github.com/stdword/logseq13-full-house-plugin/commit/68e1f74b60c9e290da5ec8dd1ba328aac2b34275))
* sometimes dumping context variables fails to render in logseq ([fba29f1](https://github.com/stdword/logseq13-full-house-plugin/commit/fba29f17b8ec92bb0637ea1da9fcc62884080cf1))
* **tags:** changing default value for .countby & .groupby ([b3d8262](https://github.com/stdword/logseq13-full-house-plugin/commit/b3d8262a4cdbbfbd6ce34b5082f575e36fc9c7ef))
* **tags:** complete review of include and layout template tags + docs ([26dd906](https://github.com/stdword/logseq13-full-house-plugin/commit/26dd906efa2bb5563fcb6764341355244755c49e))
* **tags:** dev.dump and context objects displaying issues with spaces ([26fea51](https://github.com/stdword/logseq13-full-house-plugin/commit/26fea519f52c34aad25b88be33d8f2e0bd082f29))
* **tags:** dev.get now could return an array of strings ([041851d](https://github.com/stdword/logseq13-full-house-plugin/commit/041851d27d1e1d4fd1e8d86ac34c8304d09a99ce))
* **views:** fix support of highlighting text ([2ea6445](https://github.com/stdword/logseq13-full-house-plugin/commit/2ea6445873490e52c89884d14b6b662f354ee8c0))
* **views:** improve compilation of logseq markup to HTML ([7d55f87](https://github.com/stdword/logseq13-full-house-plugin/commit/7d55f870d61779924795cbde6b456f94700fb2fd))


### Build System

* make version increment ([3918f27](https://github.com/stdword/logseq13-full-house-plugin/commit/3918f2702b55084eeb9a99eed45fa6ef7c222676))


### Features

* change ui appearence according to sellected blocks ([991b7e6](https://github.com/stdword/logseq13-full-house-plugin/commit/991b7e6993f0c6d8f33cdee344bb4a757f0ea60a))
* **core:** cross-block scoped js vars ([446c413](https://github.com/stdword/logseq13-full-house-plugin/commit/446c413f14d8dbc6c6aaae87ef0349f422f07c79))
* **core:** inserting new blocks at runtime ([31b0bad](https://github.com/stdword/logseq13-full-house-plugin/commit/31b0bad2c2d97ad0bba26e2a07a707be234c4231))
* **core:** make returnin values from templates look pretty ([0200fbe](https://github.com/stdword/logseq13-full-house-plugin/commit/0200fbeaf07ea7fc5b4ebbd5be4964a9689210ca))
* **core:** passing execution environment back to template tags ([b27cc05](https://github.com/stdword/logseq13-full-house-plugin/commit/b27cc05681690c94b1db742c3917e52716f29c64))
* **core:** pretty printing values returning from templates ([955c66e](https://github.com/stdword/logseq13-full-house-plugin/commit/955c66ee4f3ce4d260acdf2c2ac51135acaed77a))
* **core:** set cursor position ([16a9b36](https://github.com/stdword/logseq13-full-house-plugin/commit/16a9b366f33d13890776599a654e34889f1ec878)), closes [#13](https://github.com/stdword/logseq13-full-house-plugin/issues/13)
* **docs:** scroll rigth toc sidebar according to current view ([c076344](https://github.com/stdword/logseq13-full-house-plugin/commit/c076344d6c4850d303a44c4d5dcbcb4bd12e567e))
* macro mode ([f258c02](https://github.com/stdword/logseq13-full-house-plugin/commit/f258c023d82726cc46dec8d78cdfbefc02e07d47))
* prototype of Action template ([6de9754](https://github.com/stdword/logseq13-full-house-plugin/commit/6de9754c24cda724297b742cf607fbb097729ba8))
* **query:** .referenceCount filter ([c49e89c](https://github.com/stdword/logseq13-full-house-plugin/commit/c49e89ccaed1831825c383b0c66ccd4eb94ce5c0))
* support locales based on logseq settings ([cc90aba](https://github.com/stdword/logseq13-full-house-plugin/commit/cc90aba9ae8956b0ae2ec36ecf5a6cb56f1a9279)), closes [#40](https://github.com/stdword/logseq13-full-house-plugin/issues/40)
* **tags:** `array.countby` & wrap to object option ([c1f62af](https://github.com/stdword/logseq13-full-house-plugin/commit/c1f62af457b085e972fb43e264fa4d1b53101407))
* **tags:** add dev.tree.* namespace & dev.tree.getNode template tags with docs ([bf3588d](https://github.com/stdword/logseq13-full-house-plugin/commit/bf3588d36d5e7508883616eaf7b3c6ab3a2a8d05))
* **tags:** added cursor() template tag to position cursor from ``{...}`` ([4c83f2c](https://github.com/stdword/logseq13-full-house-plugin/commit/4c83f2c7d8be0b95616f6530e3dd35107df83999))
* **tags:** dev.compileMarkup, dev.cleanMarkup template tags ([a4a33d3](https://github.com/stdword/logseq13-full-house-plugin/commit/a4a33d36f8997ef0b5ec1c03e021154c61109668))
* **tags:** dev.dump template tag ([d51fbeb](https://github.com/stdword/logseq13-full-house-plugin/commit/d51fbeb33ba9a2eea29809fe5757bb70ffe56ceb))
* **tags:** improve `query.refs.pages` & `query.refs.journals` to retrieve block props ([5858a4d](https://github.com/stdword/logseq13-full-house-plugin/commit/5858a4dc33e467145688268b7f18f71fa435dcf1))
* **tags:** include.veiw, include,inlineView and lazy param for include & layout ([b315c6c](https://github.com/stdword/logseq13-full-house-plugin/commit/b315c6cf49fad15cb7a88109f37ee2fbfa9ed368))
* **tags:** layout.args ([ced84e1](https://github.com/stdword/logseq13-full-house-plugin/commit/ced84e14623c5a62ddbf652243d1a616f69ee873))
* **tags:** new template tag `date.fromJournal` ([5d43b87](https://github.com/stdword/logseq13-full-house-plugin/commit/5d43b870a8dcec2090c36306e7d13bfce92701eb))
* **tags:** now `layout.args` could have specified values for arguments ([58b5a8f](https://github.com/stdword/logseq13-full-house-plugin/commit/58b5a8f42f483d87008ffee6cad68019174298fe))
* **tags:** parse.links, parse.refs, dev.refs template tags ([f9b75f6](https://github.com/stdword/logseq13-full-house-plugin/commit/f9b75f6f0643e7f5f961f8b32bdc2be201bffa4a))
* **tags:** review dev.get template tag ([c95fe4e](https://github.com/stdword/logseq13-full-house-plugin/commit/c95fe4ea11dc782c83e07622e342e7270425ed28))
* **tags:** spawn and append whole tree template tags ([d8b5857](https://github.com/stdword/logseq13-full-house-plugin/commit/d8b58570d5657226dcee2abbb731e83746272135))
* **views:** resolve page aliases when clicking on refs ([c2eeff8](https://github.com/stdword/logseq13-full-house-plugin/commit/c2eeff821bfe8cba686ed04a3f361ff8fe6485bd))


### BREAKING CHANGES

* see change log for details

# [3.4.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v3.3.0...v3.4.0) (2024-02-20)


### Bug Fixes

* allow return from code block ``{...}`` value of any type ([ab82608](https://github.com/stdword/logseq13-full-house-plugin/commit/ab82608cd3668ee94ad1c302fbfb81421c8ed6ea))
* bug when logseq hidden properties prepend ([63d275c](https://github.com/stdword/logseq13-full-house-plugin/commit/63d275cd31429cddfbc474cb29ed7ca008cfb37e))
* coercing property args to bool only with ? ending ([b5c2503](https://github.com/stdword/logseq13-full-house-plugin/commit/b5c2503841bc4229d7b37f6b568f5ecad00dc913))
* dayjs timezone plugin ([aa94272](https://github.com/stdword/logseq13-full-house-plugin/commit/aa94272058395474d2f5cb2db2e34fe53179a64e))
* displaying c.tags.date context ([ccfec09](https://github.com/stdword/logseq13-full-house-plugin/commit/ccfec09d1ed5db5d19989ae6cf7074c103b79ea8))
* **query:** bug with query cloning ([af38b2a](https://github.com/stdword/logseq13-full-house-plugin/commit/af38b2a607bf961f877215230436d4e3dd161392))
* remove old css var ([b01794f](https://github.com/stdword/logseq13-full-house-plugin/commit/b01794ff069dbb96a5dfc7c8ab61d902f064ffbe))
* remove protected mode for ``...`` ([8becb07](https://github.com/stdword/logseq13-full-house-plugin/commit/8becb077a462020fce2c2ac95ae658abd09bf375))
* **tags:** `empty` template tag & add docs ([9a3921e](https://github.com/stdword/logseq13-full-house-plugin/commit/9a3921e4115844e61ec8b0a3ab0dd8bd259e519b))
* **tags:** `when` template tag & add docs ([3b83f1d](https://github.com/stdword/logseq13-full-house-plugin/commit/3b83f1d0036fdb2d58ac249704619f1096fff72b))
* **views:** escaping values for views rendering ([985454f](https://github.com/stdword/logseq13-full-house-plugin/commit/985454f2ed359f30abca7c823e427a6d38fac333))
* xss improvements while parsing ([089732b](https://github.com/stdword/logseq13-full-house-plugin/commit/089732b6a64d55de3cd52450924d5a53ee989758))


### Features

* add start of week setup for dayjs ([4b58b49](https://github.com/stdword/logseq13-full-house-plugin/commit/4b58b497d79f9713211061434ec3a54655418382))
* added c.tags context to get all available tag utils and its signatures ([212e5ed](https://github.com/stdword/logseq13-full-house-plugin/commit/212e5edac3cc8093b87e7acc90d07107aa00a39a))
* allow usage of async/await in custom JS templates ([0a860b7](https://github.com/stdword/logseq13-full-house-plugin/commit/0a860b77720421ef85614fe4c072dffc8cb2d4e5))
* **args:** coercing arg-properties with «?» to bool ([444b2fc](https://github.com/stdword/logseq13-full-house-plugin/commit/444b2fc2a6397f8e0516d3134c8bff1a3cb96f18))
* **context:** add file path for pages ([9853f8e](https://github.com/stdword/logseq13-full-house-plugin/commit/9853f8e6e3ab2892955bcc94a2fbb5ae9b75ecda))
* **engine:** improve template errors readability ([35e2b60](https://github.com/stdword/logseq13-full-house-plugin/commit/35e2b60953e71d3f1b1b24e6fc89bef6dc095aaa))
* **notifications:** replace release notification ([1fac518](https://github.com/stdword/logseq13-full-house-plugin/commit/1fac518a3874a674039489a925444aad5a713b03))
* support coercing to bool in template args ([7405577](https://github.com/stdword/logseq13-full-house-plugin/commit/7405577497e555e3da929771f84a567e254b99b2))
* **syntax:** `out` & `outn` functions to output info within ``{...}`` ([9b4ec63](https://github.com/stdword/logseq13-full-house-plugin/commit/9b4ec63c3f0f9a4796bec67a0c212902c06dfca1))
* **syntax:** new syntax ``@...`` for date.nlp & fix date.nlp bug ([5b3d4b5](https://github.com/stdword/logseq13-full-house-plugin/commit/5b3d4b518f4cca899f9631e8a0b36b99cf9920f8))
* **tags:** `bool` template tag ([5a72905](https://github.com/stdword/logseq13-full-house-plugin/commit/5a7290517e9d8186cc0864f8eea806e7f7d81fe3))
* **tags:** `dev.uuid` template tag & docs ([5ce563f](https://github.com/stdword/logseq13-full-house-plugin/commit/5ce563f30f06566f0b30d8fe39328f75f80cff64))
* **tags:** `include` & `layout` template tags ([ad452d9](https://github.com/stdword/logseq13-full-house-plugin/commit/ad452d93c573de492fdb65b85f8c6c8bf03756b5))
* **tags:** `query.pages().getSample(n)` interface ([ca52289](https://github.com/stdword/logseq13-full-house-plugin/commit/ca5228994440245c2a78d885d59fe9fb8148b8d7))
* **tags:** add dev.context.page & dev.context.block utils to transform API Entity to Context item ([ed942e2](https://github.com/stdword/logseq13-full-house-plugin/commit/ed942e2dfe213499d745c946a535ac13537b3e45))
* **tags:** add query.refs namespace with .count, .journals, .pages ([4813da2](https://github.com/stdword/logseq13-full-house-plugin/commit/4813da245ceee63d1b915071f4bf7708ad2ae453))
* **tags:** add walkTree template tag ([4be1437](https://github.com/stdword/logseq13-full-house-plugin/commit/4be143765d241f8d199b101caca52a85275b217d))
* **tags:** dev.include template tag to include templates into each other ([7a031d8](https://github.com/stdword/logseq13-full-house-plugin/commit/7a031d8eb67f0b9b63c0472b0924a8110b490619)), closes [#18](https://github.com/stdword/logseq13-full-house-plugin/issues/18)
* **tags:** helpful array functions: unique, zip, sorted, groupby ([e7b24ec](https://github.com/stdword/logseq13-full-house-plugin/commit/e7b24ec5add28ee2d3b323044d807941836ad316))
* **tags:** query.pages template tag for simple query building (fix [#20](https://github.com/stdword/logseq13-full-house-plugin/issues/20)) ([2209481](https://github.com/stdword/logseq13-full-house-plugin/commit/22094815e59cfaa4d71e637b91ff36addd77d122))
* **tags:** query.pages: inverted operations, shortcuts, title operations, prevent vars dublication ([aae442c](https://github.com/stdword/logseq13-full-house-plugin/commit/aae442c9a2c74ee1c9d8f29ca775922fd10fc9b4))
* **tags:** template tag `tag` & propper rendering of tags in views ([57008ee](https://github.com/stdword/logseq13-full-house-plugin/commit/57008ee530762e4077e7ae0615e3f7fb32b100a8))
* **ui:** order with respect the numeric characters ([379fdf9](https://github.com/stdword/logseq13-full-house-plugin/commit/379fdf972aa3d34f80d1b97bb960e9d1c31f2b7d))

# [3.3.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v3.2.1...v3.3.0) (2023-11-29)


### Bug Fixes

* **notifications:** change appearing time of messages from rendering templates ([91e4faf](https://github.com/stdword/logseq13-full-house-plugin/commit/91e4fafff05c7e0282395a0bbe94473c14f6e311))


### Features

* support radix colors ([2bc82c2](https://github.com/stdword/logseq13-full-house-plugin/commit/2bc82c24fd909700bcbcd00a376369b4808e74a7))

## [3.2.1](https://github.com/stdword/logseq13-full-house-plugin/compare/v3.2.0...v3.2.1) (2023-11-16)


### Bug Fixes

* **notifications:** macro warning notification accidental appearing ([e06179c](https://github.com/stdword/logseq13-full-house-plugin/commit/e06179cbd4740cb2a7eb924c3f847861b71f044b))
* remove notification about prev release & update insert warning notification ([7734351](https://github.com/stdword/logseq13-full-house-plugin/commit/773435108289ae7364dca4ea462c7ea6f18d4f52))

# [3.2.0](https://github.com/stdword/logseq13-full-house-plugin/compare/v3.1.1...v3.2.0) (2023-11-08)


### Bug Fixes

* forgotten check for cleaningMarks from template-usage ([66ac683](https://github.com/stdword/logseq13-full-house-plugin/commit/66ac683adbe66c69f3723d82b3ca77cd113ed03f))
* remove backwards compatibility for old page syntax: {{renderer :template, wiki, —, ru}} ([91b7aaa](https://github.com/stdword/logseq13-full-house-plugin/commit/91b7aaa8971a69272c5c7b8fecd1247da0ed1369))
* replace macro checking with an informational message to user ([36f975e](https://github.com/stdword/logseq13-full-house-plugin/commit/36f975eda91b18f6e97551ac268dcaaf0b752096))
* **ui:** always hightlight the first result ([616d102](https://github.com/stdword/logseq13-full-house-plugin/commit/616d1027ecf1b81c9bc8cbf3a12da08e7ce96afc))
* **ui:** change default shortcut ([3ca5313](https://github.com/stdword/logseq13-full-house-plugin/commit/3ca531353bfe9d26cb64caeb896eccc7dc470305))
* **ui:** exit editing block before jumping to template ([a866ab7](https://github.com/stdword/logseq13-full-house-plugin/commit/a866ab730221a54a6b4de29ad74c20122fe9fefe)), closes [#23](https://github.com/stdword/logseq13-full-house-plugin/issues/23)
* **ui:** filter results bug ([b883ea1](https://github.com/stdword/logseq13-full-house-plugin/commit/b883ea1ab85952ad0a26266db887dd52346f5d1f))
* **ui:** insert highlighted name bug ([1b232ee](https://github.com/stdword/logseq13-full-house-plugin/commit/1b232eecd7e790ba38e442c9fb78a00bfd04e4b3))
* **ui:** unnecessary qoutes in usage with several args ([414919c](https://github.com/stdword/logseq13-full-house-plugin/commit/414919c0263f8e09779430d48cad9192dfc529cb))
* **ui:** update default font ([7764d34](https://github.com/stdword/logseq13-full-house-plugin/commit/7764d341fd786552f9c46f5e82c7b9425d9b9d01))
* **ui:** wrap template name with qoutes when comma is present ([eb0327c](https://github.com/stdword/logseq13-full-house-plugin/commit/eb0327c0561f96e3a0ec5d8a93700a7f071c48fb))


### Features

* "Copy as ..." commands for page ([e515336](https://github.com/stdword/logseq13-full-house-plugin/commit/e515336d30451920dcb7b930bba118a7d459db7c))
* add fast carriage positioning without api ([cba9c27](https://github.com/stdword/logseq13-full-house-plugin/commit/cba9c27e8221d2fd1475108505b56c27c2920dcc))
* generalize template-usage & template-list-as handling; support template-usage in "Copy as ..." ([78fb437](https://github.com/stdword/logseq13-full-house-plugin/commit/78fb437dc50bfb4b4c97bc9be8047a58618cf3e2))
* **notification:** add notification about new UI ([7f82a1d](https://github.com/stdword/logseq13-full-house-plugin/commit/7f82a1dacdfd2a966a7eee030810254a1b925589))
* **ui:** add "Preparing..." message & remove "hidden" label ([6a07d19](https://github.com/stdword/logseq13-full-house-plugin/commit/6a07d199de1a4dc2c41cc118b8bf4d8461f9dae8))
* **ui:** add content insertion logix ([5717540](https://github.com/stdword/logseq13-full-house-plugin/commit/57175401841727929be8c0d0f0f22282e5938310))
* **ui:** add data preparation and labels ([85241d3](https://github.com/stdword/logseq13-full-house-plugin/commit/85241d3cf5db029443e6c170bfc8e92200804690))
* **ui:** add foter with shortcut hints and platform-dependant behaviour ([0e56d60](https://github.com/stdword/logseq13-full-house-plugin/commit/0e56d60e4df38723da08dc6d22b7a3bce581c3dd))
* **ui:** add page name ([0727316](https://github.com/stdword/logseq13-full-house-plugin/commit/07273166c2c4dfa7e4c2bda769d62b2bcef3194e))
* **ui:** add searching by template page name fix [#23](https://github.com/stdword/logseq13-full-house-plugin/issues/23) ([593759c](https://github.com/stdword/logseq13-full-house-plugin/commit/593759cda7dc527ead319d6585945c81e3d58a64))
* **ui:** add template-usage property support ([fbcf99b](https://github.com/stdword/logseq13-full-house-plugin/commit/fbcf99b314c0dd073003beb37954b7c70bdd617b))
* **ui:** change sorting: by page then by template name ([c11e409](https://github.com/stdword/logseq13-full-house-plugin/commit/c11e4093074650c6f80d2cb2189de526295d30bc))
* **ui:** fuzzy search ([13d40c4](https://github.com/stdword/logseq13-full-house-plugin/commit/13d40c460481a073b43aa017d392caa190085075))
* **ui:** hide ui on mouse missclick ([6fe984f](https://github.com/stdword/logseq13-full-house-plugin/commit/6fe984f81998217010ed55857e357880dbca9677))
* **ui:** highlight with keyboard and mouse logic ([bb2b1f1](https://github.com/stdword/logseq13-full-house-plugin/commit/bb2b1f1a96a3f164e3a2d41ea25e695299b2e6c6))
* **ui:** insertion view draft ([98b4e84](https://github.com/stdword/logseq13-full-house-plugin/commit/98b4e841cd08382ea5092e2d120a2d1470087a84))
* **ui:** insertion view styles ([8147bd8](https://github.com/stdword/logseq13-full-house-plugin/commit/8147bd8da75fd4a38cab46fdf3c391f275433996))
* **ui:** live showing hidden items with alt/opt key ([8a709b6](https://github.com/stdword/logseq13-full-house-plugin/commit/8a709b6d0d7d722fea9d44b63f98313875133f39))
* **ui:** loading of templates data ([5ed57b7](https://github.com/stdword/logseq13-full-house-plugin/commit/5ed57b7225a91c125c63cd37aa125a4c336ed90c))
* **ui:** merge insertion of templates and views ([6219469](https://github.com/stdword/logseq13-full-house-plugin/commit/6219469885602d7affa30faf056841cf26128ce2))
* **ui:** no results case ([54abc7b](https://github.com/stdword/logseq13-full-house-plugin/commit/54abc7b70a6d7f923e13369a540f93e21dad0a02))
* **ui:** open template block with shift ([68c7d9a](https://github.com/stdword/logseq13-full-house-plugin/commit/68c7d9a02f829f979d232433cd4ea17b052f4e11))
* **ui:** replace old insert command ([a56c445](https://github.com/stdword/logseq13-full-house-plugin/commit/a56c445ea72890b4976f11eecf341ff34ce9eb86))
* **ui:** scrolling ([60b98d3](https://github.com/stdword/logseq13-full-house-plugin/commit/60b98d3d745e43254d283a6738a9fa5e1468b0b4))
* **ui:** smart selection after insertion with selected block ([c67d4c7](https://github.com/stdword/logseq13-full-house-plugin/commit/c67d4c7dcd68e095e155531770bd29074622e5e5))
* **ui:** smart selection after insertion within editing block ([664cc07](https://github.com/stdword/logseq13-full-house-plugin/commit/664cc0712cdd13a60f92cb93d1e9a8e1b7b02ca2))
* **ui:** special search case for spaces only ([efb6abd](https://github.com/stdword/logseq13-full-house-plugin/commit/efb6abd63575ec508cd5666914732033a2a129c6))
* utils to get css vars from main frame ([835ead0](https://github.com/stdword/logseq13-full-house-plugin/commit/835ead0f410360906dd4809ad19e0e6c05f6b635))

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
