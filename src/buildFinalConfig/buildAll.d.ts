import { type InstanceConfig, type FinalInstanceConfig } from 'src/types';
declare const buildFinalConfig: (config: InstanceConfig, workingdir: string, topdir: string) => Promise<FinalInstanceConfig>;
export default buildFinalConfig;
