## Insertion UI

### Hide template from list :id=hiding-from-list
Prepend «.» before template name to automatically hide it from UI list. Use shortcut tips in the UI footer to show them back.

<!-- panels:start -->
<!-- div:left-panel -->
This template will be hidden from the list:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: .test`
<!-- tabs:end -->
<!-- panels:end -->


### Rendering as View / Template only :id=restricting-rendering
Use optional `template-list-as` property to do that.

<!-- panels:start -->
<!-- div:left-panel -->
Insert only as *View*:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: Name` \
`template-list-as:: view`
<!-- tabs:end -->
<!-- panels:end -->

<!-- panels:start -->
<!-- div:left-panel -->
Insert only as *Template*:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: Name` \
`template-list-as:: template`
<!-- tabs:end -->
<!-- panels:end -->

<!-- panels:start -->
<!-- div:left-panel -->
Or use any other text to label template in the *Insertion UI*:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: Name` \
`template-list-as:: related to work`
<!-- tabs:end -->
<!-- panels:end -->


### Default arguments :id=default-usage
Use optional `template-usage` property to specify default template arguments.

<!-- panels:start -->
<!-- div:left-panel -->
It will be used automatically with [*UI*](reference__commands.md#insertion-ui) or [*Context Menu*](reference__commands.md#indirect) insertions.

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: Name` \
`template-usage:: :age 21`

#### ***Will be inserted as***
`{{renderer :template, Name, :age 21}}`
<!-- tabs:end -->
<!-- panels:end -->

<!-- panels:start -->
<!-- div:left-panel -->
Back-tick quotes can be used to prevent displaying property value as a page reference:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: Name` \
``template-usage:: `:page [[Another]]` ``

#### ***Will be inserted as***
`{{renderer :template, Name, :page [[Another]] }}`
<!-- tabs:end -->
<!-- panels:end -->


### Position the cursor for arguments :id=control-cursor
Use optional `template-usage` property to specify cursor position (or text selection) for template arguments.

?> **Note**: Using cursor positioning forces template insertion to be *non-instant*.
This means that before the template is inserted, a `{{renderer...}}` macro will be used as an intermediate step.

<!-- panels:start -->
<!-- div:left-panel -->
Use a `{|}` marker to indicate the cursor position:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: Name` \
`template-usage:: :age 21{|}`

#### ***Will be inserted as***
`{{renderer :template, Name, :age 21`**|**`}}`
The cursor will be after argument value, but before curly brackets, so you can easily type-in new arguments without navigating the cursor.
<!-- tabs:end -->
<!-- panels:end -->

<!-- panels:start -->
<!-- div:left-panel -->
Or to open **page search modal** window:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: Name` \
``template-usage:: `:page [[{|}]]` ``

#### ***Will be inserted as***
`{{renderer :template, Name, :page [[`**|**`]]}}`
The page search modal will be opened, and it only requires you to type-in the page name without navigating the cursor.
<!-- tabs:end -->
<!-- panels:end -->

<!-- panels:start -->
<!-- div:left-panel -->
Use a double `{|}` marker to indicate the text selection:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: Name` \
`template-usage:: :title "{|}Meeting{|}"`

#### ***Will be inserted as***
`{{renderer :template, Name, :title "`<mark><tt>Meeting</tt></mark>`" }}`
Text "Meeting" will be selected, and it only requires you to type-in the value without navigating the cursor.
<!-- tabs:end -->
<!-- panels:end -->


### Shortcut for insertion :id=insertion-shortcut
Use optional `template-shortcut` property to specify keyboard shortcut for insertion.

?> The shortcut can be changed via standard **Logseq Keymap**. After changing the application need to be reloaded (or the plugin need to be reloaded separately).

?> **How to know which value to set for the property?** \
    1. Specify the property `template-shortcut::` for the template, but leave the value empty \
    2. Reload the application \
    3. Open the *Logseq Keymap* \
    4. Find the line with the label **"Insert 🏛️template: *TEMPLATE NAME*"** \
    5. Change shortcut \
    6. Reload the application again \
    7. Done!

?> **Command Templates** \
With shortcuts, you can render templates outside of edit mode and selection mode.
Additionally, with the help of [`blocks.actions.*`](reference__tags_advanced.md#blocks-actions) template tags, templates become much like Logseq Commands, which you can call with shortcuts. \
\
Prepare Logseq just the way you like it.


<!-- tabs:start -->
#### ***Template***
`template:: Name` \
`template-shortcut:: shift+meta+d`
<!-- tabs:end -->



## Rendering arguments :id=configure-arguments

### Controlling parent block inclusion :id=parent-block-inclusion-control
Use the «+» or «-» sign as the first letter of the template reference to control the inclusion of the parent block.
- Use «++» or «--» to *escape* this behaviour and use «+» or «-» as part of the template reference.

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, +[[Template Page]] }}` \
`{{renderer :template, "+[[Template Page, with comma]]" }}`

`{{renderer :template, -Template Name }}` \
`{{renderer :template, --Template name with single minuses around- }}`

`{{renderer :template, -((64e61063-1689-483f-903f-409766d81b2e)) }}`
<!-- tabs:end -->


### `:page` argument :id=page-argument
Set page for `c.page` [context variable](reference__context.md#page-context). By default it is the current page opened in main view. \
See arguments' [*Reference*](reference__args.md) for syntax details.

<!-- panels:start -->
<!-- div:left-panel -->
Example:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template «test»***
` ``c.page.name`` `

#### ***Command***
`{{renderer :template, test}}`
`{{renderer :template, test, :page [[Another Page]]}}`

#### ***Rendered***
Test Page \
Another Page

<!-- tabs:end -->

<!-- div:left-panel -->
Specifying page with **comma** «,» in its name:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template «test»***
` ``c.page.name`` `

#### ***Command***
`{{renderer :template, test, :page [[One, Two]]}}`
`{{renderer :template, test, :page "[[One, Two]]"}}`
`{{renderer :template, test, ":page [[One, Two]]"}}`

#### ***Rendered***
ERROR: No such page **[[One** \
ERROR: No such page **"[[One** \
One, Two
<!-- tabs:end -->

<!-- panels:end -->


### `:block` argument :id=block-argument
Set block for `c.block` [context variable](reference__context.md#block-context). By default it is the block rendering occurs in. \
See arguments' [*Reference*](reference__args.md) for syntax details.

<!-- panels:start -->
<!-- div:left-panel -->
Example:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template «test»***
` ``c.block.content`` `

#### ***Command***
`{{renderer :template, test}}`
`{{renderer :template, test, :block ((64e61063-1689-483f-903f-409766d81b2e))}}`

#### ***Rendered***
{{renderer :template, test}} \
Another's block content
<!-- tabs:end -->

<!-- panels:end -->


### `:delay-until-rendered` argument :id=delay-until-rendered

<!-- panels:start -->
<!-- div:left-panel -->
**Delay** the rendering process until the external rendering occurs. \
Use it when you need to **nest** a command inside another template and prevent it from rendering just in time.

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
Delayed rendering: \
*{{renderer :template, nested, :delay-until-rendered}}*

#### ***Template «nested»***
` ``c.page.name`` `

#### ***Rendered***
Delayed rendering: \
Test Page
<!-- tabs:end -->
<!-- panels:end -->
