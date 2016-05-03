import { diffWords, diffJson } from 'diff';
import chalk from 'chalk';
import duplexer from 'duplexer';
import figures from 'figures';
import through2 from 'through2';
import parser from 'tap-parser';
import prettyMs from 'pretty-ms';
import jsondiffpatch from 'jsondiffpatch';
import pdiff from 'pdiff';

const INDENT = '  ';
const FIG_TICK = figures.tick;
const FIG_CROSS = figures.cross;

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
    println(chalk.blue(name), 1);
  };

  const handleAssertSuccess = assert => {
    const name = assert.name;

    println(`${chalk.green(FIG_TICK)}  ${chalk.dim(name)}`, 2)
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
      let style = chalk.white;

      if (added)   style = chalk.green.inverse;
      if (removed) style = chalk.red.inverse;

      // only highlight values and not spaces before
      return value.replace(/(^\s*)(.*)/g, (m, one, two) => one + style(two))
    };

    function decodeNewlines(str) {
      if (str.match(/([^\\])\\n/g)) return decodeNewlines(str.replace(/([^\\])\\n/g, '$1\n'));
      return str;
    }

    const diffStrings = (actual, expected) => {
      const padding = '       ';
      const line = 1;
      const diff_ = pdiff.addLineNumbers(pdiff.diff(decodeNewlines(actual), decodeNewlines(expected)));
      const diff = pdiff.extractDiff(diff_, line);
      const maxLine = diff_.length;
      const digit = String(maxLine).length;
      let spaces = '';
      for (let i = 0; i < digit - 1; i++) spaces += ' ';
      console.log('');
      diff.forEach((group, i) => {
        group.forEach(delta => {
          let text = padding;
          // Add line numbers
          if (delta.lineNumberOfLhs != undefined) {
            text += chalk.magenta((spaces + (delta.lineNumberOfLhs + 1)).substr(-digit));
          } else {
            text += spaces + chalk.magenta('-');
          }
          text += ' ';
          if (delta.lineNumberOfRhs != undefined) {
            text += chalk.magenta((spaces + (delta.lineNumberOfRhs + 1)).substr(-digit));
          } else {
            text += spaces + chalk.magenta('-');
          }
          text += ' ';

          // Add the value of this line
          delta.values.forEach(value => {
            if (value.added) {
              text += chalk.green.inverse(value.value);
              return;
            }
            if (value.removed) {
              text += chalk.red.inverse(value.value);
              return;
            }
            text += chalk.dim(value.value);
          })

          // Ouput the delta
          console.log(text);
        });

        if (i != diff.length - 1) {
          console.log(padding + chalk.dim('...'));
        }
      });
      console.log('');
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

    println(`${chalk.red(FIG_CROSS)}  ${chalk.red(name)} at ${chalk.magenta(at)}`, 2);

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
      diffStrings(actual, expected)
    } else {
      println(
        chalk.red.inverse(actual) + chalk.green.inverse(expected),
        4
      );
    }
  };

  const handleComplete = result => {
    const finishedAt = Date.now();

    println();
    println(
      chalk.green(`passed: ${result.pass}  `) +
      chalk.red(`failed: ${result.fail || 0}  `) +
      chalk.white(`of ${result.count} tests  `) +
      chalk.dim(`(${prettyMs(finishedAt - startedAt)})`)
    );
    println();

    if (result.ok) {
      println(chalk.green(`All of ${result.count} tests passed!`));
    } else {
      println(chalk.red(`${result.fail || 0} of ${result.count} tests failed.`));
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
    println(chalk.yellow(`${extra}`.replace(/\n$/, '')), 4);
  });

  return stream;
};

export default createReporter;
