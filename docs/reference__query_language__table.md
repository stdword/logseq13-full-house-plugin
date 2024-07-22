Use this template tag to represent query results in a nice-looking table — just like the one in Logseq itself.

`query.table(rows, fields?, {orderBy?, orderDesc?})`

- `rows`: an array of objects or an array of arrays with values
- `fields`: (optional) field names to represent (default: auto-generated)
    - just the names of the columns if `rows` is an array of arrays with values
        - columns will get auto names if the parameter is absent
    - names to retrieve values from an object if `rows` is an array of objects
        - could be names of object properties if `rows` is an array of **page** objects
        - could be paths (see [`dev.get`](reference__tags_dev.md#dev-get) documentation)
- `orderBy`: (optional) field name to order by (default: no ordering will be performed)
    - needs to be one of the provided `fields` if `rows` is an array of arrays with values
    - could be any object attribute (or path to attribute) if `rows` is an array of objects
- `orderDesc`: (optional, boolean) set order direction to descending (default: *false* — ascending)

<br/>
<br/>

- Let's take this query as an example of page objects data:
```javascript
``{
  var books = query.pages()
    .tags('book')
    .property('year')
        .integerValue('=', 1975)
    .get()
}``
```

<!-- tabs:start -->
#### ***Template***
- ``query.table(books)``
- ``query.table(books, ['page', 'year'])``

#### ***Rendered***
- |page|alias|author|category|year|tags|
  |:-- |:--  |:--   |:--     |:--:|:-- |
  |Патриция Баумгартен — Подарок с озера Ковичан|«Подарок с озера Ковичан», «Gifts from Lake Cowichan»|Патриция Баумгартен|📖/psy/types/gestalt|1975|book|
  |Даниэл Розенблат — Открывая двери. Вступление в гештальт-терапию|«Открывая двери. Вступление в гештальт-терапию», «Opening Doors. What Happens in Gestalt Therapy»|Даниэл Розенблат|📖/psy/types/gestalt|1975|book|
- |page|year|
  |:-- |:--:|
  |Патриция Баумгартен — Подарок с озера Ковичан|1975|
  |Даниэл Розенблат — Открывая двери. Вступление в гештальт-терапию|1975|

<!-- tabs:end -->


<!-- tabs:start -->
#### ***Template***
- ``query.table(books, ['author', '@alias.-1', 'year'])``
- ``query.table(books, ['author', '@alias.-1', 'year'], {orderBy: 'author'})``

#### ***Rendered***
- |author|@alias.-1|year|
  |:--   |:--      |:--:|
  |Патриция Баумгартен|«Gifts from Lake Cowichan»|1975|
  |Даниэл Розенблат|«Opening Doors. What Happens in Gestalt Therapy»|1975|
- |author|@alias.-1|year|
  |:--   |:--      |:--:|
  |Даниэл Розенблат|«Opening Doors. What Happens in Gestalt Therapy»|1975|
  |Патриция Баумгартен|«Gifts from Lake Cowichan»|1975|

<!-- tabs:end -->


<!-- tabs:start -->
#### ***Template***
- ```javascript
``{
  var journals = query.pages()
    .day('in', date.today, 'month')
    .get(false)
}``
``query.table(journals, ['page'])``
``query.table(journals, ['page'], {orderBy: 'journal-day'})``
```

#### ***Rendered***
- |page|
  |:-- |
  |2024-07-01 Mon|
  |2024-07-16 Tue|
  |2024-07-07 Sun|
- |page|
  |:-- |
  |2024-07-01 Mon|
  |2024-07-07 Sun|
  |2024-07-16 Tue|

<!-- tabs:end -->
