import { exec } from 'child_process';
import logger from './logger';

export const isObject = (vartocheck: any): boolean =>
  vartocheck === Object(vartocheck) &&
  Object.prototype.toString.call(vartocheck) !== '[object Array]';

export const isString = (vartocheck: any): boolean => typeof vartocheck === 'string';

export const isContainerRunning = (containerName: string, callback: (found: boolean) => void) => {
  exec(`docker ps --filter "name=${containerName}" -q`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      logger.error('command failed');
      process.exit(1);
    }
    if (stderr) {
      console.error(error);
      logger.error('command failed');
      process.exit(1);
    }
    // container was found and is running
    return callback(stdout ? true : false);
  });
};
