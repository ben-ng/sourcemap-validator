sourcemap-validator
===================

[![Build Status](https://travis-ci.org/ben-ng/sourcemap-validator.png)](https://travis-ci.org/ben-ng/sourcemap-validator)

Mapped all the things? Now validate all the maps.

Usage
-----

```
var validate('sourcemap-validator')
  , fs = require('fs')
  , assert = require('assert')
  , raw = fs.readFileSync('jquery.js')
  , min = fs.readFileSync('jquery.min.js')
  , map = fs.readFileSync('jquery.min.map');

assert.doesNotThrow(function () {
  validate({'?': raw}, min, map);
}, 'The sourcemap is not valid');
```

Notes
-----

The sourcemap spec isn't exactly very mature, so this module only aims to give you a Pretty Good™ idea of whether or not your sourcemap is correct.

### Quoted keys in object literals

If a sourcemap maps "literal" without the quotes to column 3, we will consider that valid.

**Example**
```
var v = {
  literal: true
//^-- ok to map {name: literal, column: 3} here
};

var t = {
  "literal": true
//^-- ok to map {name: literal, column: 3} here, even though the token actually appears in column 4
};
```

See the discussion [here](https://github.com/mishoo/UglifyJS2/pull/303#issuecomment-27628362)

However, mapping something totally wrong like `"cookie"` to that index will throw an exception.

## Missing mappings

There is no way for the validator to know if you are missing mappings. It can only ensure that the ones you made are sensible. The validator will consider a sourcemap with zero mappings invalid as a sanity check, but if your map at least one sensisble mapping, it is a valid map.
