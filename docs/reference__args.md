Used to tune and parametrize templates rendering process.

## Specifying
### Positional arguments
Specify positional arguments separated by comma.

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, "test", 13}}` \
`{{renderer :template, "test", 13, value}}` \
`{{renderer :template, "test", 13, value, "value,with,commas"}}`
<!-- tabs:end -->


### Named arguments
Specify named arguments in the form «:name value» (colon is required).

- **Note**: names arguments could be mixed with positional ones

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, "test", :arg 13}}` \
`{{renderer :template, "test", :arg1 13, :arg2 value}}` \
`{{renderer :template, "test", :firstArg "13", value, :last-arg "with,commas"}}`
<!-- tabs:end -->

- Escape named arguments with «::» — it becomes positional

<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args.$1", ::test 13}}`

#### ***Rendered***
:test 13
<!-- tabs:end -->



### Macro mode :id=macro-mode
This is the special case when argument value (positional or named) is in the form `$1`, `$2`, ...
The macro mode makes these values **empty**.

- It is required to pass arguments from Logseq `:macros` to [`:template-view`](reference__commands.md#template-view-command) command to distinguish between empty and non-empty arguments. Logseq `:macros` doesn't support optional arguments. The macro mode adds it.

<!-- tabs:start -->
#### ***`config.edn`***
```clojure
:commands [
  ["macro1" "arg $1"],
  ["macro2" "{{renderer :view, 'arg ' + c.args[1], $1}}"],
]
```

#### ***Usage***
- `{{macro1 13}}`
- `{{macro2 13}}`

+ `{{macro1}}`
+ `{{macro2}}`

#### ***Rendered***
- arg 13
- arg 13

+ arg $1
+ arg

<!-- tabs:end -->

- It is always turned on automatically. To disable use double `$$`.

<!-- tabs:start -->
#### ***Command***
- `{{renderer :view, "c.args.$1", $1}}` No value — with macro mode
- `{{renderer :view, "c.args.$1", $1 with text}}` — no macro mode (value form is different)
- `{{renderer :view, "c.args.$1", $$1}}` — disabled macro mode
- `{{renderer :view, "c.args.test", :test $$1}}` — disabled macro mode

#### ***Rendered***
- No value — with macro mode
- $1 with text — no macro mode (value form is different)
- $1 — disabled macro mode
- $1 — disabled macro mode

<!-- tabs:end -->



### `arg-`properties :id=arg-properties
Arguments can have *default values* specified in template properties.
- Property name should start with prefix `arg-`.

?> You can **inherit templates** with the help of *arg-properties* and [`layout`](reference__tags_nesting.md#nesting-layout) template tag

<!-- panels:start -->
<!-- div:left-panel -->
Example:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
```
- template:: test
  arg-icon:: 🏛
  arg-the-name:: Full House Templates
  - ``c.args.icon + c.args['the-name']``
```
#### ***Rendered***
🏛Full House Templates
<!-- tabs:end -->

<!-- div:left-panel -->
Arg-properties **with** the «?» at the end of the name will be coerced to a boolean value:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
```
- template:: test
  arg-ok:: yes
  arg-ok?:: yes
  - ``c.args.ok``
  - ``c.args['ok?']``
```
#### ***Rendered***
- yes
- true

<!-- tabs:end -->

<!-- div:left-panel -->
Also the will be copied to args **without** «?» at the end of the name (if there are no collisions):

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
```
- template:: test
  arg-ok?:: yes
  - ``c.args.ok``
  - ``c.args['ok?']``
```
#### ***Rendered***
- true
- true

<!-- tabs:end -->
<!-- panels:end -->



## Accessing :id=accessing

### By argument name
?> **Note**: argument without value is *boolean*

<!-- tabs:start -->
#### ***Command***
Boolean: `{{renderer :view, "c.args.test", :test}}` \
Boolean: `{{renderer :view, "c.args.test", :test ""}}`

String: `{{renderer :view, "c.args.test", :test 13}}` \
String: `{{renderer :view, "c.args.test", :test "13"}}`

#### ***Rendered***
Boolean: true \
Boolean: false

String: 13 \
String: 13
<!-- tabs:end -->



### By argument name with inappropriate characters

*E.g.* «-», «+», «.», etc.

<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args['test-arg']", :test-arg}}`

#### ***Rendered***
true
<!-- tabs:end -->



### By argument position

<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args[0]", 13}}`: template name \
`{{renderer :view, "c.args[1]", 13}}`: first \
`{{renderer :view, "c.args[2]", 13}}`: second (empty value)

#### ***Rendered***
\_\_inline\_\_: template name \
13: first \
: second (empty value)

<!-- tabs:end -->



### By argument position, excluding named ones

?> **Note**: position count starts from 1

<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args.$1", :first 1}}`: no positional \
`{{renderer :view, "c.args.$1", :first 1, 2}}`: second

#### ***Rendered***
: no positional \
2: second
<!-- tabs:end -->



### Mixing named & positional access

<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args.name$1", 13, :name 7}}` \
`{{renderer :view, "c.args.name$1", :name 7, 13}}` \
`{{renderer :view, "c.args.name$1", 13, :test 7}}` \
`{{renderer :view, "c.args.name$1", :test 7, 13}}`

#### ***Rendered***
7 \
7 \
13 \
13
<!-- tabs:end -->

<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args.$1name", 13, :name 7}}` \
`{{renderer :view, "c.args.$1name", :name 7, 13}}` \
`{{renderer :view, "c.args.$1name", :test 13, :name 7}}` \
`{{renderer :view, "c.args.$1name", :name 7, :test 13}}`

#### ***Rendered***
13 \
13 \
7 \
7
<!-- tabs:end -->
