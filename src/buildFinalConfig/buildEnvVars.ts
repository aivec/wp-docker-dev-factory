import { FinalInstanceConfig, EnvVarsMap } from '../types';
import {
  dockerMetaDirpath,
  dockerScriptsDirpath,
  dockerDumpfilesDirpath,
  dockerSshDirpath,
  dockerUserScriptsDirpath,
  dockerTempDirpath,
  dockerCacheDirpath,
} from '../constants';

const visibleVcBooleans = ['WP_DEBUG', 'WP_DEBUG_DISPLAY', 'WP_DEBUG_LOG', 'MULTISITE'];

const buildEnvVars = (config: FinalInstanceConfig): EnvVarsMap => {
  let envvars = {};
  const userenvs = config.env ? config.env : null;
  if (userenvs) {
    envvars = { ...envvars, ...userenvs };
  }

  // pass meta paths
  envvars['AVC_META_DIR'] = dockerMetaDirpath;
  envvars['AVC_SCRIPTS_DIR'] = dockerScriptsDirpath;
  envvars['AVC_DUMPFILES_DIR'] = dockerDumpfilesDirpath;
  envvars['AVC_SSH_DIR'] = dockerSshDirpath;
  envvars['AVC_USER_SCRIPTS_DIR'] = dockerUserScriptsDirpath;
  envvars['AVC_TEMP_DIR'] = dockerTempDirpath;
  envvars['AVC_CACHE_DIR'] = dockerCacheDirpath;

  envvars['CONTAINER_NAME'] = config.containerName;
  envvars['INSTANCE_NAME'] = config.instanceName;
  envvars['FLUSH_DB_ON_RESTART'] = Number(config.flushOnRestart);
  envvars['RUNNING_FROM_CACHE'] = Number(config.runningFromCache);
  envvars['URL_REPLACE'] = `http://localhost:${config.containerPort}`;
  envvars['DOCKER_BRIDGE_IP'] = config.dockerBridgeIP;
  envvars['DOCKER_CONTAINER_PORT'] = config.containerPort;
  envvars['ALREADY_INSTALLED_PLUGINS'] = JSON.stringify(
    JSON.stringify(config.alreadyInstalled),
  ).trim();
  const dplugins = [...config.downloadPlugins, 'relative-url'];
  envvars['DOWNLOAD_PLUGINS'] = JSON.stringify(JSON.stringify(dplugins)).trim();
  envvars['DOWNLOAD_THEMES'] = JSON.stringify(
    JSON.stringify(config.downloadThemes ? config.downloadThemes : []),
  ).trim();

  envvars['PLUGINS'] = `"${dplugins.join(' ')}"`;
  if (config.downloadThemes) {
    envvars['THEMES'] = `"${config.downloadThemes.join(' ')}"`;
  }
  if (config.ftp) {
    envvars['FTP_CONFIGS'] = JSON.stringify(JSON.stringify(config.ftp)).trim();
  }
  if (config.ssh) {
    envvars['SSH_CONFIGS'] = JSON.stringify(JSON.stringify(config.ssh)).trim();
  }

  // set default values for various WP envvars
  envvars['DB_NAME'] = config.instanceName;
  envvars['DB_PREFIX'] = 'wp_';
  envvars['DB_HOST'] = 'aivec_wp_mysql';
  envvars['DB_USER'] = 'root';
  envvars['DB_PASS'] = 'root';
  envvars['WP_DEBUG'] = 'true';
  envvars['WP_DEBUG_DISPLAY'] = 'true';
  envvars['WP_DEBUG_LOG'] = 'true';
  envvars['WP_LOCALE'] = config.locale;
  envvars['WP_VERSION'] = config.wordpressVersion;

  if (config.database) {
    const { dbName, dbPrefix } = config.database;
    if (dbName) {
      envvars['DB_NAME'] = dbName;
    }
    if (dbPrefix) {
      envvars['DB_PREFIX'] = dbPrefix;
    }
  }

  if (userenvs) {
    // override defaults if they are set in env object
    Object.keys(userenvs).forEach((key) => {
      if (visibleVcBooleans.includes(key)) {
        if (userenvs[key] === true || userenvs[key] === 1 || userenvs[key] === 'true') {
          envvars[key] = 'true';
        } else if (userenvs[key] === false || userenvs[key] === 0 || userenvs[key] === 'false') {
          envvars[key] = 'false';
        }
      }
    });
  }

  // used for accessing constants from PHP $_ENV global
  envvars['APACHE_ENV_VARS'] = JSON.stringify(JSON.stringify(envvars)).trim();

  return envvars as EnvVarsMap;
};

export default buildEnvVars;
