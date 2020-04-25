import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { PrivateRemoteFilesConfig, SSHMeta } from '../types';
import logger from '../logger';
import { serverConfigsDirpath, sshConfigsFilepath } from '../constants';

const validateSSHMeta = function (sshMeta: SSHMeta, filepath: string): void {
  if (!sshMeta.host) {
    logger.logContext(sshMeta);
    logger.syntaxError(`${logger.yellow('host')} is not defined.`, filepath);
    process.exit(1);
  }
  if (!sshMeta.user) {
    logger.logContext(sshMeta);
    logger.syntaxError(`${logger.yellow('user')} is not defined.`, filepath);
    process.exit(1);
  }
  if (!sshMeta.privateKeyPath) {
    logger.logContext(sshMeta);
    logger.syntaxError(`${logger.yellow('privateKeyPath')} is not defined.`, filepath);
    process.exit(1);
  }
  let keypath = sshMeta.privateKeyPath;
  if (path.isAbsolute(sshMeta.privateKeyPath)) {
    keypath = `${process.env.HOME}${sshMeta.privateKeyPath}`;
  }
  if (!existsSync(keypath)) {
    logger.error(`SSH key at ${logger.yellow(keypath)} does not exist.`);
    process.exit(1);
  }
};

const validateSSHConfig = function (ssh: PrivateRemoteFilesConfig[]): void {
  ssh.forEach((sshConfig) => {
    if (sshConfig.confpath) {
      let p = sshConfig.confpath;
      if (path.isAbsolute(p)) {
        p = `${process.env.HOME}${p}`;
      }
      const sshMeta: SSHMeta = JSON.parse(readFileSync(p, 'utf8'));
      validateSSHMeta(sshMeta, p);
    } else {
      if (existsSync(`${serverConfigsDirpath}/${sshConfig.confname}.json`)) {
        const sshMeta: SSHMeta = JSON.parse(
          readFileSync(`${serverConfigsDirpath}/${sshConfig.confname}.json`, 'utf8'),
        );
        validateSSHMeta(sshMeta, `${serverConfigsDirpath}/${sshConfig.confname}.json`);
      } else {
        const allConfigs = JSON.parse(readFileSync(sshConfigsFilepath, 'utf8'));
        validateSSHMeta(allConfigs[sshConfig.confname], sshConfigsFilepath);
      }
    }
  });
};

export default validateSSHConfig;
