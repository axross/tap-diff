#!/usr/bin/env node
import yargs from 'yargs';
import createReporter from './index';

const usage = `
Usage: tap-diff [--nosuccess]

Options:
  --nosuccess       Discard success messages
`;

const { argv } = yargs;

if (argv.h || argv.help) {
  console.log(usage);
  process.exit(0);
}

const reporter = createReporter({
  noSuccess: argv.nosuccess,
});

process.stdin
  .pipe(reporter)
  .pipe(process.stdout);

process.on('exit', status => {
  if (status === 1 || reporter.isFailed) process.exit(1);
});
