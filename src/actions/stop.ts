import logger from '../logger';
import { execSync } from 'child_process';
import { FinalInstanceConfig } from '../types';

const stopContainers = async (config: FinalInstanceConfig): Promise<void> => {
  logger.info(`${logger.WHITE}Stopping Environment...${logger.NC}`);
  try {
    execSync(`docker compose -f ${config.instanceComposeFile} stop`, { stdio: 'inherit' });
  } catch (error) {
    console.log(error.stderr.toString());
  }
};

export default stopContainers;
