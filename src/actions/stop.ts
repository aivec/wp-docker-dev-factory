import logger from '../logger';
import { execSync } from 'child_process';
import { FinalInstanceConfig } from '../types';

const stopContainers = (config: FinalInstanceConfig): void => {
  logger.info(`${logger.WHITE}Stopping Container(s)...${logger.NC}`);
  execSync(`docker stop ${config.containerName}`, { stdio: 'inherit' });
  execSync(`docker rm ${config.containerName}`, { stdio: 'inherit' });
};

export default stopContainers;
