import { execSync } from 'child_process';
import { FinalInstanceConfig } from '../types';

const makeContainers = ({
  topdir,
  networkname,
  phpVersion,
  hostName,
}: FinalInstanceConfig): void => {
  execSync(
    `docker build -t wordpress_devenv_visiblevc:latest-${phpVersion} -f ${topdir}/docker/Dockerfile.php${phpVersion} ${topdir}`,
    {
      stdio: 'inherit',
    },
  );
  let services = ['db', 'phpmyadmin', 'mailhog'];
  if (hostName) {
    services = [...services, 'reverse-proxy'];
  }
  execSync(
    `docker compose -p ${networkname} -f ${topdir}/docker/docker-compose.db.yml up -d ${services.join(
      ' ',
    )}`,
    {
      stdio: 'inherit',
    },
  );
};

export default makeContainers;
