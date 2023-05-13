## [Dynamic Lookup](https://github.com/peanball/logseq-dynamic-lookup)
### Plugin usage:
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

### `🏛 Full House` code for the same result
1) No need to create macro, just use «Inline View» feature:
   ```
    {{renderer :view, "ref(c.page) + ': ' + (c.page.props.description || '—') ", :page PAGE}}
   ```
2) Create shortcut via `:commands` in *config.edn*
   ```
   :commands [
       ["page-desc" "{{renderer :template-view, page-desc, :page PAGE}}"],
   ]
   ```
4) Or use «Template View» command instead (requires creation of template page-desc before):
   ```
   {{renderer :template-view, page-desc, :page PAGE}}
   ```

### Pros & Cons for 🏛

- ❌ longer command usage
- ✅ whole meta-info (not restricted to properties only)
- ✅ JS env for smarter handling of properties values (or its abscence)
- ✅ ability to make a reference to property value: `{{renderer :view, "ref(c.page.props.related)", :page PAGE}}`
