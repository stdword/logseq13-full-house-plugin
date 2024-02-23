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

<!-- panels:start -->
<!-- div:left-panel -->
**Note**: names arguments could be mixed with positional ones

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Command***
`{{renderer :template, "test", :arg 13}}` \
`{{renderer :template, "test", :arg1 13, :arg2 value}}` \
`{{renderer :template, "test", :firstArg "13", value, :last-arg "with,commas"}}`
<!-- tabs:end -->

<!-- div:left-panel -->
Disable named arguments with «::» — it becomes positional

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args.$1", ::test 13}}`

#### ***Rendered***
:test 13
<!-- tabs:end -->

<!-- panels:end -->


### Macro mode
This is the special case when argument value (positional or named) is in the form `$1`, `$2`, ...

- It is required to pass arguments from Logseq `:macros` to [`:template-view`](reference__commands.md#template-view-command) command to distinguish between passed and empty argument state.
- It always turns on. To disable use double `$$`.

<!-- tabs:start -->
#### ***Command***
- No value: `{{renderer :view, "c.args.$1", $1}}`
- Value: `{{renderer :view, "c.args.test", :test $$1}}`
- No macro mode: `{{renderer :view, "c.args.test", :test $1 with text}}`

#### ***Rendered***
- No value:
- Value: $1
- No macro mode: $1 with text

<!-- tabs:end -->



### `arg-`properties :id=arg-properties
Arguments can have *default values* specified in template properties.
- Property name should start with prefix `arg-`.

?> You can **inherit templates** with the help of *arg-properties* and [`layout`](reference__tags.md#nesting-layout) template tag

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
<!-- panels:start -->
<!-- div:left-panel -->
By argument name:

**Note**: argument without value is *boolean*

<!-- div:right-panel -->
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

<!-- div:left-panel -->
By argument name with inappropriate characters:

*E.g.* «-», «+», «.», etc.

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args['test-arg']", :test-arg}}`

#### ***Rendered***
true
<!-- tabs:end -->

<!-- div:left-panel -->
By argument position:

**Note**: counting starts from 1

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args[0]", 13}}`: template name \
`{{renderer :view, "c.args[1]", 13}}`: first \
`{{renderer :view, "c.args[2]", 13}}`: second (empty value)

No colon → no named arg (empty value):
`{{renderer :view, "c.args.test", 13}}`

#### ***Rendered***
\_\_inline\_\_: template name \
13: first \
: second (empty value)

 No colon → no named arg (empty value):

<!-- tabs:end -->


<!-- div:left-panel -->
By argument position, excluding named ones:

**Note**: counting starts from 1

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args.$1", :first 1}}`: no positional \
`{{renderer :view, "c.args.$1", :first 1, 2}}`: second

#### ***Rendered***
: no positional \
2: second
<!-- tabs:end -->

<!-- panels:end -->
