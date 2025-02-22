import logger from '../logger';
import { execSync } from 'child_process';
import { FinalInstanceConfig } from '../types';

const stopContainers = async (config: FinalInstanceConfig): Promise<void> => {
  logger.info(`${logger.WHITE}Stopping WordPress...${logger.NC}`);
  try {
    execSync(`docker stop ${config.containerName}`, { stdio: 'pipe' });
  } catch (error) {
    // doesnt matter if container isn't running....
  }
  try {
    execSync(`docker rm ${config.containerName}`, { stdio: 'pipe' });
  } catch (error) {
    console.log(error.stderr.toString());
  }
  logger.info(`${logger.WHITE}Stopping database...${logger.NC}`);
  try {
    const setenv = `export WORDPRESS_DB_NAME=${config.envvarsMap.WORDPRESS_DB_NAME} && export WORDPRESS_DB_HOST=${config.envvarsMap.WORDPRESS_DB_HOST} &&`;
    execSync(
      `${setenv} docker compose -p ${config.instanceName} -f ${config.topdir}/docker/docker-compose.db.yml down`,
      {
        stdio: 'pipe',
      },
    );
  } catch (error) {
    console.log(error.stderr.toString());
  }
};

export default stopContainers;
