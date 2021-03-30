import { FinalInstanceConfig, EnvVarsMap } from '../types';

const visibleVcBooleans = ['WP_DEBUG', 'WP_DEBUG_DISPLAY', 'WP_DEBUG_LOG', 'MULTISITE'];

const buildEnvVars = (config: FinalInstanceConfig): EnvVarsMap => {
  let envvars = {};
  const userenvs = config.env ? config.env : null;
  if (userenvs) {
    envvars = { ...envvars, ...userenvs };
  }

  envvars['DB_HOST'] = 'aivec_wp_mysql';
  envvars['DB_USER'] = 'root';
  envvars['DB_PASS'] = 'root';
  envvars['INSTANCE_NAME'] = config.instanceName;
  envvars['WP_LOCALE'] = config.locale;
  envvars['WP_VERSION'] = config.wordpressVersion;
  envvars['URL_REPLACE'] = `http://localhost:${config.containerPort}`;
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

  // set default values for various WP envvars
  envvars['DB_NAME'] = config.instanceName;
  envvars['DB_PREFIX'] = 'wp_';
  envvars['WP_DEBUG'] = 'true';
  envvars['WP_DEBUG_DISPLAY'] = 'true';
  envvars['WP_DEBUG_LOG'] = 'true';

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
