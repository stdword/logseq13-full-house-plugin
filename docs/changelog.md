## v3.0.0
### New template syntax :id=new-syntax
!> Breaking change!

This version introduces the [new template syntax](reference__syntax.md) to support agile syntax expansion and to make it more simple.

| Changes: |      |      |
| ---: | :---: | :---: |
| **Before** | ` ``{ c.page.name }`` ` | ` ``{ ! var x = c.page.name _}`` ` |
| **After** | ` ``c.page.name`` ` | ` ``{ var x = c.page.name }`` ` |

For now the plugin tries to auto-detect the syntax version. However, this behavior will be disabled in future versions.

To manually convert your existing templates, use [this](reference__commands.md#convert-syntax-command) command.


### Rendering standard Logseq templates
1. Rendering *dynamic variables* (inside `<% ... %>`) according to [Logseq Docs](https://docs.logseq.com/#/page/60311eda-b6f7-4779-8187-8830545b3a64). See [*Reference*](reference__syntax.md#id=standard-syntax) for more details.
2. Possibility to mix standard Logseq templates syntax with other plugin [*Syntax*](reference__syntax.md).


### Template tag `date.nlp` for getting NLP dates
1. Relative to now moment
2. Relative to any custom date
3. Relative to current journal's page

See [*Reference*](reference__tags.md#id=date-nlp) for more details.


### Accessing positional arguments, excluding named ones
This inline view `{{renderer :view, "c.args.$1", :first 1, 2}}` renders to `2`.
See details [here](reference__args.md#accessing).
