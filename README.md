# Prettier Plugin: Sort imports

A prettier plugin that sorts import statements by either their length or alphabetically.

Example:
![](./images/transform.png)

## Installation

```sh
npm install --save-dev prettier-plugin-sort-imports
```

## Usage

The plugin will be loaded by Prettier automatically. No configuration needed. It will sort by import statement length by default. If you want to sort alphabetically set `sortingMethod: 'alphabetical'` in your prettier config.

Files containing the string `// sort-imports-ignore` are skipped.
