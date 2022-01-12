# Prettier Plugin: Sort imports

A prettier plugin that sorts import statements by either their length or alphabetically.

Example:
![](./images/transform.png)

## Installation

```sh
npm install --save-dev prettier-plugin-sort-imports
```

## Usage

The plugin will be loaded by Prettier automatically. No configuration needed. It will sort by import statement length by default. 

### Options:

* `sortingMethod`: `'alphabetical' | 'lineLength' (default)` - What to sort the individual lines by. `alphabetical` sorts by the import path and `lineLength` sorts by the length of the import. Note that alphabetical sorting looks at the **whole** import path, so imports starting with `../` are ranked lower.
* `stripNewlines`: `true | false (default)`. Determines whether newlines between blocks of imports are stripped. If the only thing between two blocks is whitespace or comments, the whitespace will be stripped and the blocks are sorted as one big one. The comment sticks to whichever import it was above initially.

Files containing the string `// sort-imports-ignore` are skipped.
