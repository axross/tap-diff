#!/usr/bin/env node

import createReporter from './index';

const reporter = createReporter();

process.stdin
  .pipe(reporter)
  .pipe(process.stdout);

process.on('exit', status => {
  if (status === 1 || reporter.isFailed) process.exit(1);
});
