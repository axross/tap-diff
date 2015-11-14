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
  const output = through2()
  const p = parser();
  const stream = duplexer(p, output);
  const startedAt = Date.now();

  const write = (str, indentLevel = 0) => {
    let indent = '';

    for (let i = 0; i < indentLevel; ++i) {
      indent += INDENT;
    }

    output.push(
      str.split('\n')
        .map(part => part.length > 0 ? `${indent}${part}` : part)
        .join('\n')
    );
  };

  const handleTest = name => {
    write('\n');
    write(`${chalk.blue(name)}\n`, 1);
  };

  const handleAssertSuccess = assert => {
    const name = assert.name;

    write(`${chalk.green(FIG_TICK)}  ${chalk.dim(name)}\n`, 2);
  };

  const handleAssertFailure = assert => {
    const name = assert.name;
    const diag = assert.diag;
    const writeDiff = ({ value, added, removed }) => {
      let style = chalk.white;

      if (added)   style = chalk.green.inverse;
      if (removed) style = chalk.red.inverse;

      return value.split('\n')
        .map(str => str.length > 0 ? style(str) : str)
        .join('\n')
    };

    write(`${chalk.red(FIG_CROSS)}  ${chalk.red(name)} `, 2);
    write(`at ${chalk.magenta(diag.at)}\n`);

    if (typeof diag.expected === 'object' && diag.expected !== null) {
      const compared = diffJson(diag.actual, diag.expected)
        .map(writeDiff)
        .join('');

      write(`${compared}\n`, 4);
    } else if (typeof diag.expected === 'string') {
      const compared = diffWords(diag.actual, diag.expected)
        .map(writeDiff)
        .join('');

      write(`${compared}\n`, 4);
    } else {
      write('        ' +
        chalk.red.inverse(diag.actual) +
        chalk.green.inverse(diag.expected) + '\n'
      );
    }


  };

  const handleComplete = result => {
    const finishedAt = Date.now();

    write('\n');
    write(chalk.green(`passed: ${result.pass}  `));
    write(chalk.red(`failed: ${result.fail || 0}  `));
    write(chalk.white(`of ${result.count} tests  `));
    write(chalk.dim(`(${prettyMs(finishedAt - startedAt)})\n\n`));

    if (result.ok) {
      write(chalk.green(`All of ${result.count} tests passed!`));
    } else {
      write(chalk.red(
        `${result.fail} of ${result.count} tests failed.`
      ));
      stream.isFailed = true;
    }

    write('\n\n');
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

  return stream;
};

export default createReporter;
