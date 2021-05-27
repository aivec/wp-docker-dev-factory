import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { homedir } from 'os';

export const isObject = (vartocheck: any): boolean =>
  vartocheck === Object(vartocheck) &&
  Object.prototype.toString.call(vartocheck) !== '[object Array]';

export const isString = (vartocheck: any): boolean => typeof vartocheck === 'string';

export const resolvePathToAbsolute = (contextdirpath: string, p: string): string => {
  if (path.isAbsolute(p)) {
    p = `${homedir()}${p}`;
  }
  return path.resolve(contextdirpath, p);
};

export const execp = promisify(exec);
