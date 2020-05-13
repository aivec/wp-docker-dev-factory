import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { PrivateRemoteFilesConfig, FtpMeta } from '../types';
import logger from '../logger';
import { serverConfigsDirpath, ftpConfigsFilepath } from '../constants';
import { homedir } from 'os';

const validateFtpMeta = function (ftpMeta: FtpMeta, filepath: string): void {
  if (!ftpMeta.host) {
    logger.logContext(ftpMeta);
    logger.syntaxError(`${logger.yellow('host')} is not defined.`, filepath);
    process.exit(1);
  }
  if (!ftpMeta.user) {
    logger.logContext(ftpMeta);
    logger.syntaxError(`${logger.yellow('user')} is not defined.`, filepath);
    process.exit(1);
  }
};

const validateFtpConfig = function (ftp: PrivateRemoteFilesConfig[]): void {
  ftp.forEach((ftpConfig) => {
    if (ftpConfig.confpath) {
      let p = ftpConfig.confpath;
      if (path.isAbsolute(p)) {
        p = `${homedir()}${p}`;
      }
      const ftpMeta: FtpMeta = JSON.parse(readFileSync(p, 'utf8'));
      validateFtpMeta(ftpMeta, p);
    } else {
      if (existsSync(`${serverConfigsDirpath}/${ftpConfig.confname}.json`)) {
        const ftpMeta: FtpMeta = JSON.parse(
          readFileSync(`${serverConfigsDirpath}/${ftpConfig.confname}.json`, 'utf8'),
        );
        validateFtpMeta(ftpMeta, `${serverConfigsDirpath}/${ftpConfig.confname}.json`);
      } else {
        const allConfigs = JSON.parse(readFileSync(ftpConfigsFilepath, 'utf8'));
        validateFtpMeta(allConfigs[ftpConfig.confname], ftpConfigsFilepath);
      }
    }
  });
};

export default validateFtpConfig;
