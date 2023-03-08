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


