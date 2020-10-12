import { FinalInstanceConfig, EnvVarsMap } from '../types';

const buildEnvVars = (config: FinalInstanceConfig): EnvVarsMap => {
  let envvars = {};
  envvars['DB_NAME'] = config.instanceName;
  envvars['DB_PREFIX'] = 'wp_';
  envvars['DOCKER_BRIDGE_IP'] = config.dockerBridgeIP;
  envvars['DOCKER_CONTAINER_PORT'] = config.containerPort;
  envvars['ALREADY_INSTALLED_PLUGINS'] = JSON.stringify(
    JSON.stringify(config.alreadyInstalled),
  ).trim();
  envvars['PLUGINS'] = `"${[...config.downloadPlugins, 'relative-url'].join(' ')}"`;
  if (config.downloadThemes) {
    envvars['THEMES'] = `"${config.downloadThemes.join(' ')}"`;
  }
  if (config.ftp) {
    envvars['FTP_CONFIGS'] = JSON.stringify(JSON.stringify(config.ftp)).trim();
  }
  if (config.ssh) {
    envvars['SSH_CONFIGS'] = JSON.stringify(JSON.stringify(config.ssh)).trim();
  }
  if (config.database) {
    const { dbName, dbPrefix } = config.database;
    if (dbName) {
      envvars['DB_NAME'] = dbName;
    }
    if (dbPrefix) {
      envvars['DB_PREFIX'] = dbPrefix;
    }
  }

  if (config.env) {
    envvars['APACHE_ENV_VARS'] = JSON.stringify(
      JSON.stringify({ ...config.env, ...envvars }),
    ).trim();
  }

  const env = config.env ? config.env : {};
  envvars = { ...envvars, ...env };

  return envvars as EnvVarsMap;
};

export default buildEnvVars;
