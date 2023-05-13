/** horizontal line
 * mldoc: x
 * fh: x
 */
["Plain", "___"],
["Plain", "---"],
["Plain", "***"],


/** simple cases
 * mldoc: x
 * fh: x
 */
["Plain", "### h3 Heading"],
["Plain", "> Blockquotes can also be nested..."],
["Plain", "1. Lorem ipsum dolor sit amet"],
["Plain", "- Lorem ipsum dolor sit amet"],


/** code block
 * mldoc: x
 * fh: v
 */
```js
var foo = bar()
```
["Code", "` js\nvar foo = bar()\n"],
["Plain", "`"],


/** tables
 * mldoc: x
 * fh: x
 */
| A | B |
| 1 | 2 |


/** bug: no meta info about "!"
 * mldoc: x
 * fh: v
 */
["Link", {
    "full_text": "![Minion](https://octodex.github.com/images/minion.png)",
    "url": ["Complex",{"protocol": "https", "link": "octodex.github.com/images/minion.png"}],
    "label": [ ["Plain", "Minion"] ],
    "metadata": ""}],


/** reference by id
 * mldoc: x
 * fh: x
 */
![Alt text][id]
With a reference later in the document defining the URL location:
[id]: https://octodex.github.com/images/dojocat.jpg  "The Dojocat"


/** inline footnote
 * mldoc: x
 * fh: x
 */
["Plain", "Inline footnote^[Text of inline footnote] definition."],


/** footnotes
 * mldoc: x
 * fh: x
 */
Footnote link[^first]
[^first]: Footnote

["Footnote_Reference",{"id": 1,"name": "first"}],
["Footnote_Reference",{"id": 2,"name": "first"}],
