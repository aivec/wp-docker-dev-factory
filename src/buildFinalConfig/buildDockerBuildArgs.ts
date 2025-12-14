import { FinalInstanceConfig } from '../types';
import { statSync } from 'fs';

function isPath(path: string): boolean {
  try {
    const s = statSync(path);
    if (s.isDirectory() || s.isFile()) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export const buildDockerBuildArgs = function (config: FinalInstanceConfig): string {
  const args = [];
  for (const key in config.configVariables) {
    const variable = config.configVariables[key];
    if (variable.applicationTypes.includes('build')) {
      let value = variable.value;
      if (isPath(variable.value)) {
        value = variable.value.replace(`${config.topdir}/`, '');
      }
      args.push(`--build-arg ${key}=${value}`);
    }
  }
  return args.join(' ');
};
