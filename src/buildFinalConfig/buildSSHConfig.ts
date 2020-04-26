import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { PrivateRemoteFilesConfig, SSHMeta, SSHConfig } from '../types';
import logger from '../logger';
import { serverConfigsDirpath, sshConfigsFilepath } from '../constants';
import { resolvePathToAbsolute } from '../utils';

const buildSSHConfig = function (ssh: PrivateRemoteFilesConfig[], workingdir: string): SSHConfig[] {
  let finalSSHConfig: SSHConfig[] = [];

  ssh.forEach((sshConfig) => {
    if (sshConfig.confpath) {
      try {
        const p = resolvePathToAbsolute(workingdir, sshConfig.confpath);
        const sshMeta: SSHMeta = JSON.parse(readFileSync(p, 'utf8'));
        sshMeta.privateKeyPath = resolvePathToAbsolute(path.dirname(p), sshMeta.privateKeyPath);
        sshMeta.privateKeyFilename = path.basename(sshMeta.privateKeyPath);
        finalSSHConfig = [...finalSSHConfig, { ...sshConfig, ...sshMeta }];
      } catch (err) {
        logger.error(err);
        process.exit(1);
      }
    } else {
      if (existsSync(`${serverConfigsDirpath}/${sshConfig.confname}.json`)) {
        try {
          const sshMeta: SSHMeta = JSON.parse(
            readFileSync(`${serverConfigsDirpath}/${sshConfig.confname}.json`, 'utf8'),
          );
          sshMeta.privateKeyPath = resolvePathToAbsolute(
            serverConfigsDirpath,
            sshMeta.privateKeyPath,
          );
          sshMeta.privateKeyFilename = path.basename(sshMeta.privateKeyPath);
          finalSSHConfig = [...finalSSHConfig, { ...sshConfig, ...sshMeta }];
        } catch (err) {
          logger.error(err);
          process.exit(1);
        }
      } else if (existsSync(sshConfigsFilepath)) {
        try {
          const allConfigs = JSON.parse(readFileSync(sshConfigsFilepath, 'utf8'));

          allConfigs[sshConfig.confname].privateKeyPath = resolvePathToAbsolute(
            serverConfigsDirpath,
            allConfigs[sshConfig.confname].privateKeyPath,
          );
          allConfigs[sshConfig.confname].privateKeyFilename = path.basename(
            allConfigs[sshConfig.confname].privateKeyPath,
          );
          finalSSHConfig = [...finalSSHConfig, { ...sshConfig, ...allConfigs[sshConfig.confname] }];
        } catch (err) {
          logger.error(err);
          process.exit(1);
        }
      }
    }
  });

  return finalSSHConfig;
};

export default buildSSHConfig;
