import path from 'path';
import logger from '../logger';
import { existsSync } from 'fs';
import { homedir } from 'os';

const validateLocalPaths = (type: string, localFolders: string[], workingdir: string): void => {
  localFolders.forEach((p) => {
    if (path.isAbsolute(p)) {
      p = `${homedir()}${p}`;
    }
    const abspath = path.resolve(workingdir, p);
    if (!existsSync(abspath)) {
      logger.error(
        `${logger.WHITE}Local ${type} at ${logger.YELLOW}${abspath}${logger.WHITE} does not exist.`,
      );
      process.exit(1);
    }
  });
};

export default validateLocalPaths;
