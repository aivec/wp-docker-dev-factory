import path from 'path';
import fs from 'fs';
import { homedir } from 'os';
import logger from '../logger';

const vaidateCustomScriptsMode = (localScriptPaths: string[], workingdir: string): void => {
  localScriptPaths.forEach((p) => {
    if (path.isAbsolute(p)) {
      p = `${homedir()}${p}`;
    }
    const abspath = path.resolve(workingdir, p);
    const script = path.basename(abspath);

    fs.access(script, fs.constants.X_OK, (err) => {
      logger.error(
        `${logger.WHITE}Custom script file at ${logger.YELLOW}${abspath}${logger.WHITE} is not executable.`,
      );
      process.exit(1);
    });
  });
};

export default vaidateCustomScriptsMode;
