import { diffWords, diffJson } from 'diff';
import chalk from 'chalk';
import duplexer from 'duplexer';
import figures from 'figures';
import through2 from 'through2';
import parser from 'tap-parser';
import prettyMs from 'pretty-ms';

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

  const handleAssertFailure = assert => {
    const name = assert.name;
    const diag = assert.diag;
    const writeDiff = ({ value, added, removed }) => {
      let style = chalk.white;

      if (added)   style = chalk.green.inverse;
      if (removed) style = chalk.red.inverse;

      return style(value);
    };

    println(`${chalk.red(FIG_CROSS)}  ${chalk.red(name)} at ${chalk.magenta(diag.at)}`, 2);

    if (typeof diag.expected === 'object' && diag.expected !== null) {
      const compared = diffJson(diag.actual, diag.expected)
        .map(writeDiff)
        .join('');

      println(compared, 4);
    } else if (diag.expected === 'undefined' && diag.actual === 'undefined') {
      ;
    } else if (typeof diag.expected === 'string') {
      const compared = diffWords(diag.actual, diag.expected)
        .map(writeDiff)
        .join('');

      println(compared, 4);
    } else {
      println(
        chalk.red.inverse(diag.actual) + chalk.green.inverse(diag.expected),
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
