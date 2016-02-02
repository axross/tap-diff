# tap-diff

[![npm version](https://badge.fury.io/js/tap-diff.svg)](http://badge.fury.io/js/tap-diff)

The most human-friendly [TAP reporter](https://github.com/substack/tape#pretty-reporters).

![Screenshot](screenshot1.png)

![Screenshot](screenshot2.png)

## How to use

You can use tap-notify in the same way as other [TAP reporters](https://github.com/substack/tape#pretty-reporters).

```
npm install -g tap-diff
```

```
tape ./*.test.js | tap-diff
```

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

MIT
