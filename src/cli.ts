import yargs from 'yargs';

export interface CommandArgs extends yargs.Arguments {
  d: boolean;
}
