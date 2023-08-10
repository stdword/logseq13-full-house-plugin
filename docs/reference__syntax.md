!> This documentation describes **new syntax**, introduced in `v3.0.0`. See details [here](changelog.md#new-syntax).

##  \`\`...\`\` :id=interpolation-syntax
Use double back-tick «` `` `» to *start* and *finish* JavaScript expression.

<!-- panels:start -->
<!-- div:left-panel -->
Simple JavaScript expressions:

<!-- div:right-panel -->
<!-- tabs:start -->
    #### ***Template***
    Calculate: ` ``1 + 2`` `

    #### ***Rendered***
    Calculate: 3
<!-- tabs:end -->

<!-- div:left-panel -->
Accessing [context](reference__context.md) data:

<!-- div:right-panel -->
<!-- tabs:start -->
    #### ***Template***
    Current page name: ` ``c.page.name.italics()`` `

    #### ***Rendered***
    Current page name: *Test Page*
<!-- tabs:end -->


<!-- div:left-panel -->
[Template tags](reference__tags.md) usage:

<!-- div:right-panel -->
<!-- tabs:start -->
    #### ***Template***
    Argument value: ` ``empty(c.args.some_arg, 'Unspecified')`` `

    #### ***Rendered***
    Argument value: Unspecified
<!-- tabs:end -->

<!-- div:left-panel -->
Falling back to inline code block in case of any errors:

<!-- div:right-panel -->
<!-- tabs:start -->
    #### ***Template***
    Inline code block: ` ``@some text@`` `

    #### ***Rendered***
    Inline code block: `@some text@`
<!-- tabs:end -->

<!-- panels:end -->



## \`\`[...]\`\` :id=reference-interpolation-syntax
Use «` ``[ `» and «` ]`` `» to call [`ref`](reference__tags.md#ref) template tag in a short way.

<!-- panels:start -->
<!-- div:left-panel -->
These lines are completely the same:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Reference to current page: ` ``[c.page]`` ` \
Reference to current page: ` ``ref(c.page)`` `

#### ***Rendered***
Reference to current page: [[Test Page]] \
Reference to current page: [[Test Page]]
<!-- tabs:end -->

<!-- panels:end -->



## \`\`{...}\`\` :id=statement-syntax
Use «` ``{ `» and «` }`` `» to execute custom JavaScript code.

<!-- panels:start -->
<!-- div:left-panel -->
JavaScript statements:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
` ``{ var x = 13 }`` ` \
Value of variable: ` ``x`` `

#### ***Rendered***
Value of variable: 13
<!-- tabs:end -->


<!-- div:left-panel -->
**Note**. There is no interpolation to value:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
No result: ` ``{ c.page.name }`` `

#### ***Rendered***
No result:
<!-- tabs:end -->

<!-- panels:end -->
