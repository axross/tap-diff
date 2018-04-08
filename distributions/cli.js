#!/usr/bin/env node
'use strict';

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var reporter = (0, _index2.default)();

process.stdin.pipe(reporter).pipe(process.stdout);

process.on('exit', function (status) {
  if (status === 1 || reporter.isFailed) process.exit(1);
});