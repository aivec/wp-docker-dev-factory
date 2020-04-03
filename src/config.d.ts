export interface InstanceConfig {
  instanceName: string;
  containerPort: number;
  locale?: string;
  database?: {
    mysqlDumpfile?: string;
    dbName?: string;
    dbPrefix: string;
  };
  downloadPlugins?: string[];
  localPlugins?: string[];
  localThemes?: string[];
  ftp?: FtpConfig[];
  [extras: string]: any;
}

export interface FtpConfig {
  confname: string;
  confpath?: string;
  plugins?: string[];
  themes?: string[];
}

export interface FtpMeta {
  host: string;
  user: string;
  password?: string;
}

export interface FinalFtpConfig extends FtpConfig {
  meta?: FtpMeta;
} 

export interface TransformedInstanceConfig {
  containerName: string;
  topdir: string;
  workingdir: string;
  networkname: string;
  dockerBridgeIP: string;
  volumes: string[];
  alreadyInstalled: string[];
  envvars: EnvVars;
}

export interface EnvVars {
  DB_NAME?: string;
  DB_PREFIX?: string;
}

export interface FinalInstanceConfig extends InstanceConfig, TransformedInstanceConfig {
  ftp?: FinalFtpConfig[];
}
