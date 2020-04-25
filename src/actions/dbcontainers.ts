import logger from '../logger';
import { execSync } from 'child_process';
import { FinalInstanceConfig } from '../types';

const makeContainers = ({ topdir, networkname }: FinalInstanceConfig): void => {
  logger.info(`${logger.WHITE}Running Container(s)...${logger.NC}`);
  execSync(`docker build -t wordpress_devenv_visiblevc:latest ${topdir}`, {
    stdio: 'inherit',
  });
  execSync(`docker-compose -p ${networkname} -f ${topdir}/docker-compose.db.yml up -d`, {
    stdio: 'inherit',
  });
};

export default makeContainers;
