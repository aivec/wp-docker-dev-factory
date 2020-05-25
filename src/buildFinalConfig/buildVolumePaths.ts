import path from 'path';
import { InstanceConfig } from '../types';
import { homedir } from 'os';

const buildVolumePaths = (config: InstanceConfig, workingdir: string, topdir: string): string[] => {
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

  if (config.database) {
    const { mysqlDumpfile } = config.database;
    if (mysqlDumpfile) {
      let p = mysqlDumpfile;
      if (path.isAbsolute(p)) {
        p = `${homedir()}${p}`;
      }
      const abspath = path.resolve(workingdir, p);
      volumes = [...volumes, `-v ${abspath}:/data/db.sql`];
    }
  }

  volumes = [...volumes, `-v ${path.resolve(topdir, 'initwp.sh')}:/docker-entrypoint-initwp.d/initwp.sh`];
  volumes = [...volumes, `-v ${path.resolve(topdir, 'redump.php')}:/app/redump.php`];
  volumes = [...volumes, `-v ${path.resolve(topdir, 'get_active_plugins.php')}:/app/get_active_plugins.php`];
  volumes = [...volumes, `-v ${path.resolve(workingdir, 'dumpfiles')}:/app/dumpfiles`];

  return volumes;
};

export default buildVolumePaths;
