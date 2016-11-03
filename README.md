# tap-diff

> The most human-friendly TAP reporter

<!--@shields('npm')-->
[![npm version](https://img.shields.io/npm/v/tap-diff.svg)](https://www.npmjs.com/package/tap-diff)
<!--/@-->

![Screenshot](screenshot1.png)

![Screenshot](screenshot2.png)

## Installation

```sh
npm install --global tap-diff
```

## How to use

You can use tap-diff in the same way as other [TAP reporters](https://github.com/substack/tape#pretty-reporters).

```sh
tape ./*.test.js | tap-diff
```

tap-diff uses [chalk](https://www.npmjs.com/package/chalk) for adding color, which automatically detects
color terminals. If you're piping the output and want to force color:

    FORCE_COLOR=t tape ./*.test.js | tap-diff

Or use with `createStream()`:

```javascript
'use strict'

const test = require('tape')
const tapDiff = require('tap-diff')

test.createStream()
  .pipe(tapDiff())
  .pipe(process.stdout)

test('timing test', (t) => {
  t.plan(2)
  t.equal(typeof Date.now, 'function')
  var start = Date.now()

  setTimeout(() => {
    t.equal(Date.now() - start, 100)
  }, 100)
})
```

## License

[MIT](./LICENSE) © [axross](http://axross.me/)
