import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { PrivateRemoteFilesConfig } from '../types';
import { isObject } from '../utils';
import logger from '../logger';
import { serverConfigsDirpath, instanceConfFilename } from '../constants';

const validatePrivateRemoteFilesConfig = function (
  prfconfigs: PrivateRemoteFilesConfig[],
  confkey: string,
): void {
  const prfConfFileName = `${confkey}.json`;
  const prfConfFilePath = `${serverConfigsDirpath}/${prfConfFileName}`;
  prfconfigs.forEach((prfconfig, index) => {
    if (!isObject(prfconfig)) {
      logger.logContext(prfconfig);
      logger.syntaxError(
        `${confkey} config value at index ${logger.yellow(index)} is not an object.`,
        instanceConfFilename,
      );
      process.exit(1);
    }

    if (!prfconfig.plugins && !prfconfig.themes) {
      logger.logContext(prfconfig);
      logger.error(
        `At least one of ${logger.yellow('plugins')} or ${logger.yellow('themes')} must be defined`,
      );
      process.exit(1);
    }
    if (!Array.isArray(prfconfig.plugins)) {
      logger.logContext(prfconfig);
      logger.error(`${logger.yellow('plugins')} is not an array`);
      process.exit(1);
    }
    if (!Array.isArray(prfconfig.themes)) {
      logger.logContext(prfconfig);
      logger.error(`${logger.yellow('themes')} is not an array`);
      process.exit(1);
    }

    if (prfconfig.confpath) {
      let p = prfconfig.confpath;
      if (path.isAbsolute(p)) {
        p = `${process.env.HOME}${p}`;
      }
      if (!existsSync(p)) {
        logger.error(`No such file exists: ${logger.yellow(p)}`);
        process.exit(1);
      }
    } else {
      if (!prfconfig.confname) {
        logger.logContext(prfconfig);
        logger.syntaxError(
          `${logger.yellow('confname')} in ${confkey} config at index ${logger.yellow(
            index,
          )} is not defined.`,
          instanceConfFilename,
        );
        process.exit(1);
      }

      if (existsSync(`${serverConfigsDirpath}/${prfconfig.confname}.json`)) {
        try {
          JSON.parse(readFileSync(`${serverConfigsDirpath}/${prfconfig.confname}.json`, 'utf8'));
        } catch (err) {
          logger.error(err);
          process.exit(1);
        }
      } else if (existsSync(prfConfFilePath)) {
        try {
          const allConfigs = JSON.parse(readFileSync(prfConfFilePath, 'utf8'));
          if (!allConfigs[prfconfig.confname]) {
            logger.logContext(allConfigs);
            logger.syntaxError(
              `${logger.yellow(prfconfig.confname)} is not defined in ${logger.yellow(
                prfConfFilePath,
              )}. Either create a new file named ${logger.yellow(
                `${prfconfig.confname}.json`,
              )} in ${logger.yellow(serverConfigsDirpath)}, or add ${logger.yellow(
                prfconfig.confname,
              )} to ${logger.yellow(prfConfFileName)}.`,
              prfConfFileName,
            );
            process.exit(1);
          }
          if (!isObject(allConfigs[prfconfig.confname])) {
            logger.logContext(allConfigs);
            logger.syntaxError(
              `${logger.yellow(prfconfig.confname)} is defined in ${logger.yellow(
                prfConfFilePath,
              )} but it is not an object.`,
              prfConfFileName,
            );
            process.exit(1);
          }
        } catch (err) {
          logger.error(err);
          process.exit(1);
        }
      } else {
        logger.logContext(prfconfig);
        const ftpfile = `${prfconfig.confname}.json`;
        logger.error(
          `A file named ${logger.yellow(ftpfile)} nor a file named ${logger.yellow(
            prfConfFileName,
          )} exists in ${logger.yellow(
            serverConfigsDirpath,
          )}. Either create a new file named ${logger.yellow(ftpfile)} in ${logger.yellow(
            serverConfigsDirpath,
          )}, or create a ${logger.yellow(prfConfFileName)} file with ${logger.yellow(
            prfconfig.confname,
          )} as a key.`,
        );
        process.exit(1);
      }
    }
  });
};

export default validatePrivateRemoteFilesConfig;
