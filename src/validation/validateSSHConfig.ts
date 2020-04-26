import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { PrivateRemoteFilesConfig, SSHMeta } from '../types';
import logger from '../logger';
import { serverConfigsDirpath, sshConfigsFilepath } from '../constants';
import { resolvePathToAbsolute } from '../utils';
import { ERR_FILE_NOT_FOUND, ERR_PROPERTY_REQUIRED, GenericError } from '../errors';

const validateSSHMeta = function (sshMeta: SSHMeta, filepath: string): void {
  if (!sshMeta.host) {
    logger.logContext(sshMeta);
    logger.syntaxError(`${logger.yellow('host')} is not defined.`, filepath);
    throw new GenericError(ERR_PROPERTY_REQUIRED, 'host is not defined');
  }
  if (!sshMeta.user) {
    logger.logContext(sshMeta);
    logger.syntaxError(`${logger.yellow('user')} is not defined.`, filepath);
    throw new GenericError(ERR_PROPERTY_REQUIRED, 'user is not defined');
  }
  if (!sshMeta.privateKeyPath) {
    logger.logContext(sshMeta);
    logger.syntaxError(`${logger.yellow('privateKeyPath')} is not defined.`, filepath);
    throw new GenericError(ERR_PROPERTY_REQUIRED, 'privateKeyPath is not defined');
  }
  const keypath = resolvePathToAbsolute(path.dirname(filepath), sshMeta.privateKeyPath);
  if (!existsSync(keypath)) {
    logger.error(`SSH key at ${logger.yellow(keypath)} does not exist.`);
    throw new GenericError(ERR_FILE_NOT_FOUND, `SSH key at ${keypath} does not exist.`);
  }
};

const validateSSHConfig = function (ssh: PrivateRemoteFilesConfig[], workingdir: string): void {
  ssh.forEach((sshConfig) => {
    if (sshConfig.confpath) {
      const p = resolvePathToAbsolute(workingdir, sshConfig.confpath);
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
