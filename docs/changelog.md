## v3.0.0 (not released yet)
### New template syntax :id=new-syntax
!> Breaking change!

This version introduces a [simplified template syntax](reference__syntax.md) to support agile syntax expansion in future functionality.
For old templates, the plugin tries to auto-detect the syntax version. However, this behavior will be disabled in future versions.

To manually convert your existing templates, use [this](reference__commands.md#convert-syntax-command) command.


### Rendering standard Logseq templates
1. Rendering *dynamic variables* (inside `<% ... %>`) according to [Logseq Docs](https://docs.logseq.com/#/page/60311eda-b6f7-4779-8187-8830545b3a64). See [*Reference*](reference__syntax.md#id=standard-syntax) for more details.
2. Possibility to mix standard Logseq templates syntax with other plugin [*Syntax*](reference__syntax.md).
