import path from 'path';
import { homedir } from 'os';
import getPort, { portNumbers } from 'get-port';
import buildFtpConfig from './buildFtpConfig';
import buildEnvVars from './buildEnvVars';
import buildVolumePaths from './buildVolumePaths';
import buildPluginAutoInstallWhitelist from './buildPluginAutoInstallWhitelist';
import { cloneDeep } from 'lodash-es';
import { type InstanceConfig, type FinalInstanceConfig, type ConfigVariables } from 'src/types';
import buildSSHConfig from './buildSSHConfig';
import { containerStatus } from 'src/docker/container';
import {
  dockerMetaDirpath,
  dockerScriptsDirpath,
  INSTANCE_CONFIG_FILENAME,
  DOCKER_CONTAINER_INSTANCE_CONFIG_FILEPATH,
  DOCKER_CONTAINER_DB_DUMPFILE_PATH,
} from 'src/constants';
import { getPortsInUse } from 'src/docker/utils';

const buildFinalConfig = async (
  config: InstanceConfig,
  workingdir: string,
  topdir: string,
): Promise<FinalInstanceConfig> => {
  const configCopy: InstanceConfig = cloneDeep(config);
  const phpVersion = configCopy.phpVersion ? configCopy.phpVersion : '7.3';
  const snapshotImage = `${configCopy.instanceName}-${phpVersion}`;
  const dockerBridgeIP = 'host.docker.internal';
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

  let portsInUse = getPortsInUse();
  if (config.containerPort) {
    fullUrl = `${fullUrl}:${config.containerPort}`;
    portsInUse = [...portsInUse, config.containerPort];
  }
  let dbHostPort = null;
  while (dbHostPort === null || portsInUse.includes(dbHostPort)) {
    dbHostPort = await getPort({ port: portNumbers(3000, 5000) });
  }

  const instanceDir = `${config.workingdir}/instances/${configCopy.instanceName}`;
  const instanceEnvFilePath = `${instanceDir}/.env`;
  const instanceComposeFile = `${instanceDir}/docker-compose.wp.yml`;
  const instanceConfigFilePath = `${config.topdir}/tmp/${INSTANCE_CONFIG_FILENAME}`;
  const commonDockerFilesDir = `${topdir}/docker`;
  const commonServicesComposeFilePath = `${commonDockerFilesDir}/docker-compose.common.yml`;
  const instanceComposeFileTemplatePath = `${commonDockerFilesDir}/docker-compose.template.yml`;
  const wordpressDbContainerName = `${configCopy.instanceName}-db`;

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
    DOCKER_DB_CONTAINER_STATUS: {
      applicationTypes: [],
      value: containerStatus(wordpressDbContainerName) === null ? 'fresh' : 'restart',
    },
    WORDPRESS_APP_HOST_NAME: {
      applicationTypes: [],
      value: configCopy.hostName,
    },
    WORDPRESS_APP_SERVICE_NAME: {
      applicationTypes: [],
      value: configCopy.instanceName,
    },
    WORDPRESS_APP_CONTAINER_NAME: {
      applicationTypes: [],
      value: configCopy.instanceName,
    },
    WORDPRESS_DB_SERVICE_NAME: {
      applicationTypes: [],
      value: wordpressDbContainerName,
    },
    WORDPRESS_DB_CONTAINER_NAME: {
      applicationTypes: [],
      value: wordpressDbContainerName,
    },
    WORDPRESS_VERSION: {
      applicationTypes: ['build'],
      value: configCopy.wordpress?.version,
    },
    WORDPRESS_TITLE: {
      applicationTypes: [],
      value: configCopy.wordpress?.title ? configCopy.wordpress.title : configCopy.instanceName,
    },
    WORDPRESS_ADMIN_USER: {
      applicationTypes: [],
      value: configCopy.wordpress?.adminUser ? configCopy.wordpress.adminUser : 'admin',
    },
    WORDPRESS_ADMIN_PASSWORD: {
      applicationTypes: [],
      value: configCopy.wordpress?.adminPassword ? configCopy.wordpress.adminPassword : 'admin',
    },
    WORDPRESS_ADMIN_EMAIL: {
      applicationTypes: [],
      value: configCopy.wordpress?.adminEmail
        ? configCopy.wordpress.adminEmail
        : `admin@${configCopy.instanceName}.localhost`,
    },
    INSTANCE_CONFIG_FILENAME: {
      applicationTypes: [],
      value: INSTANCE_CONFIG_FILENAME,
    },
    HOST_INSTANCE_CONFIG_FILEPATH: {
      applicationTypes: ['build'],
      value: instanceConfigFilePath,
    },
    SITE_URL: {
      applicationTypes: [],
      value: fullUrl,
    },
    DB_PORT: {
      applicationTypes: ['env'],
      value: dbHostPort,
    },
    ...(configCopy.containerPort
      ? { APP_PORT: { applicationTypes: ['env'], value: configCopy.containerPort } }
      : {}),
  };

  const finalConfig: FinalInstanceConfig = {
    instanceName: configCopy.instanceName,
    containerPort: configCopy.containerPort,
    hostName: configCopy.hostName ?? configCopy.hostName,
    fullUrl,
    phpVersion,
    wordpressVersion: configCopy.wordpressVersion ? configCopy.wordpressVersion : 'latest',
    wordpress: {
      title: configVariables.WORDPRESS_TITLE.value,
      adminUser: configVariables.WORDPRESS_ADMIN_USER.value,
      adminPassword: configVariables.WORDPRESS_ADMIN_PASSWORD.value,
      adminEmail: configVariables.WORDPRESS_ADMIN_EMAIL.value,
      locale: configCopy.wordpress?.locale ? configCopy.wordpress.locale : 'en_US',
    },
    flushOnRestart,
    database: configCopy.database,
    env: configCopy.env ?? configCopy.env,
    localPlugins: configCopy.localPlugins ? configCopy.localPlugins : [],
    localThemes: configCopy.localThemes ? configCopy.localThemes : [],
    downloadPlugins: configCopy.downloadPlugins ? configCopy.downloadPlugins : [],
    downloadThemes: configCopy.downloadThemes ? configCopy.downloadThemes : [],
    uploads: configCopy.uploads ?? configCopy.uploads,
    uploadsUrl: configCopy.uploadsUrl ?? configCopy.uploadsUrl,
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
    phpIniSettings: configCopy.phpIniSettings ?? configCopy.phpIniSettings,
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
