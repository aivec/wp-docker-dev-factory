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
): string => {
  let volumes = [];

  const localPathKeys = [
    { key: 'localPlugins', wpfolder: 'plugins' },
    { key: 'localThemes', wpfolder: 'themes' },
  ];
  localPathKeys.forEach(({ key, wpfolder }) => {
    if (config[key]) {
      config[key].forEach((p) => {
        const abspath = resolvePathToAbsolute(workingdir, p);
        const folder = path.basename(abspath);
        volumes = [...volumes, `-v ${abspath}:/app/wp-content/${wpfolder}/${folder}`];
      });
    }
  });

  if (rawconfig.uploads) {
    volumes = [
      ...volumes,
      `-v ${resolvePathToAbsolute(workingdir, rawconfig.uploads)}:/app/wp-content/uploads`,
    ];
  }

  if (rawconfig.customInitScripts) {
    rawconfig.customInitScripts.forEach((p) => {
      const abspath = resolvePathToAbsolute(workingdir, p);
      const script = path.basename(abspath);
      volumes = [...volumes, `-v ${abspath}:${dockerUserScriptsDirpath}/${script}`];
    });
  }

  if (rawconfig.database) {
    const { mysqlDumpfile } = rawconfig.database;
    if (mysqlDumpfile) {
      const abspath = resolvePathToAbsolute(workingdir, mysqlDumpfile);
      // visiblevc's run.sh script will import db.sql automatically on startup
      volumes = [...volumes, `-v ${abspath}:/data/db.sql`];
    }
  }

  if (config.ssh) {
    const sshCopy = _.cloneDeep(config.ssh);
    const keyPathVolumes = sshCopy.map(({ privateKeyPath, privateKeyFilename }, index: number) => {
      // remove since Windows paths break JSON
      delete config.ssh[index].privateKeyPath;
      return `-v ${privateKeyPath}:${dockerSshDirpath}/${privateKeyFilename}`;
    });

    volumes = [...volumes, ...keyPathVolumes];
  }

  volumes = [
    ...volumes,
    // mounting a script here tells the visiblevc run.sh script to run it before starting apache
    `-v ${path.resolve(topdir, `src/scripts/initwp.sh`)}:/docker-entrypoint-initwp.d/initwp.sh`,
  ];

  volumes = [...volumes, `-v ${path.resolve(workingdir, 'dumpfiles')}:${dockerDumpfilesDirpath}`];

  if (process.platform === 'win32' && process.env.DOCKER_TOOLBOX_INSTALL_PATH) {
    volumes = volumes.map((vpath) => vpath.replace(/C:\\/gi, '/c/'));
    volumes = volumes.map((vpath) => vpath.replace(/\\/gi, '/'));
    volumes = volumes.map((vpath) => vpath.replace(/:\//gi, '://'));
  }

  return volumes.join(' ');
};

export default buildVolumePaths;
