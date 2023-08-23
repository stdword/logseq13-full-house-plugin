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
Specify named arguments in the form «:name value» (colon is required). \
Could be mixed with positional ones.
<!-- tabs:start -->
#### ***Command***
`{{renderer :template, "test", :arg 13}}` \
`{{renderer :template, "test", :arg1 13, :arg2 value}}` \
`{{renderer :template, "test", :firstArg "13", value, :last-arg "value,with,commas"}}`
<!-- tabs:end -->


### `arg-`properties
Arguments can have *default values* specified in template properties.
- Property name should start with prefix `arg-`.

<!-- tabs:start -->
#### ***Template***
```
- template:: test
  arg-icon:: 🏛
  arg-plugin-name:: Full House Templates
  - ``c.args.icon + c.args['plugin-name']``
```
#### ***Rendered***
🏛Full House Templates
<!-- tabs:end -->


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

<!-- div:left-panel -->
Disable named arguments usage with «::»:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Command***
`{{renderer :view, "c.args.$1", ::test 13}}`

#### ***Rendered***
:test 13
<!-- tabs:end -->

<!-- panels:end -->
