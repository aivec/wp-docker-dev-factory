export interface InstanceConfig {
  instanceName: string;
  containerPort: number;
  phpVersion?: string;
  wordpressVersion?: string;
  locale?: string;
  database?: {
    mysqlDumpfile?: string;
    flushOnRestart?: boolean;
    dbName?: string;
    dbPrefix: string;
  };
  env?: {
    [key: string]: string | number | boolean;
  };
  downloadPlugins?: string[];
  downloadThemes?: string[];
  localPlugins?: string[];
  localThemes?: string[];
  ftp?: PrivateRemoteFilesConfig[];
  ssh?: PrivateRemoteFilesConfig[];
}

export interface PrivateRemoteFilesConfig {
  confname: string;
  confpath?: string;
  plugins?: string[];
  themes?: string[];
}

export interface SSHMeta {
  host: string;
  user: string;
  privateKeyPath: string;
  privateKeyFilename: string;
  port?: number;
}

export interface SSHConfig extends PrivateRemoteFilesConfig, SSHMeta {}

export interface FtpMeta {
  host: string;
  user: string;
  password?: string;
}

export interface FtpConfig extends PrivateRemoteFilesConfig, FtpMeta {}
export interface EnvVarsMap {
  DB_NAME: string;
  DB_PREFIX: string;
  DOCKER_BRIDGE_IP: string;
  DOCKER_CONTAINER_PORT: string;
  ALREADY_INSTALLED_PLUGINS: string;
  PLUGINS: string;
  THEMES?: string;
  APACHE_ENV_VARS?: string;
  FTP_CONFIGS?: string;
  SSH_CONFIGS?: string;
}

export interface FinalInstanceConfig extends InstanceConfig {
  containerName: string;
  topdir: string;
  workingdir: string;
  networkname: string;
  flushOnRestart: boolean;
  dockerBridgeIP: string;
  alreadyInstalled: string[];
  envvarsMap?: EnvVarsMap;
  volumes?: string;
  envvars?: string;
  ftp?: FtpConfig[];
  ssh?: SSHConfig[];
}
