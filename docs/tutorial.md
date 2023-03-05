# First steps
## Rendering template
- To create a template add `template` property with its name as a value (just like Logseq standard templates)
- Parent block will be skipped during rendering by default
- But you can change this behaviour with `template-including-parent` property
  - Use any value that can be interpreted as «Yes»
<img width="60%" src="https://user-images.githubusercontent.com/1984175/222982171-b4813611-5b1b-463a-8cab-6a6d40e1d213.gif"/>

<details closed>
  <summary>video</summary>
  <video src="https://user-images.githubusercontent.com/1984175/222982183-ccc06d51-d98b-4dfd-a79b-6d4cb75c5a83.mp4"/>
</details>

```markdown
- template:: simple
  template-including-parent:: ✔️
  comment:: The most simple template
	- Hello, Logseq!
```
