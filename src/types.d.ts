export interface InstanceConfig {
  instanceName: string;
  containerPort?: number;
  hostName?: string;
  phpVersion?: string;
  wordpressVersion?: string;
  locale?: string;
  image?: string;
  uploads?: string;
  uploadsUrl?: string;
  customInitScripts?: string[];
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
  workingdir: string;
  topdir: string;
  phpIniSettings: { [key: string]: string | number | boolean };
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
  WORDPRESS_DB_NAME: string;
  WORDPRESS_DB_HOST: string;
  DB_PREFIX: string;
  DOCKER_BRIDGE_IP: string;
  DOCKER_CONTAINER_PORT: string;
  ALREADY_INSTALLED_PLUGINS: string;
  PLUGINS: string;
  THEMES?: string;
  APACHE_ENV_VARS?: string;
  FTP_CONFIGS?: string;
  SSH_CONFIGS?: string;
  [key: string]: string | number | boolean;
}

type ConfigVariableApplicationType = 'env' | 'build';
export interface ConfigVariable<T> {
  applicationTypes: ConfigVariableApplicationType[];
  value: T;
}
export interface ConfigVariables {
  DOCKER_CONTAINER_CONFIG_FOLDER: ConfigVariable<string>;
  DOCKER_CONTAINER_INSTANCE_CONFIG_FILEPATH: ConfigVariable<string>;
  DOCKER_CONTAINER_SCRIPTS_DIR: ConfigVariable<string>;
  DOCKER_CONTAINER_DB_DUMPFILE_PATH: ConfigVariable<string>;
  DOCKER_CONTAINER_STATUS: ConfigVariable<'fresh' | 'restart'>;
  INSTANCE_CONFIG_FILENAME: ConfigVariable<string>;
  HOST_INSTANCE_CONFIG_FILEPATH: ConfigVariable<string>;
}
export interface FinalInstanceConfig extends InstanceConfig {
  instanceDir: string;
  instanceComposeFile: string;
  instanceEnvFilePath: string;
  instanceConfigFilePath: string;
  instanceComposeFileTemplatePath: string;
  commonDockerFilesDir: string;
  commonServicesComposeFilePath: string;
  fullUrl: string;
  runningFromCache: boolean;
  snapshotImage: string;
  containerName: string;
  networkname: string;
  flushOnRestart: boolean;
  dockerBridgeIP: string;
  alreadyInstalled: string[];
  envvarsMap?: EnvVarsMap;
  volumes?: string[];
  envvars?: string;
  ftp?: FtpConfig[];
  ssh?: SSHConfig[];
  configVariables: ConfigVariables;
}
