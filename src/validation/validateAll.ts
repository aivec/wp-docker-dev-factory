import validateFtpConfig from './validateFtpConfig';
import jsonKeySetCheck from './checkJsonKeyExistence';
import localPathsExistOrExit from './validateLocalPaths';
import isArrayOrExit from './checkIsArray';
import { InstanceConfig } from '../types';
import validatePrivateRemoteFilesConfig from './validatePrivateRemoteFilesConfig';
import validateSSHConfig from './validateSSHConfig';
import validatePhpVersion from './validatePhpVersion';
import vaidateCustomScriptsMode from './validateCustomScriptsMode';

const validateConfig = (config: InstanceConfig, workingdir: string): void => {
  jsonKeySetCheck(config, 'containerPort');
  jsonKeySetCheck(config, 'instanceName');

  if (config.phpVersion) {
    validatePhpVersion(config.phpVersion);
  }

  const arrayTypeKeys = [
    'localPlugins',
    'localThemes',
    'downloadPlugins',
    'downloadThemes',
    'customInitScripts',
    'ftp',
    'ssh',
  ];
  arrayTypeKeys.forEach((key) => {
    if (config[key]) {
      isArrayOrExit(config, key);
    }
  });

  if (config.localPlugins) {
    localPathsExistOrExit('plugin', config.localPlugins, workingdir);
  }

  if (config.localThemes) {
    localPathsExistOrExit('theme', config.localThemes, workingdir);
  }

  if (config.customInitScripts) {
    localPathsExistOrExit('script', config.customInitScripts, workingdir);
    // vaidateCustomScriptsMode(config.customInitScripts, workingdir);
  }

  const prfConfigKeys = ['ssh', 'ftp'];
  prfConfigKeys.forEach((key) => {
    if (config[key]) {
      validatePrivateRemoteFilesConfig(config[key], key);
    }
  });

  if (config.ftp) {
    validateFtpConfig(config.ftp);
  }

  if (config.ssh) {
    validateSSHConfig(config.ssh, workingdir);
  }

  if (config.database) {
    const { mysqlDumpfile } = config.database;
    if (mysqlDumpfile) {
      localPathsExistOrExit('MySQL dump file', [mysqlDumpfile], workingdir);
    }
  }
};

export default validateConfig;
