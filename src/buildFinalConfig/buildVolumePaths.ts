import path from 'path';
import { InstanceConfig } from '../types';

const buildVolumePaths = (config: InstanceConfig, workingdir: string): string[] => {
  let volumes = [];

  const localPathKeys = ['localPlugins', 'localThemes'];
  localPathKeys.forEach((key) => {
    if (config[key]) {
      config[key].forEach((p) => {
        if (path.isAbsolute(p)) {
          p = `${process.env.HOME}${p}`;
        }
        const abspath = path.resolve(workingdir, p);
        const folder = path.basename(abspath);
        volumes = [...volumes, `-v ${abspath}:/app/wp-content/plugins/${folder}`];
      });
    }
  });

  if (config.database) {
    const { mysqlDumpfile } = config.database;
    if (mysqlDumpfile) {
      let p = mysqlDumpfile;
      if (path.isAbsolute(p)) {
        p = `${process.env.HOME}${p}`;
      }
      const abspath = path.resolve(workingdir, p);
      volumes = [...volumes, `-v ${abspath}:/data/db.sql`];
    }
  }

  return volumes;
};

export default buildVolumePaths;
