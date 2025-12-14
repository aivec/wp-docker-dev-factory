import path from 'path';
import { homedir } from 'os';
import buildFtpConfig from './buildFtpConfig';
import buildEnvVars from './buildEnvVars';
import buildVolumePaths from './buildVolumePaths';
import buildPluginAutoInstallWhitelist from './buildPluginAutoInstallWhitelist';
import { _ } from 'lodash';
import { InstanceConfig, FinalInstanceConfig, ConfigVariables } from '../types';
import buildSSHConfig from './buildSSHConfig';
import { containerStatus } from '../docker/container';
import {
  dockerMetaDirpath,
  dockerScriptsDirpath,
  INSTANCE_CONFIG_FILENAME,
  DOCKER_CONTAINER_INSTANCE_CONFIG_FILEPATH,
  DOCKER_CONTAINER_DB_DUMPFILE_PATH,
} from '../constants';

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
  let fullUrl = 'http://localhost';
  if (config.hostName && config.hostName.length > 0) {
    fullUrl = `http://${config.hostName}`;
  }
  if (config.containerPort) {
    fullUrl = `${fullUrl}:${config.containerPort}`;
  }

  const instanceDir = `${config.workingdir}/instances/${configCopy.instanceName}`;
  const instanceEnvFilePath = `${instanceDir}/.env`;
  const instanceComposeFile = `${instanceDir}/docker-compose.wp.yml`;
  const instanceConfigFilePath = `${config.topdir}/tmp/${INSTANCE_CONFIG_FILENAME}`;
  const commonDockerFilesDir = `${topdir}/docker`;
  const commonServicesComposeFilePath = `${commonDockerFilesDir}/docker-compose.common.yml`;
  const instanceComposeFileTemplatePath = `${commonDockerFilesDir}/docker-compose.template.yml`;

  const configVariables: ConfigVariables = {
    DOCKER_CONTAINER_CONFIG_FOLDER: {
      applicationTypes: ['build'],
      value: dockerMetaDirpath,
    },
    DOCKER_CONTAINER_INSTANCE_CONFIG_FILEPATH: {
      applicationTypes: ['build'],
      value: DOCKER_CONTAINER_INSTANCE_CONFIG_FILEPATH,
    },
    DOCKER_CONTAINER_SCRIPTS_DIR: {
      applicationTypes: [],
      value: dockerScriptsDirpath,
    },
    DOCKER_CONTAINER_DB_DUMPFILE_PATH: {
      applicationTypes: [],
      value: DOCKER_CONTAINER_DB_DUMPFILE_PATH,
    },
    DOCKER_CONTAINER_STATUS: {
      applicationTypes: [],
      value: containerStatus(configCopy.instanceName) === null ? 'fresh' : 'restart',
    },
    INSTANCE_CONFIG_FILENAME: {
      applicationTypes: [],
      value: INSTANCE_CONFIG_FILENAME,
    },
    HOST_INSTANCE_CONFIG_FILEPATH: {
      applicationTypes: ['build'],
      value: instanceConfigFilePath,
    },
  };

  const finalConfig: FinalInstanceConfig = {
    instanceName: configCopy.instanceName,
    containerPort: configCopy.containerPort,
    hostName: configCopy.hostName ? configCopy.hostName : null,
    fullUrl,
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
    instanceDir,
    instanceEnvFilePath,
    instanceConfigFilePath,
    instanceComposeFile,
    commonDockerFilesDir,
    commonServicesComposeFilePath,
    instanceComposeFileTemplatePath,
    phpIniSettings: configCopy.phpIniSettings ? configCopy.phpIniSettings : null,
    configVariables,
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
