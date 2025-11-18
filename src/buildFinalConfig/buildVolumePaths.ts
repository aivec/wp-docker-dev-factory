import path from 'path';
import _ from 'lodash';
import { resolvePathToAbsolute } from '../utils';
import { FinalInstanceConfig, InstanceConfig } from '../types';
import { dockerDumpfilesDirpath, dockerSshDirpath, dockerUserScriptsDirpath } from '../constants';

const buildVolumePaths = (
  config: FinalInstanceConfig,
  rawconfig: InstanceConfig,
  workingdir: string,
  topdir: string,
): string[] => {
  const volumes: string[] = [];

  const localPathKeys = [
    { key: 'localPlugins', wpfolder: 'plugins' },
    { key: 'localThemes', wpfolder: 'themes' },
  ];
  localPathKeys.forEach(({ key, wpfolder }) => {
    if (config[key]) {
      config[key].forEach((p) => {
        const abspath = resolvePathToAbsolute(workingdir, p);
        const folder = path.basename(abspath);
        volumes.push(`${abspath}:/var/www/html/wp-content/${wpfolder}/${folder}`);
      });
    }
  });

  if (rawconfig.uploads) {
    volumes.push(
      `${resolvePathToAbsolute(workingdir, rawconfig.uploads)}:/var/www/html/wp-content/uploads`,
    );
  }

  if (rawconfig.customInitScripts) {
    rawconfig.customInitScripts.forEach((p) => {
      const abspath = resolvePathToAbsolute(workingdir, p);
      const script = path.basename(abspath);
      volumes.push(`${abspath}:${dockerUserScriptsDirpath}/${script}`);
    });
  }

  if (rawconfig.database) {
    const { mysqlDumpfile } = rawconfig.database;
    if (mysqlDumpfile) {
      const abspath = resolvePathToAbsolute(workingdir, mysqlDumpfile);
      // visiblevc's run.sh script will import db.sql automatically on startup
      volumes.push(`${abspath}:/data/db.sql`);
    }
  }

  if (config.ssh) {
    const sshCopy = _.cloneDeep(config.ssh);
    const keyPathVolumes = sshCopy.map(({ privateKeyPath, privateKeyFilename }, index: number) => {
      // remove since Windows paths break JSON
      delete config.ssh[index].privateKeyPath;
      return `${privateKeyPath}:${dockerSshDirpath}/${privateKeyFilename}`;
    });

    volumes.push(...keyPathVolumes);
  }

  /* volumes = [
    ...volumes,
    // mounting a script here tells the visiblevc run.sh script to run it before starting apache
    `-v ${path.resolve(topdir, `src/scripts/initwp.sh`)}:/docker-entrypoint-initwp.d/run.sh`,
  ]; */

  volumes.push(`${path.resolve(workingdir, 'dumpfiles')}:${dockerDumpfilesDirpath}`);

  if (process.platform === 'win32' && process.env.DOCKER_TOOLBOX_INSTALL_PATH) {
    const normalizeHost = (binding: string): string => {
      const delimiter = binding.lastIndexOf(':');
      if (delimiter === -1) {
        return binding.replace(/C:\\/gi, '/c/').replace(/\\/gi, '/');
      }
      let hostPart = binding.slice(0, delimiter);
      const containerPart = binding.slice(delimiter + 1);
      hostPart = hostPart.replace(/C:\\/gi, '/c/');
      hostPart = hostPart.replace(/\\/gi, '/');
      return `${hostPart}:${containerPart}`;
    };
    volumes.forEach((binding, index) => {
      volumes[index] = normalizeHost(binding);
    });
  }

  return volumes;
};

export default buildVolumePaths;
