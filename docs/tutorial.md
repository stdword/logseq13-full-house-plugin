> The goal of this document is to be the step by step guide to learn the basic parts of the plugin


## Creation

### How to create a template?
- Just add `template` property with the name of the template as it's value (like Logseq standard templates)

```
- template:: simple
  - Hello, Logseq!
```



### How to render the template?
- Via [Insertion UI](reference__commands.md#insertion-ui):
  - Open it with the `⌘t` (or `ctrl+t`) default shortcut
  - Select the appropriate template to render it

?> Template's root block will be *skipped* by default. But you can [change](reference__configuring.md#parent-block-inclusion-control) this behavior



### How to render the non-template block?
- Via block's [Context Menu](reference__commands.md#indirect):
  - Right-click on the block's bullet to open it
  - Select the «Copy as 🏛template» item
  - The command will be copied to clipboard. Paste it to any block.

?> Template's root block will be *included* by default. But you can [change](#reference__configuring.md#parent-block-inclusion-control) this behavior

?> Also the current block can be [rendered in a fast way](reference__commands.md#render-this-block-command)



### What is a "view" and how to use it?
The template that renders it's content every time it becomes visible called `view`. See details [here](reference__commands.md#template-view-command).

The view can be inserted in Insertion UI with `⌘↩︎` shortcut.



### What is an "inline view" and how to use it?
Inline view is a fast way to create the single-line `view`. See details [here](reference__commands.md#inline-view-command).

The inline view can be inserted with «/»-command `Insert inline 🏛️view`.



### What is a "template button" and how to use it?
Template button is a clickable button for inserting particular templates. See details [here](reference__commands.md#template-button-command).

The template button can be inserted in Insertion UI with `⌘⇧↩︎` shortcut.



### How to create the keyboard shortcut for the template?
Use [this](reference__configuring.md#insertion-shortcut) instruction.



### What other rendering configuration are there?
See [detailed description](reference__configuring.md).





## Template syntax

### Accessing meta information
- Use special *context variables* with the two **back-ticks** brackets inside the template:

```
- template:: vars
  - Current page: ``c.page.name``
  - This text was rendered from template «``c.template.name``»
```

Another variables:
- `c.block`: block you are rendering template in: you can access its uuid, properties, related blocks
- `c.page`: page of the block you are rendering template in: to get title, properties and journal day
- `c.template`: name, properties & access to template block
- `c.self`: template block from which current block is rendering: to get corresponding meta information


See the full list and description [here](reference__context.md).



### Accessing properties values
- Via `props` and `propsRefs` attributes of page and block [context objects](reference__context.md)

```
- template:: properties
  description:: An example of how to retrieve properties values
  - from template itself: ``c.template.props.description``
  - from current block: ``c.self.props.message``
    message:: hello!
  - from the page, the second tag: ``c.page.propsRefs.tags[1]``
  - and from the destination block: ``c.block.props.info``
```

```
- {{renderer :template, properties}}
  info:: This is so powerful!
```



### References to pages and blocks
- Use [`ref`](reference__tags.md#ref) template tag or [special syntax](reference__syntax.md#reference-interpolation-syntax):

```
- template:: refs
  - Links to the page:
    - ``ref(c.page)``
    - ``[c.page]``
  - And links to blocks:
    - ``ref(c.block)``
    - ``[c.block]``
  - Embedding the current block:
    - ``embed(c.block)``
```



### References to journals
- With [`ref`](reference__tags.md#ref) template tag or [special syntax](reference__syntax.md#reference-interpolation-syntax)
- There is a way to get `today`, `yesterday` and `tomorrow` dates; and `now` — the current time
  - **Note**: these values based on today's date, not on journal's date. To calculate date based on journal's date see [NLP](#nlp-references-to-journals) or [date calculation](#refs-journals)

```
- template:: refs to journals
  template-including-parent:: yes
  rendered-at:: ``today``, ``time``
  - There is no difference between ``ref(today)`` and ``[today]``
  - References to yesterday's and tomorrow's journals:
    - ``[yesterday]``, ``[tomorrow]``
  - Reference to current journal page: ``[c.page.day]``
  - And to specific journal (date in ISO format): ``['2023-03-01']``
```



#### NLP
- With [`date.npl`](reference__tags.md#date-nlp) template tag or [special syntax](reference__syntax.md#dates-nlp-syntax):

```
- template:: nlp refs
  - There is no difference between ``date.nlp('next friday')`` and ``@next friday``
  - Use any simple date description in english: ``@in two days``
  - Set the starting point date to calculate from: ``@in two days, 2023-03-01``
  - References to yesterday's and tomorrow's journals:
    - ``@yesterday``, ``@tomorrow``
    - ``@yesterday, page``, ``@tomorrow, page`` — with respect to current journal
```



#### Based on journal's date  :id=refs-journals
- Every journal page's `day` field and [template tags](reference__tags.md#date) `date.now`, `date.yesterday` and `date.tomorrow` is a special date objects
  - You can access them and use full power of [Day.js](https://day.js.org) API


```
- template:: dynamic refs to journals
  - There is a difference between ``today`` and ``date.today``
  - But reference to a journal can be made with both of them:
    - ``[today]``
    - ``[date.today]``
  - References to yesterday's and tomorrow's journals (with respect to current journal):
    - ``@yesterday, page``, ``@tomorrow, page`` — special mode of @-syntax
  - Calculation from current journal page: ``[c.page.day.add(1, 'week')]``
```



#### Formatting and constructing
- You can access different parts of date object and format it as string
  - Documentation for getting date parts [→](https://day.js.org/docs/en/get-set/get-set)
  - Documentation for `.format` date pattern: [→](https://day.js.org/docs/en/display/format#list-of-all-available-formats) and [→](https://day.js.org/docs/en/plugin/advanced-format)

```
- template:: formatting
  - Accessing parts of date object:
    - Time: ``zeros(date.now.hour(), 2)``:``zeros(date.now.minute(), 2)``
    - Week: ``date.now.year()``-W``date.now.week()``
  - Format to any custom string:
    - Time: ``date.now.format('HH:mm')``
    - Week: ``date.now.format('YYYY-[W]w')``
  - Special formatting form to easily repeat journals name format:
    - ``date.now.format('page')``
    - ``date.now.toPage()``
```


- To construct references to specific journal pages use [`date.from`](reference__tags.md#date-from) template tag
  - Documentation for date pattern [→](https://day.js.org/docs/en/parse/string-format#list-of-all-available-parsing-tokens)
  - Documentation of available units [→](https://day.js.org/docs/en/manipulate/add#list-of-all-available-units)

```
- template:: new dates
  - Constructing from any string with `date.from` template tag
    - ISO string: ``date.from('2023-03-01')``
    - Custom format should be specified explicitly: ``date.from('2210', 'YYMM')``
    - Or even several formats at a time: ``date.from('2210', ['YYMM', 'YYYYMM'])``
  - Constructing by shifting date object
    - Last week: ``date.now.subtract(1, 'week').startOf('week')``
    - This week: ``date.now.startOf('week')``
    - Next week: ``date.now.add(1, 'w').startOf('w')``
    - Last month: ``date.now.startOf('month').subtract(1, 'M')``
    - Next year: ``date.now.endOf('y').add(1, 'ms')``
    - This week's friday: ``date.now.startOf('day').weekday(5)``
    - Next quarter: ``date.now.startOf('quarter').add(1, 'Q')``
```


### Cursor positioning
- You can position cursor after template insertion with [`cursor`](reference__syntax.md#cursor-positioning) template tag




## JavaScript environment
- All that templates magic is possible with JavaScript language
- Template parts is literally JavaScript code, so if you familiar with JavaScript — you can use it extensively

```
- template:: js env
  - Full page name: «``c.page.name``»
  - The last word in page name: «``c.page.name.split('/').slice(-1)``»
  - PLugin's name: ``c.page.name.match(/plugins\/(?<name>[^\/]+)/).groups.name``
```

```
- Full page name: «logseq/plugins/full-house/tutorial»
- The last word in page name: «tutorial»
- Plugin's name: «full-house»
```



### Accessing another page (or block) from template
- There is a quick way to replace `page` (`block`) context variable: use `:page` (`:block`) named argument to specify another page. See [details](reference__args.md) about different rendering arguments.


```
- `template:: page overriding`
  - authors:: ``c.page.name.split(' — ', 1)[0].split(', ').map(a => `[[${a}]]`).join(', ')``
    title:: ``c.page.name.split(' — ', 2).slice(-1)``
    rating:: ``'⭐️'.repeat(1 + Math.floor(Math.random() * 5))``
```

```
{{renderer :template, page overriding, :page "Author1, Author2 - Some book name"}}

will be rendered to ↓

- authors:: [[Author1]], [[Author2]]
  title:: Some book name
  rating:: ⭐️⭐️
```



### Conditional contexts
- As a part of [JavaScript environment](#javascript-environment) — you can write a fully supported JavaSscript code just inside template. Use the [syntax](reference__syntax.md#statement-syntax) to do it.

```
- template:: if logic
  - ``{
            if ((c.page.propsRefs.tags || []).includes('book')) {
                let [ authors, title ] = c.page.name.split(' — ', 2)
                authors = authors.split(', ').map(ref)
    }``
    name:: ``{ title }``
    authors:: ``{ authors.join('; ') }``
    ``{
            } else logseq.App.showMsg('The page is not a book', 'info', {timeout: 3000})
     }``
```



## See also

> This tutorial is cover only a basic parts of the plugin. See the whole reference for the rest ones:
>  - List of [simple](reference__tags.md) and [advanced](reference__tags_advanced.md) template tags
>  - [Reusing templates](reference__tags_nesting.md)
>  - Lot's of [tools](reference__tags_dev.md) for complex tasks
>  - Special [query language for pages](reference__query_language.md) with it's own [table view](reference__query_language__table.md)
>    - It is more easy to use, than standard Logseq's queries!

> Also see the [Showroom](https://github.com/stdword/logseq13-full-house-plugin/discussions/categories/showroom?discussions_q=is%3Aopen+label%3Aoriginal+category%3AShowroom) for advanced examples. The most exciting ones is:
> - [Glass Card view](https://github.com/stdword/logseq13-full-house-plugin/discussions/9)
> - [Live Namespace View](https://github.com/stdword/logseq13-full-house-plugin/discussions/55)
> - [Switching headers colors with a shortcut](https://github.com/stdword/logseq13-full-house-plugin/discussions/49)
