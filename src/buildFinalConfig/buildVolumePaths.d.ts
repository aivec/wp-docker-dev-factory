import { FinalInstanceConfig, InstanceConfig } from '../types';
declare const buildVolumePaths: (config: FinalInstanceConfig, rawconfig: InstanceConfig, workingdir: string, topdir: string) => string[];
export default buildVolumePaths;
