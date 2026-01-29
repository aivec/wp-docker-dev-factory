import { execSync } from 'child_process';
import { FinalInstanceConfig } from '../types';

const makeContainers = ({
  topdir,
  phpVersion,
  commonDockerFilesDir,
}: FinalInstanceConfig): void => {
  execSync(
    `docker build -t wordpress_devenv_visiblevc:latest-${phpVersion} -f ${commonDockerFilesDir}/Dockerfile.php${phpVersion} ${topdir}`,
    {
      stdio: 'inherit',
    },
  );
};

export default makeContainers;
