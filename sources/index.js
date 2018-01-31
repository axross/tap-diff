import { diffSentences, diffWordsWithSpace, diffJson } from 'diff';
import chalk from 'chalk';
import duplexer from 'duplexer';
import figures from 'figures';
import through2 from 'through2';
import parser from 'tap-parser';
import prettyMs from 'pretty-ms';
import jsondiffpatch from 'jsondiffpatch';

const INDENT = '  '
const FIG_TICK = '🍺 '
const FIG_CROSS = '🔥 '
const DIFF_LENGTH = 7
const success_color = chalk.blue
const failure_color = chalk.yellow
const bright_color = chalk.white
const dim_color = chalk.dim
const title_color = chalk.cyan
const attention_color = chalk.orange

const createReporter = () => {
  const output = through2();
  const p = parser();
  const stream = duplexer(p, output);
  const startedAt = Date.now();

  const println = (input = '', indentLevel = 0) => {
    let indent = '';

    for (let i = 0; i < indentLevel; ++i) {
      indent += INDENT;
    }

    input.split('\n').forEach(line => {
      output.push(`${indent}${line}`);
      output.push('\n');
    });
  };

  const handleTest = name => {
    println();
    println(title_color(name), 1);
  };

  const handleAssertSuccess = assert => {
    const name = assert.name;

    println(`${success_color(FIG_TICK)}  ${success_color(name)}`, 2)
  };

  const toString = (arg) => Object.prototype.toString.call(arg).slice(8, -1).toLowerCase()

  const JSONize = (str) => {
    return str
      // wrap keys without quote with valid double quote
      .replace(/([\$\w]+)\s*:/g, (_, $1) => '"'+$1+'":')
      // replacing single quote wrapped ones to double quote
      .replace(/'([^']+)'/g, (_, $1) => '"' + $1 + '"')
  }

  const handleAssertFailure = assert => {
    const name = assert.name;

    const writeDiff = ({ value, added, removed }) => {
      let style = bright_color
      if (added)   style = success_color.inverse
      if (removed) style = failure_color.inverse
      return value.replace(/(^\s*)(.*)/g, (m, one, two) => one + style(two))
    };

    let {
      at,
      actual,
      expected
    } = assert.diag

    let expected_type = toString(expected)

    if (expected_type !== 'array' ) {
      try {
        // the assert event only returns strings which is broken so this
        // handles converting strings into objects
        if (expected.indexOf('{') > -1) {
          actual = JSON.stringify(JSON.parse(JSONize(actual)), null, 2)
          expected = JSON.stringify(JSON.parse(JSONize(expected)), null, 2)
        }
      } catch (e) {
        try {
          actual = JSON.stringify(eval(`(${actual})`), null, 2)
          expected = JSON.stringify(eval(`(${expected})`), null, 2)
        } catch (e) {
          // do nothing because it wasn't a valid json object
        }
      }

      expected_type = toString(expected)
    }

    println(`${failure_color(FIG_CROSS)}  ${failure_color(name)} at ${attention_color(at)}`, 2);

    if (expected_type === 'object') {
      const delta = jsondiffpatch.diff(actual[failed_test_number], expected[failed_test_number])
      const output = jsondiffpatch.formatters.console.format(delta)
      println(output, 4)

    } else if (expected_type === 'array') {
      const compared = diffJson(actual, expected)
        .map(writeDiff)
        .join('');

      println(compared, 4);
    } else if (expected === 'undefined' && actual === 'undefined') {
      ;
    } else if (expected_type === 'string') {
      const compared = diffWordsWithSpace(actual, expected)
        .map(writeDiff)
        .join('');

      if (actual.length > DIFF_LENGTH) println(actual, 4);
      println(compared, 4);
      if (expected.length > DIFF_LENGTH)println(expected, 4);
    } else {
      println(
        failure_color.inverse(actual) + success_color.inverse(expected),
        4
      );
    }
  };

  const handleComplete = result => {
    const finishedAt = Date.now();

    println();
    println(
      success_color(`${FIG_TICK} passed: ${result.pass}  `) +
      failure_color(`${FIG_CROSS} failed: ${result.fail || 0}  `) +
      bright_color(`of ${result.count} tests  `) +
      dim_color(`(${prettyMs(finishedAt - startedAt)})`)
    );
    println();

    if (result.ok) {
      println(success_color(`${FIG_TICK} All of ${result.count} tests passed!`));
    } else {
      println(failure_color(`${FIG_CROSS} ${result.fail || 0} of ${result.count} tests failed.`));
      stream.isFailed = true;
    }

    println();
  };

  p.on('comment', (comment) => {
    const trimmed = comment.replace('# ', '').trim();

    if (/^tests\s+[0-9]+$/.test(trimmed)) return;
    if (/^pass\s+[0-9]+$/.test(trimmed)) return;
    if (/^fail\s+[0-9]+$/.test(trimmed)) return;
    if (/^ok$/.test(trimmed)) return;

    handleTest(trimmed);
  });

  p.on('assert', (assert) => {
    if (assert.ok) return handleAssertSuccess(assert);

    handleAssertFailure(assert);
  });

  p.on('complete', handleComplete);

  p.on('child', (child) => {
    ;
  });

  p.on('extra', extra => {
    println(attention_color(`${extra}`.replace(/\n$/, '')), 4);
  });

  return stream;
};

export default createReporter;
