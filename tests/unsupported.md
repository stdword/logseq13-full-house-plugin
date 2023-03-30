["Plain", "___"],
["Plain", "---"],

// bug
***

["Plain", "### h3 Heading"],
["Plain", "> Blockquotes can also be nested..."],
["Plain", "1. Lorem ipsum dolor sit amet"],
["Plain", "- Lorem ipsum dolor sit amet"],

// bug
```js
var foo = function (bar) {
  return bar++;
};
console.log(foo(5));
```
["Code", "` js\nvar foo = function (bar) {\n  return bar++;\n};\n\nconsole.log(foo(5));\n"],
["Plain", "`"],


| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |


// bug: no meta info about "!"
["Link", {
    "full_text": "![Minion](https://octodex.github.com/images/minion.png)",
    "url": ["Complex",{"protocol": "https", "link": "octodex.github.com/images/minion.png"}],
    "label": [ ["Plain", "Minion"] ],
    "metadata": ""}],


![Alt text][id]
With a reference later in the document defining the URL location:
[id]: https://octodex.github.com/images/dojocat.jpg  "The Dojocat"


Emojies
["Plain", "> Classic markup: :wink: :crush: :cry: :tear: :laughing: :yum:"],
["Plain", "> Shortcuts (emoticons): :-) :-( 8-) ;)"],

["Plain", "Inline footnote^[Text of inline footnote] definition."],

// bug
Footnote link[^first]
[^first]: Footnote

["Footnote_Reference",{"id": 1,"name": "first"}],
["Footnote_Reference",{"id": 2,"name": "first"}],


Definition lists
Abbreviations
Custom containers
