[Source link →](https://github.com/peanball/logseq-dynamic-lookup)

## Plugin usage
1) Create `:macro`
   ```
   :macros {
       "page-desc" "[[$1]] {{renderer :lookup, $1, :description, \": $description\", —}}"
   }
   ```
2) Use it for certain page:
   ```
   {{page-desc PAGE}}
   ```

## The same result with 🏛
1) Just use «Inline View» feature (it works without creating a macro):
   ```
    {{renderer :view, "ref(c.page) + ': ' + (c.page.props.description || '—') ", :page PAGE}}
   ```
2) To use macro, create it via `:macros` in *config.edn*
   ```
   :macros {
      "page-desc" "{{renderer :view, \"ref(c.page) + ': ' + (c.page.props.description || '—')\", :page $1}}"
   }
   ```
3) Use it for certain page:
   ```
   {{page-desc PAGE}}
   ```

## Pros & Cons
`🏛 Full House Templates` fully replaces the plugin:
- ✅ It is not restricted to properties only: whole [meta-info](reference__context.md#context) is available
- ✅ JavaScript [environment](reference__syntax.md#statement-syntax) for smarter handling logic
- ✅ Ability to make a [clickable reference](reference__tags.md#ref) to property value:
  `{{renderer :view, "ref(c.page.props.related)", :page PAGE}}`
