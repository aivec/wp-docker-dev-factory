import path from 'path';
import { InstanceConfig } from '../types';
import { homedir } from 'os';

const buildPluginAutoInstallWhitelist = (config: InstanceConfig, workingdir: string): string[] => {
  let alreadyInstalled = [...config.downloadPlugins];
  if (config.localPlugins) {
    config.localPlugins.forEach((p) => {
      if (path.isAbsolute(p)) {
        p = `${homedir()}${p}`;
      }
      const folder = path.basename(path.resolve(workingdir, p));
      alreadyInstalled = [...alreadyInstalled, folder];
    });
  }

  return alreadyInstalled;
};

export default buildPluginAutoInstallWhitelist;
