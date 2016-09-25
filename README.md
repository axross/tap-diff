# tap-emoji-diff

[![npm version](https://badge.fury.io/js/tap-diff.svg)](http://badge.fury.io/js/tap-emoji-diff)

My own version 🍺  of diff b/c I am 🙄  special 🚌  and can't work 👍  w/out emoji's
to keep me focused 👀.
* This is forked from [axross](https://github.com/axross/tap-diff) b/c I
  liked that reporter best

![Screenshot](screenshot1.png)

## How to use

* Works well on OSX, may break on other things.

You can use tap-diff in the same way as other [TAP reporters](https://github.com/substack/tape#pretty-reporters).

```
npm install -g tap-emoji-diff
```

```
tape ./*.test.js | tap-emoji-diff
```

tap-emoji-diff uses [chalk](https://www.npmjs.com/package/chalk) for adding color, which automatically detects
color terminals. If you're piping the output and want to force color:

```
FORCE_COLOR=t tape ./*.test.js | tap-emoji-diff
```

## License

MIT
