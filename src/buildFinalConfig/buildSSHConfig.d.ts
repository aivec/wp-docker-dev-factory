import { PrivateRemoteFilesConfig, SSHConfig } from '../types';
declare const buildSSHConfig: (ssh: PrivateRemoteFilesConfig[], workingdir: string) => SSHConfig[];
export default buildSSHConfig;
