'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _babelPolyfill = require('babel/polyfill');

var _babelPolyfill2 = _interopRequireDefault(_babelPolyfill);

var _diff = require('diff');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _duplexer = require('duplexer');

var _duplexer2 = _interopRequireDefault(_duplexer);

var _figures = require('figures');

var _figures2 = _interopRequireDefault(_figures);

var _through2 = require('through2');

var _through22 = _interopRequireDefault(_through2);

var _tapParser = require('tap-parser');

var _tapParser2 = _interopRequireDefault(_tapParser);

var _prettyMs = require('pretty-ms');

var _prettyMs2 = _interopRequireDefault(_prettyMs);

var INDENT = '  ';
var FIG_TICK = _figures2['default'].tick;
var FIG_CROSS = _figures2['default'].cross;

var createReporter = function createReporter() {
  var output = (0, _through22['default'])();
  var p = (0, _tapParser2['default'])();
  var stream = (0, _duplexer2['default'])(p, output);
  var startedAt = Date.now();

  var write = function write(str) {
    var indentLevel = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    var indent = '';

    for (var i = 0; i < indentLevel; ++i) {
      indent += INDENT;
    }

    output.push(str.split('\n').map(function (part) {
      return part.length > 0 ? '' + indent + part : part;
    }).join('\n'));
  };

  var handleTest = function handleTest(name) {
    write('\n');
    write(_chalk2['default'].blue(name) + '\n', 1);
  };

  var handleAssertSuccess = function handleAssertSuccess(assert) {
    var name = assert.name;

    write(_chalk2['default'].green(FIG_TICK) + '  ' + _chalk2['default'].dim(name) + '\n', 2);
  };

  var handleAssertFailure = function handleAssertFailure(assert) {
    var name = assert.name;
    var diag = assert.diag;
    var writeDiff = function writeDiff(_ref) {
      var value = _ref.value;
      var added = _ref.added;
      var removed = _ref.removed;

      var style = _chalk2['default'].white;

      if (added) style = _chalk2['default'].green.inverse;
      if (removed) style = _chalk2['default'].red.inverse;

      return value.split('\n').map(function (str) {
        return str.length > 0 ? style(str) : str;
      }).join('\n');
    };

    write(_chalk2['default'].red(FIG_CROSS) + '  ' + _chalk2['default'].red(name) + ' ', 2);
    write('at ' + _chalk2['default'].magenta(diag.at) + '\n');

    if (typeof diag.expected === 'object' && diag.expected !== null) {
      var compared = (0, _diff.diffJson)(diag.actual, diag.expected).map(writeDiff).join('');

      write(compared + '\n', 4);
    } else if (typeof diag.expected === 'string') {
      var compared = (0, _diff.diffWords)(diag.actual, diag.expected).map(writeDiff).join('');

      write(compared + '\n', 4);
    } else {
      write('        ' + _chalk2['default'].red.inverse(diag.actual) + _chalk2['default'].green.inverse(diag.expected) + '\n');
    }
  };

  var handleComplete = function handleComplete(results) {
    var finishedAt = Date.now();

    write('\n');
    write(_chalk2['default'].green('passed: ' + results.pass + '  '));
    write(_chalk2['default'].red('failed: ' + (results.fail || 0) + '  '));
    write(_chalk2['default'].white('of ' + results.count + ' tests  '));
    write(_chalk2['default'].dim('(' + (0, _prettyMs2['default'])(finishedAt - startedAt) + ')\n\n'));

    if (results.ok) {
      write(_chalk2['default'].green('All of ' + results.count + ' tests passed!'));
    } else {
      write(_chalk2['default'].red(results.fail + ' of ' + results.count + ' tests failed.'));
      stream.isFailed = true;
    }

    write('\n\n');
  };

  p.on('comment', function (comment) {
    var trimmed = comment.replace('# ', '').trim();

    if (/^tests\s+[0-9]+$/.test(trimmed)) return;
    if (/^pass\s+[0-9]+$/.test(trimmed)) return;
    if (/^fail\s+[0-9]+$/.test(trimmed)) return;
    if (/^ok$/.test(trimmed)) return;

    handleTest(trimmed);
  });

  p.on('assert', function (assert) {
    if (assert.ok) return handleAssertSuccess(assert);

    handleAssertFailure(assert);
  });

  p.on('complete', handleComplete);

  p.on('child', function (child) {
    ;
  });

  return stream;
};

exports['default'] = createReporter;
module.exports = exports['default'];