import { execSync } from 'child_process';
import { FinalInstanceConfig } from '../types';

const makeContainers = ({ topdir, networkname, phpVersion }: FinalInstanceConfig): void => {
  execSync(
    `docker build -t wordpress_devenv_visiblevc:latest-${phpVersion} -f ${topdir}/docker/Dockerfile.php${phpVersion} ${topdir}`,
    {
      stdio: 'inherit',
    },
  );
  execSync(`docker-compose -p ${networkname} -f ${topdir}/docker/docker-compose.db.yml up -d`, {
    stdio: 'inherit',
  });
};

export default makeContainers;
