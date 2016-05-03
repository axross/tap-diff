'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

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

var _jsondiffpatch = require('jsondiffpatch');

var _jsondiffpatch2 = _interopRequireDefault(_jsondiffpatch);

var _pdiff = require('pdiff');

var _pdiff2 = _interopRequireDefault(_pdiff);

var INDENT = '  ';
var FIG_TICK = _figures2['default'].tick;
var FIG_CROSS = _figures2['default'].cross;

var createReporter = function createReporter() {
  var output = (0, _through22['default'])();
  var p = (0, _tapParser2['default'])();
  var stream = (0, _duplexer2['default'])(p, output);
  var startedAt = Date.now();

  var println = function println() {
    var input = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
    var indentLevel = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    var indent = '';

    for (var i = 0; i < indentLevel; ++i) {
      indent += INDENT;
    }

    input.split('\n').forEach(function (line) {
      output.push('' + indent + line);
      output.push('\n');
    });
  };

  var handleTest = function handleTest(name) {
    println();
    println(_chalk2['default'].blue(name), 1);
  };

  var handleAssertSuccess = function handleAssertSuccess(assert) {
    var name = assert.name;

    println(_chalk2['default'].green(FIG_TICK) + '  ' + _chalk2['default'].dim(name), 2);
  };

  var toString = function toString(arg) {
    return Object.prototype.toString.call(arg).slice(8, -1).toLowerCase();
  };

  var JSONize = function JSONize(str) {
    return str
    // wrap keys without quote with valid double quote
    .replace(/([\$\w]+)\s*:/g, function (_, $1) {
      return '"' + $1 + '":';
    })
    // replacing single quote wrapped ones to double quote
    .replace(/'([^']+)'/g, function (_, $1) {
      return '"' + $1 + '"';
    });
  };

  var handleAssertFailure = function handleAssertFailure(assert) {
    var name = assert.name;

    var writeDiff = function writeDiff(_ref) {
      var value = _ref.value;
      var added = _ref.added;
      var removed = _ref.removed;

      var style = _chalk2['default'].white;

      if (added) style = _chalk2['default'].green.inverse;
      if (removed) style = _chalk2['default'].red.inverse;

      // only highlight values and not spaces before
      return value.replace(/(^\s*)(.*)/g, function (m, one, two) {
        return one + style(two);
      });
    };

    function decodeNewlines(_x3) {
      var _again = true;

      _function: while (_again) {
        var str = _x3;
        _again = false;

        if (str.match(/([^\\])\\n/g)) {
          _x3 = str.replace(/([^\\])\\n/g, '$1\n');
          _again = true;
          continue _function;
        }
        return str;
      }
    }

    var diffStrings = function diffStrings(actual, expected) {
      var padding = '       ';
      var line = 1;
      var diff_ = _pdiff2['default'].addLineNumbers(_pdiff2['default'].diff(decodeNewlines(actual), decodeNewlines(expected)));
      var diff = _pdiff2['default'].extractDiff(diff_, line);
      var maxLine = diff_.length;
      var digit = String(maxLine).length;
      var spaces = '';
      for (var i = 0; i < digit - 1; i++) {
        spaces += ' ';
      }console.log('');
      diff.forEach(function (group, i) {
        group.forEach(function (delta) {
          var text = padding;
          // Add line numbers
          if (delta.lineNumberOfLhs != undefined) {
            text += _chalk2['default'].magenta((spaces + (delta.lineNumberOfLhs + 1)).substr(-digit));
          } else {
            text += spaces + _chalk2['default'].magenta('-');
          }
          text += ' ';
          if (delta.lineNumberOfRhs != undefined) {
            text += _chalk2['default'].magenta((spaces + (delta.lineNumberOfRhs + 1)).substr(-digit));
          } else {
            text += spaces + _chalk2['default'].magenta('-');
          }
          text += ' ';

          // Add the value of this line
          delta.values.forEach(function (value) {
            if (value.added) {
              text += _chalk2['default'].green.inverse(value.value);
              return;
            }
            if (value.removed) {
              text += _chalk2['default'].red.inverse(value.value);
              return;
            }
            text += _chalk2['default'].dim(value.value);
          });

          // Ouput the delta
          console.log(text);
        });

        if (i != diff.length - 1) {
          console.log(padding + _chalk2['default'].dim('...'));
        }
      });
      console.log('');
    };

    var _assert$diag = assert.diag;
    var at = _assert$diag.at;
    var actual = _assert$diag.actual;
    var expected = _assert$diag.expected;

    var expected_type = toString(expected);

    if (expected_type !== 'array') {
      try {
        // the assert event only returns strings which is broken so this
        // handles converting strings into objects
        if (expected.indexOf('{') > -1) {
          actual = JSON.stringify(JSON.parse(JSONize(actual)), null, 2);
          expected = JSON.stringify(JSON.parse(JSONize(expected)), null, 2);
        }
      } catch (e) {
        try {
          actual = JSON.stringify(eval('(' + actual + ')'), null, 2);
          expected = JSON.stringify(eval('(' + expected + ')'), null, 2);
        } catch (e) {
          // do nothing because it wasn't a valid json object
        }
      }

      expected_type = toString(expected);
    }

    println(_chalk2['default'].red(FIG_CROSS) + '  ' + _chalk2['default'].red(name) + ' at ' + _chalk2['default'].magenta(at), 2);

    if (expected_type === 'object') {
      var delta = _jsondiffpatch2['default'].diff(actual[failed_test_number], expected[failed_test_number]);
      var _output = _jsondiffpatch2['default'].formatters.console.format(delta);
      println(_output, 4);
    } else if (expected_type === 'array') {
      var compared = (0, _diff.diffJson)(actual, expected).map(writeDiff).join('');

      println(compared, 4);
    } else if (expected === 'undefined' && actual === 'undefined') {
      ;
    } else if (expected_type === 'string') {
      diffStrings(actual, expected);
    } else {
      println(_chalk2['default'].red.inverse(actual) + _chalk2['default'].green.inverse(expected), 4);
    }
  };

  var handleComplete = function handleComplete(result) {
    var finishedAt = Date.now();

    println();
    println(_chalk2['default'].green('passed: ' + result.pass + '  ') + _chalk2['default'].red('failed: ' + (result.fail || 0) + '  ') + _chalk2['default'].white('of ' + result.count + ' tests  ') + _chalk2['default'].dim('(' + (0, _prettyMs2['default'])(finishedAt - startedAt) + ')'));
    println();

    if (result.ok) {
      println(_chalk2['default'].green('All of ' + result.count + ' tests passed!'));
    } else {
      println(_chalk2['default'].red((result.fail || 0) + ' of ' + result.count + ' tests failed.'));
      stream.isFailed = true;
    }

    println();
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

  p.on('extra', function (extra) {
    println(_chalk2['default'].yellow(('' + extra).replace(/\n$/, '')), 4);
  });

  return stream;
};

exports['default'] = createReporter;
module.exports = exports['default'];