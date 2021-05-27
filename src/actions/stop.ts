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
};

export default stopContainers;
