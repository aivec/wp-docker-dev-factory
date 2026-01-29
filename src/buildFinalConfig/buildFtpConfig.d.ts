import { PrivateRemoteFilesConfig, FtpConfig } from '../types';
declare const buildFtpConfig: (ftp: PrivateRemoteFilesConfig[]) => FtpConfig[];
export default buildFtpConfig;
