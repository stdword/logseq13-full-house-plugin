# Tutorial

# Table of Contents
- [Rendering named template](#rendering-named-template)
- [Rendering any block or page as a template](#rendering-any-block-or-page-as-a-template)
- [Making references via context variables](#making-references-via-context-variables)
- [Accessing properties](#accessing-properties)
- [Dates & times work](#dates--times-work)
- [JavaScript environment](#javascript-environment)
- [Conditional contexts](#conditional-contexts)

## Rendering named template
- To **create a template** from block add `template` property with its name as a value (just like Logseq standard templates)
- To **render a template**:
  - Type-in `/`-command «Full House → Insert template» or select it from `Command Palette` (Ctrl+Shift+P or ⌘⇧P)
  - To the current editing block will be inserted special command that will render template
  - Specify your template name and remove third optional argument (will return to it later)
  - Press Enter or Esc to start rendering
- Template **root (parent) block** will be skipped during rendering (by default)
  - But you can change this behavior with `template-including-parent` property
  - Use any value that can be interpreted as «Yes»
<img width="60%" src="https://user-images.githubusercontent.com/1984175/222982171-b4813611-5b1b-463a-8cab-6a6d40e1d213.gif"/>

<table><tr><td>

<details><summary>code</summary><p>

```markdown
- template:: simple
  template-including-parent:: ✔️
  comment:: The most simple template
  - Hello, Logseq!
```

```markdown
- {{renderer :template, simple}}
```
</p></details>

</td><td>

<details closed><summary>video</summary>
  <video src="https://user-images.githubusercontent.com/1984175/222982183-ccc06d51-d98b-4dfd-a79b-6d4cb75c5a83.mp4"/>
</details>

</td></tr></table>

## Rendering any block or page as a template
- In fact there is no rule to have a «template» property in the block to render it
  - Just use block or page reference instead of template name
    - `{{renderer :template, ((64004111-...)) }}`
    - `{{renderer :template, [[page name]] }}`
      - First block of the page and it's sub-tree will be used as a template
  - For first case parent block will be included by default
  - And if you want to exclude it — use minus sign before reference:
    - `{{renderer :template, - ((64004111-...)) }}`
    - `{{renderer :template, + [[page name]] }}` — plus sign works as well
<img width="60%" src="https://user-images.githubusercontent.com/1984175/223593341-64b2f1f0-0310-49bd-b722-aeb7a97b9035.gif"/>

<table><tr><td>

<details closed><summary>video</summary>
  <video src="https://user-images.githubusercontent.com/1984175/223593545-fb5bb3a8-bac6-4abf-bbc6-4e7a18dab748.mp4"/>
</details>

</td></tr></table>

## Making references via context variables

- Inside the template you can refer to context variables that represents various meta information:
  - `c.block`: block you are rendering template in: you can access its uuid, properties, related blocks
  - `c.page`: page of the block you are rendering template in: to get title, properties and journal day
  - `c.template`: name, properties & access to template block
  - `c.self`: template block from which current block is rendering: to get corresponding meta information
  - *Note*: «c» means «*c*ontext» — don't forget to type it in
- To use context variable wrap it with triple-char brackets:
  ```json
  ``{ c.page.name }``
  ```
  - *Note*: This is back-ticks, not single quotes
<img width="60%" src="https://user-images.githubusercontent.com/1984175/223791469-c345b3e5-ffe0-407a-aed1-03aa46e843cd.gif"/>
<img width="60%" src="https://user-images.githubusercontent.com/1984175/223793090-4cd317ad-d95c-4a07-9970-35f046b3cfd5.gif"/>

<table><tr><td>

<details><summary>code</summary><p>

```markdown
- template:: context-vars
  - This text was rendered from template «`{ c.template.name }`»
  - Links to the page:
    - [[``{ c.page.name }``]]
    - `{ `[[${c.page.name}]]` }`
    - `{ '[[' + c.page.name + ']]' }`
    - `{ ref(c.page.name) }`
    - `{ ref(c.page) }`
    - `[ c.page ]` or `[[ c.page ]]` — future variants (not supported now)
  - And links to blocks:
    - `{ bref(c.block.uuid) }`
    - `{ bref(c.block) }`
    - `{ ref(c.block) }`
  - Embedding the current block:
    - {{embed `{ bref(c.self.uuid) }`}}
    - `{ embed(c.self.uuid) }`
    - `{ embed(c.self) }`
```
</p></details>

</td><td>

<details closed><summary>video 1</summary>
  <video src="https://user-images.githubusercontent.com/1984175/223789581-761e8487-4534-4638-b9db-56a9cbb64fba.mp4"/>
</details>

</td><td>

<details closed><summary>video 2</summary>
  <video src="https://user-images.githubusercontent.com/1984175/223789892-ef247e8a-5b0f-48a8-8548-5a3620e13e40.mp4"/>
</details>

</td></tr></table>

## Accessing properties

- Access to property values via `props` and `propsRefs` attributes of page or block objects
- Check if property is empty or missing with `empty` template tag (and fallback to some default value)
— And context structure could be viewed just by rendering appropriate variable
<img width="60%" src="https://user-images.githubusercontent.com/1984175/224456470-13c8449f-7f64-4cc6-bcd7-ce9068b6266b.gif"/>
<img width="60%" src="https://user-images.githubusercontent.com/1984175/224459061-3388811e-70fb-4473-9d2b-1d7c4c410bfe.gif"/>

<table><tr><td>

<details><summary>code</summary><p>

```markdown
- template:: properties
  description:: An example of how to retrieve properties values
  - from template itself: ``{ c.template.props.description }``
  - from current block: ``{ c.self.props.message }``
    message:: wat!
  - from the page: ``{ c.page.props.related }``
  - and from the block to which rendering occurs: ``{ c.block.props.info }``
```

```markdown
- {{renderer :template, properties}}
  info:: Do we really need this?
```

```markdown
- template:: property-existence
  - Some property could be missed. Then its value is empty: ` ``{ c.self.props.missed }`` `
  - But we can fallback to ` ``{ empty(c.self.props.missed, 'any string') }`` `
  - ``{ empty(c.self.props.zero) }`` is non-empty!
    zero:: 0
  - Single dash or minus values are considered empty: ``{ empty(c.self.props.dash) }``
    dash:: —
  - But compare to: ``{ c.self.props.dash }``
    dash:: —
  - ``{ empty(c.self.props.quotes, 'Empty quotes equals empty values too') }``
    quotes:: «»
  - As a final — let's see the whole context structure:
    - ``{ c }``
```
</p></details>

</td><td>

<details closed><summary>video 1</summary>
  <video src="https://user-images.githubusercontent.com/1984175/224456476-3a336408-65dd-4c08-98b7-50b9176eebbc.mp4"/>
</details>

</td><td>

<details closed><summary>video 2</summary>
  <video src="https://user-images.githubusercontent.com/1984175/224458614-229f8685-9960-4e60-9f21-7efb68f89627.mp4"/>
</details>

</td></tr></table>



## Dates & times work
### References to journal pages
- There is a way to get `today` date and `now` time just as text in template
  - `yesterday` and `tomorrow` works as well
- To make a reference to appropriate journal page use `ref` template tag
- Every journal page's `day` field and template tags `date.now`, `date.yesterday` and `date.tomorrow` is a special date objects
  - You can access them and use full power of [Day.js](https://day.js.org/) API
<img width="60%" src="https://user-images.githubusercontent.com/1984175/224491262-c5b8c07e-8033-406b-af01-5260aaa5a3bc.gif"/>

<table><tr><td>

<details><summary>code</summary><p>

```markdown
- template-including-parent:: ✔️
  rendered-at:: ``{ today }``
  - ``{ time }``: There is a difference between ``{ today }`` and ``{ date.today }``
  - ``{ time }``: But reference to a journal page can be made with both of them:
    - ``{ ref(today) }``
    - ``{ ref(date.today) }``
  - ``{ time }``: References to yesterday's and tomorrow's journal pages:
    - ``{ ref(yesterday) }``
    - ``{ ref(tomorrow) }``
  - ``{ time }``: Reference to current journal page: ``{ ref(c.page.day) }``
  - ``{ time }``: And to specific journal page (date in ISO format): ``{ ref('2023-03-01') }``
```

```markdown
- {{renderer :template, ((640c7183-70fe-474e-86d1-48e1c273ca06)), [[2023-03-01 Wed]]}}
```
</p></details>

</td><td>

<details closed><summary>video</summary>
  <video src="https://user-images.githubusercontent.com/1984175/224491092-acb230f8-29cf-4c96-8f85-d5e889838f04.mp4"/>
</details>

</td></tr></table>


### Formatting and constructing date objects
- You can access different parts of date object and format it as string
  - Documentation for getting date parts [→](https://day.js.org/docs/en/get-set/get-set)
  - Documentation for `.format` date pattern: [→](https://day.js.org/docs/en/display/format#list-of-all-available-formats) and [→](https://day.js.org/docs/en/plugin/advanced-format)
- To construct references to specific journal pages use `date.from` template tag
  - Documentation for date pattern [→](https://day.js.org/docs/en/parse/string-format#list-of-all-available-parsing-tokens)
  - Documentation of available units [→](https://day.js.org/docs/en/manipulate/add#list-of-all-available-units)
<img width="60%" src="https://user-images.githubusercontent.com/1984175/224491397-360aba5e-ee22-4ed3-bf15-aaf00b0ec8b9.gif"/>

<table><tr><td>

<details><summary>code</summary><p>

```markdown
- template:: formatting
  - Accessing parts of date object:
    - Time:
      - ``{ date.now.hour() }``:``{ date.now.minute() }``
      - ``{ zeros(date.now.hour()) }``:``{ zeros(date.now.minute()) }``
    - Week: ``{ date.now.year() }``-W``{ date.now.week() }``
  - Format to any custom string:
    - Time: ``{ date.now.format('HH:mm') }``
    - Week: ``{ date.now.format('YYYY-[W]w') }``
  - Special formatting form to easily create journal references:
    - *``{ date.now.format('page') }``*
    - *``{ date.now.toPage() }``*
```

```markdown
- template:: new-dates
  - Constructing from any string with `date.from` template tag
    - ISO string: ``{ date.from('2023-03-01') }``
    - Custom format should be specified explicitly: ``{ date.from('2210', 'YYMM')}``
    - Or even several formats at a time: ``{ date.from('2210', ['YYMM', 'YYYYMM']) }``
  - Constructing by shifting date object
    - Last week: ``{ date.now.subtract(1, 'week').startOf('week') }``
    - This week: ``{ date.now.startOf('week') }``
    - Next week: ``{ date.now.add(1, 'w').startOf('w') }``
    - Last month: ``{ date.now.startOf('month').subtract(1, 'M') }``
    - Next year: ``{ date.now.endOf('y').add(1, 'ms') }``
    - This week's friday: ``{ date.now.startOf('day').weekday(5) }``
    - Next quarter: ``{ date.now.startOf('quarter').add(1, 'Q') }``
```
</p></details>

</td><td>

<details closed><summary>video</summary>
  <video src="https://user-images.githubusercontent.com/1984175/224491399-d1fd34e7-6b83-4175-b791-d93fceda79c6.mp4"/>
</details>

</td></tr></table>

## JavaScript environment
- All that templates magic is possible with JavaScript language
- Template parts is literally JavaScript code, so if you familiar with JavaScript — you can use it extensively

<table><tr><td>

![image](https://user-images.githubusercontent.com/1984175/224792552-39310ca7-e30f-4872-981f-19634f56566a.png)

<details closed><summary>code</summary>

```markdown
- `template:: js-env`
  - Full page name: «``{ c.page.name }``»
  - Page's namespace: «``{ c.page.name.split('/', 1) }``»
  - The base name of this page: «``{ c.page.name.split('/').slice(-1) }``»
  - Plugin's name: «``{ c.page.name.match(/plugins\/(?<name>[^\/]+)/).groups.name }``»
```
</details>
</td></tr><tr><td>

![image](https://user-images.githubusercontent.com/1984175/224793360-84dc9927-c7ed-492b-9510-fda656111a96.png)
</td></tr></table>


- And there is a quick way to replace `page` context variable: use third argument to specify another page

<table><tr><td>
<img src="https://user-images.githubusercontent.com/1984175/224791169-3f9482cd-fef4-4594-b619-4c8d900df007.png"/>
<details closed><summary>code</summary>

```markdown
- `template:: page-overriding`
  - authors:: ``{ c.page.name.split(' — ', 1)[0].split(', ').map(a => `[[${a}]]`).join('; ') }``
    title:: ``{ c.page.name.split(' — ', 2).slice(-1) }``
    rating:: ``{ '⭐️'.repeat(1 + Math.floor(Math.random() * 5)) }``
```
</details>
</td></tr><tr><td>
<img src="https://user-images.githubusercontent.com/1984175/224791554-5e257d29-0441-4f7a-a672-67e8abf882c6.png"/>
</td></tr></table>

## Conditional contexts
- As a part of [JavaScript environment](#javascript-environment) — you can write a fully supported JavaSscript code just inside template
- Use exclamation mark before the code to do it:
  - ```typescript
    ``{ ! js code goes here }``
    ```
<img width="60%" src="https://user-images.githubusercontent.com/1984175/224825504-713f65cb-b32f-4e15-b08e-2254b85d02fe.gif"/>

<table><tr><td>

<img src="https://user-images.githubusercontent.com/1984175/224812776-e7c40283-9af7-4a26-970a-69325b62ea7f.png"/>
<details><summary>code</summary><p>

```markdown
- template:: if-logic
  - ``{ !
            if ((c.page.propsRefs.tags || []).includes('book')) {
                let [ authors, title ] = c.page.name.split(' — ', 2)
                authors = authors.split(', ').map(ref)
     }``
    name:: ``{ title }``
    authors:: ``{ authors.join('; ') }``
    ``{ !
            } else logseq.App.showMsg('The page is not a book', 'info', {timeout: 3000})
     }``
```
</p></details>

</td><td>

<details closed><summary>video</summary>
  <video src="https://user-images.githubusercontent.com/1984175/224824830-1ae60e38-fe22-48dc-8bc0-72b7d1b294f9.mp4"/>
</details>

</td></tr></table>
