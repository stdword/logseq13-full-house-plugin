## [**Dynamic Lookup**](https://github.com/peanball/logseq-dynamic-lookup)
### Plugin usage
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

### 🏛code for the same result
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

### Pros & Cons for 🏛
- ✅ Whole meta-info (not restricted to properties only)
- ✅ JS env for smarter handling of properties values (or its absence)
- ✅ Ability to make a clickable reference to property value:
  `{{renderer :view, "ref(c.page.props.related)", :page PAGE}}`
