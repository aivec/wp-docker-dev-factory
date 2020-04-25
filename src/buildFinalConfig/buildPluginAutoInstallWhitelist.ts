import path from 'path';
import { InstanceConfig } from '../types';

const buildPluginAutoInstallWhitelist = (config: InstanceConfig, workingdir: string): string[] => {
  let alreadyInstalled = [...config.downloadPlugins];
  if (config.localPlugins) {
    config.localPlugins.forEach((p) => {
      if (path.isAbsolute(p)) {
        p = `${process.env.HOME}${p}`;
      }
      const folder = path.basename(path.resolve(workingdir, p));
      alreadyInstalled = [...alreadyInstalled, folder];
    });
  }

  return alreadyInstalled;
};

export default buildPluginAutoInstallWhitelist;
