import { homedir } from 'os';

export const serverConfigsDirname = 'aivec-devenv-configs';
export const serverConfigsDirpath = `${homedir()}/${serverConfigsDirname}`;
export const sshConfigsFilename = 'ssh.json';
export const sshConfigsFilepath = `${serverConfigsDirpath}/${sshConfigsFilename}`;
export const ftpConfigsFilename = 'ftp.json';
export const ftpConfigsFilepath = `${serverConfigsDirpath}/${ftpConfigsFilename}`;
export const instanceConfFilename = 'wp-instances.json';
