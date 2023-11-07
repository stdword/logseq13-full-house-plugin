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


#### Specifying default arguments
Use optional `template-usage` property to specify default template arguments.

<!-- panels:start -->
<!-- div:left-panel -->
It will be used automatically with [*UI*](#insertion-ui) or [*Context Menu*](#indirect) insertions.

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


#### Control cursor position / text selection for arguments
Use optional `template-usage` property to specify cursor position (or text selection) for template arguments.

?> Works only via [*Insertion UI*](#insrtion-ui)

<!-- panels:start -->
<!-- div:left-panel -->
Use a `{|}` marker to indicate the cursor position:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template***
`template:: Name` \
`template-usage:: :age 21{|}`

#### ***Will be inserted as***
`{{renderer :template, Name, :age 21<cursor is here>}}`
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
`{{renderer :template, Name, :page [[<cursor is here>]]}}`
The page search modal will be opened, and it only requires you to type in the page name without navigating the cursor.
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
`{{renderer :template, Name, :title "Meeting" }}`
Meeting text will be selected , and it only requires you to type in the page name without navigating the cursor.
<!-- tabs:end -->
<!-- panels:end -->


#### Restricting the rendering: as View or as Template only
Use optional `template-list-as` property to do that.

?> Works only via [*Insertion UI*](#insrtion-ui)

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


#### `:page` argument :id=page-argument
Set page for `c.page` [context variable](reference__context.md#page-context). By default it is the current page opened in main view. \
See arguments' [*Reference*](reference__args.md) for syntax details.

<!-- panels:start -->
<!-- div:left-panel -->
Rendering template ``c.page.name``:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Command***
`{{renderer :template, test}}`

#### ***Rendered***
Test Page
<!-- tabs:end -->

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, test, :page [[Another Page]]}}`

#### ***Rendered***
Another Page
<!-- tabs:end -->

<!-- div:left-panel -->
Specifying page with **comma** «,» in name for template `c.page.name`:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Command***
`{{renderer :template, test, :page [[One, Two]]}}`

#### ***Rendered***
ERROR: No such page **[[One**
<!-- tabs:end -->

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, test, :page "[[One, Two]]"}}`

#### ***Rendered***
ERROR: No such page **"[[One**
<!-- tabs:end -->

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, test, ":page [[One, Two]]"}}`

#### ***Rendered***
One, Two
<!-- tabs:end -->

<!-- panels:end -->

#### `:block` argument :id=block-argument
Set block for `c.block` [context variable](reference__context.md#block-context). By default it is the block rendering occurs in. \
See arguments' [*Reference*](reference__args.md) for syntax details.

<!-- panels:start -->
<!-- div:left-panel -->
Rendering template ``c.block.content``:

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Command***
`{{renderer :template, test}}`

#### ***Rendered***
{{renderer :template, test}}
<!-- tabs:end -->

<!-- tabs:start -->
#### ***Command***
`{{renderer :template, test, :block ((64e61063-1689-483f-903f-409766d81b2e))}}`

#### ***Rendered***
Another's block content
<!-- tabs:end -->

<!-- panels:end -->


#### `:delay-until-rendered` argument :id=delay-until-rendered

<!-- panels:start -->
<!-- div:left-panel -->
**Delay** the rendering process until the external rendering occurs. \
Use it when you need to **nest** a command inside another template and prevent it from rendering just in time.

<!-- div:right-panel -->
<!-- tabs:start -->
#### ***Template «nested»***
``c.page.name``

#### ***Template***
Delayed rendering: \
*`{{renderer :template, nested, :delay-until-rendered}}`*

#### ***Rendered***
Delayed rendering: \
Test Page
<!-- tabs:end -->
<!-- panels:end -->
