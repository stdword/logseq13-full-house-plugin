# First steps (after installing plugin)
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
  - Single dash or minus values consider empty: ``{ empty(c.self.props.dash) }``
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
