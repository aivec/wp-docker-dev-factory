import path from 'path';
import _ from 'lodash';
import { FinalInstanceConfig, InstanceConfig } from '../types';
import { homedir } from 'os';

const buildVolumePaths = (
  config: FinalInstanceConfig,
  rawconfig: InstanceConfig,
  workingdir: string,
  topdir: string,
): string => {
  let volumes = [];

  const localPathKeys = [
    { key: 'localPlugins', wpfolder: 'plugins' },
    { key: 'localThemes', wpfolder: 'themes' },
  ];
  localPathKeys.forEach(({ key, wpfolder }) => {
    if (config[key]) {
      config[key].forEach((p) => {
        if (path.isAbsolute(p)) {
          p = `${homedir()}${p}`;
        }
        const abspath = path.resolve(workingdir, p);
        const folder = path.basename(abspath);
        volumes = [...volumes, `-v ${abspath}:/app/wp-content/${wpfolder}/${folder}`];
      });
    }
  });

  if (rawconfig.database) {
    const { mysqlDumpfile } = rawconfig.database;
    if (mysqlDumpfile) {
      let p = mysqlDumpfile;
      if (path.isAbsolute(p)) {
        p = `${homedir()}${p}`;
      }
      const abspath = path.resolve(workingdir, p);
      volumes = [...volumes, `-v ${abspath}:/data/db.sql`];
    }
  }

  if (config.ssh) {
    const sshCopy = _.cloneDeep(config.ssh);
    const keyPathVolumes = sshCopy.map(({ privateKeyPath, privateKeyFilename }, index: number) => {
      // remove since Windows paths break JSON
      delete config.ssh[index].privateKeyPath;
      return `-v ${privateKeyPath}:/app/ssh/${privateKeyFilename}`;
    });

    volumes = [...volumes, ...keyPathVolumes];
  }

  volumes = [
    ...volumes,
    `-v ${path.resolve(topdir, 'initwp.sh')}:/docker-entrypoint-initwp.d/initwp.sh`,
  ];
  volumes = [...volumes, `-v ${path.resolve(topdir, 'redump.php')}:/app/redump.php`];
  volumes = [
    ...volumes,
    `-v ${path.resolve(topdir, 'get_active_plugins.php')}:/app/get_active_plugins.php`,
  ];
  volumes = [...volumes, `-v ${path.resolve(workingdir, 'dumpfiles')}:/app/dumpfiles`];

  if (process.platform === 'win32' && process.env.DOCKER_TOOLBOX_INSTALL_PATH) {
    volumes = volumes.map((vpath) => vpath.replace(/C:\\/gi, '/c/'));
    volumes = volumes.map((vpath) => vpath.replace(/\\/gi, '/'));
    volumes = volumes.map((vpath) => vpath.replace(/:\//gi, '://'));
  }

  return volumes.join(' ');
};

export default buildVolumePaths;
