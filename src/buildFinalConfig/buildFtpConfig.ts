import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { PrivateRemoteFilesConfig, FtpMeta, FtpConfig } from '../types';
import logger from '../logger';
import { serverConfigsDirpath, ftpConfigsFilepath } from '../constants';

const buildFtpConfig = function (ftp: PrivateRemoteFilesConfig[]): FtpConfig[] {
  let finalFtpConfig: FtpConfig[] = [];

  ftp.forEach((ftpConfig) => {
    if (ftpConfig.confpath) {
      try {
        let p = ftpConfig.confpath;
        if (path.isAbsolute(p)) {
          p = `${process.env.HOME}${p}`;
        }
        const ftpMeta: FtpMeta = JSON.parse(readFileSync(p, 'utf8'));
        finalFtpConfig = [...finalFtpConfig, { ...ftpConfig, ...ftpMeta }];
      } catch (err) {
        logger.error(err);
        process.exit(1);
      }
    } else {
      if (existsSync(`${serverConfigsDirpath}/${ftpConfig.confname}.json`)) {
        try {
          const ftpMeta: FtpMeta = JSON.parse(
            readFileSync(`${serverConfigsDirpath}/${ftpConfig.confname}.json`, 'utf8'),
          );
          finalFtpConfig = [...finalFtpConfig, { ...ftpConfig, ...ftpMeta }];
        } catch (err) {
          logger.error(err);
          process.exit(1);
        }
      } else if (existsSync(ftpConfigsFilepath)) {
        try {
          const allConfigs = JSON.parse(readFileSync(ftpConfigsFilepath, 'utf8'));
          finalFtpConfig = [...finalFtpConfig, { ...ftpConfig, ...allConfigs[ftpConfig.confname] }];
        } catch (err) {
          logger.error(err);
          process.exit(1);
        }
      }
    }
  });

  return finalFtpConfig;
};

export default buildFtpConfig;
