#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { canUseDockerOrExit } from './docker/daemon';
import { CommandArgs } from './cli';
import { showPrompts } from './interactive';
import { debug } from './logger';

const argv: CommandArgs = yargs(process.argv.slice(2))
  .usage('Usage: $0 <path>')
  .options({
    d: { type: 'boolean', alias: 'debug', default: false },
  }).argv;

(async (): Promise<void> => {
  if (argv.d) {
    process.env.DEBUG = '1';
  }
  debug('command arguments:', argv);
  await canUseDockerOrExit();
  showPrompts(argv);
})();
