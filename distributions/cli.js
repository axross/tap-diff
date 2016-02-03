#!/usr/bin/env node
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var usage = '\nUsage: tap-diff [--nosuccess]\n\nOptions:\n  --nosuccess       Discard success messages\n';

var argv = _yargs2['default'].argv;

if (argv.h || argv.help) {
  console.log(usage);
  process.exit(0);
}

var reporter = (0, _index2['default'])({
  noSuccess: argv.nosuccess
});

process.stdin.pipe(reporter).pipe(process.stdout);

process.on('exit', function (status) {
  if (status === 1 || reporter.isFailed) process.exit(1);
});