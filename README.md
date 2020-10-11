# amd-to-es6 codemod

Codemod for converting AMD require-statements to ES6 imports statements. The code isn't battle-tested, so I would recommend using https://github.com/buxlabs/amd-to-es6 instead.

## Usage

1. `npm install -g jscodeshift`
2. `npm install`
3. `jscodeshift -t ./transforms/amd.js [files]`

# Credits

Most of the code have been extracted from https://github.com/5to6/5to6-codemod/