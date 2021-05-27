import { homedir } from 'os';

export const dockerMetaDirpath = '/avc-wpdocker-meta';
export const dockerScriptsDirpath = `${dockerMetaDirpath}/scripts`;
export const dockerDumpfilesDirpath = `${dockerMetaDirpath}/dumpfiles`;
export const dockerSshDirpath = `${dockerMetaDirpath}/ssh`;
export const dockerUserScriptsDirpath = `${dockerMetaDirpath}/user-scripts`;
export const dockerTempDirpath = `${dockerMetaDirpath}/temp`;
export const dockerCacheDirpath = `${dockerMetaDirpath}/cache`;
export const serverConfigsDirname = 'aivec-devenv-configs';
export const serverConfigsDirpath = `${homedir()}/${serverConfigsDirname}`;
export const sshConfigsFilename = 'ssh.json';
export const sshConfigsFilepath = `${serverConfigsDirpath}/${sshConfigsFilename}`;
export const ftpConfigsFilename = 'ftp.json';
export const ftpConfigsFilepath = `${serverConfigsDirpath}/${ftpConfigsFilename}`;
export const instanceConfFilename = 'wp-instances.json';
export const validPhpVersions = ['7.2', '7.3', '7.4', '8.0'];
