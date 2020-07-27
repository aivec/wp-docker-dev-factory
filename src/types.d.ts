export interface InstanceConfig {
  instanceName: string;
  containerPort: number;
  locale?: string;
  database?: {
    mysqlDumpfile?: string;
    dbName?: string;
    dbPrefix: string;
  };
  env?: {
    [key: string]: string | number | boolean
  },
  downloadPlugins?: string[];
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

export interface EnvVars {
  DB_NAME?: string;
  DB_PREFIX?: string;
}

export interface FinalInstanceConfig extends InstanceConfig {
  containerName: string;
  topdir: string;
  workingdir: string;
  networkname: string;
  dockerBridgeIP: string;
  volumes: string[];
  alreadyInstalled: string[];
  envvars: EnvVars;
  ftp?: FtpConfig[];
  ssh?: SSHConfig[];
}
