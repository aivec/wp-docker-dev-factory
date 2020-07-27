import { InstanceConfig, EnvVars } from '../types';

const buildEnvVars = (config: InstanceConfig): EnvVars => {
  let envvars = {};
  envvars['DB_NAME'] = config.instanceName;
  envvars['DB_PREFIX'] = 'wp_';
  if (config.database) {
    const { dbName, dbPrefix } = config.database;
    if (dbName) {
      envvars['DB_NAME'] = dbName;
    }
    if (dbPrefix) {
      envvars['DB_PREFIX'] = dbPrefix;
    }
  }

  const env = config.env ? config.env : {};
  envvars = { ...envvars, ...env };
  return envvars;
};

export default buildEnvVars;
