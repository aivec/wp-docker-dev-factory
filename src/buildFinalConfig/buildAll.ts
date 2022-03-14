import path from 'path';
import { homedir } from 'os';
import buildFtpConfig from './buildFtpConfig';
import buildEnvVars from './buildEnvVars';
import buildVolumePaths from './buildVolumePaths';
import buildPluginAutoInstallWhitelist from './buildPluginAutoInstallWhitelist';
import { _ } from 'lodash';
import { InstanceConfig, FinalInstanceConfig } from '../types';
import buildSSHConfig from './buildSSHConfig';

const buildFinalConfig = (
  config: InstanceConfig,
  workingdir: string,
  topdir: string,
): FinalInstanceConfig => {
  const configCopy: InstanceConfig = _.cloneDeep(config);
  const phpVersion = configCopy.phpVersion ? configCopy.phpVersion : '7.3';
  const snapshotImage = `${configCopy.instanceName}-${phpVersion}`;
  const dockerBridgeIP = 'host.docker.internal';
  let locale = configCopy.locale ? configCopy.locale : 'en_US';
  if (configCopy.wordpressVersion === 'nightly') {
    locale = 'en_US';
  }
  let flushOnRestart = false;
  if (config.database) {
    flushOnRestart = !!config.database.flushOnRestart;
  }
  let image = configCopy.image;
  if (image) {
    if (path.isAbsolute(image)) {
      image = `${homedir()}${image}`;
    }
    image = path.resolve(workingdir, image);
  }

  const finalConfig: FinalInstanceConfig = {
    instanceName: configCopy.instanceName,
    containerPort: configCopy.containerPort,
    phpVersion,
    wordpressVersion: configCopy.wordpressVersion ? configCopy.wordpressVersion : 'latest',
    locale,
    flushOnRestart,
    database: configCopy.database,
    env: configCopy.env ? configCopy.env : null,
    localPlugins: configCopy.localPlugins ? configCopy.localPlugins : [],
    localThemes: configCopy.localThemes ? configCopy.localThemes : [],
    downloadPlugins: configCopy.downloadPlugins ? configCopy.downloadPlugins : [],
    downloadThemes: configCopy.downloadThemes ? configCopy.downloadThemes : [],
    uploads: configCopy.uploads ? configCopy.uploads : null,
    uploadsUrl: configCopy.uploadsUrl ? configCopy.uploadsUrl : null,
    networkname: 'wpdevinstances',
    containerName: configCopy.instanceName,
    snapshotImage,
    runningFromCache: !!image,
    dockerBridgeIP,
    alreadyInstalled: buildPluginAutoInstallWhitelist(configCopy, workingdir),
    topdir,
    workingdir,
    image,
  };

  if (configCopy.ftp) {
    finalConfig.ftp = buildFtpConfig(configCopy.ftp);
  }

  if (configCopy.ssh) {
    finalConfig.ssh = buildSSHConfig(configCopy.ssh, workingdir);
  }

  finalConfig.volumes = buildVolumePaths(finalConfig, configCopy, workingdir, topdir);
  finalConfig.envvarsMap = buildEnvVars(finalConfig);
  finalConfig.envvars = Object.keys(finalConfig.envvarsMap)
    .map((key) => {
      return `--env ${key}=${finalConfig.envvarsMap[key]}`;
    })
    .join(' ');

  return finalConfig;
};

export default buildFinalConfig;
