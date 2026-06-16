# ts-teal
This is _just_ a tree-sitter grammar for the [Teal language](https://teal-language.org) _with no bindings_ auto-generated from the [grammar of Teal](https://teal-language.org/book/latest/grammar.html).

If you are looking for language bindings/highlighting, please take a look at [tree-sitter-teal](https://github.com/euclidianAce/tree-sitter-teal).

This is primarily for use in the [teal-language-server](https://github.com/teal-language/teal-language-server), which needs to interact with the specific versions of Teal and tree-sitter libraries and can be installed without the need of tree-sitter-cli.

- Current Teal version: v0.24.8
- Current tree-sitter version: v0.26.8 (the same as [ltreesitter](https://github.com/euclidianace/ltreesitter))

## Usage

`ts-teal` is installable via LuaRocks: `luarocks install ts-teal`
After, it can be loaded for use with [ltreesitter](https://github.com/euclidianace/ltreesitter):

```teal
local teal = ltreesitter.require("ts-teal", "teal")
teal:parser():parse_string("local x = 1")
```

## Development notes

- Install the version of tree-sitter as noted above. We use ltreesitter for reading the tree-sitter grammar and it's good to keep them in sync.
- The codebase is a little messy, but _should_ be able to handle simple changes/additions to Teal's grammar.
    - It is mostly a direct translation. However `chunk` had to be rewritten as the entrypoint, and `block` was inlined. Both were because tree-sitter doesn't allow rules to match the empty string.
    - The only other change is that precedence is added to `binop` and `unop`.

### New ltreesitter

1. Update the tree-sitter cli to match the version from ltreesitter.
2. Run `tree-sitter generate` to re-generate the parser.c file
3. Release a new version

### New Teal (or grammar) version

1. Go to the Teal docs [grammar](https://teal-language.org/book/latest/grammar.html) page and copy the EBNF file.
2. Paste it into `teal-grammar.ebnf`. Note if there are any differences from that page on operator precedence, `binop`, or `unop` (A diff may help here).
    - If there are, you will have to update the hard-coded parts of `generate-grammar.tl` accordingly.
3. Run `tl run generate-grammar.tl > grammar2.js` to generate a new grammar file.
4. Compare the new grammar with the old and ensure the differences make sense. `diff grammar.js grammar2.js`
5. If they make sense, overwrite `grammar2.js` with `grammar.js`
6. Run `tree-sitter generate`
    - Optionally after: run `tree-sitter build --wasm` and `tree-sitter playground` and ensure Teal files are working correctly
7. Release a new version

## Licenses
- Includes significant portions of [tree-sitter-teal](https://github.com/euclidianAce/tree-sitter-teal) - MIT
  - Namely the string literals, numbers, and comments, most of which is in `src/scanner.c`
- EBNF file from [Teal Language Site](https://github.com/teal-language/teal-language.github.io) - MIT
