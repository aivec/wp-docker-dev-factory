import logger from '../logger';
import { execSync } from 'child_process';
import { FinalInstanceConfig } from '../types';
import fs from 'fs';

const stopContainers = async (config: FinalInstanceConfig): Promise<void> => {
  logger.info(`${logger.WHITE}Stopping WordPress...${logger.NC}`);
  try {
    execSync(`docker stop ${config.containerName}`, { stdio: 'pipe' });
  } catch (error) {
    // doesnt matter if container isn't running....
  }
  /* try {
    execSync(`docker rm ${config.containerName}`, { stdio: 'pipe' });
  } catch (error) {
    console.log(error.stderr.toString());
  } */
  logger.info(`${logger.WHITE}Stopping database...${logger.NC}`);
  try {
    // Convert object to .env format
    const envContent = Object.entries(config.envvarsMap)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Write to .env file
    fs.writeFileSync(`${config.topdir}/tmp/.env`, envContent);
    execSync(
      `. ${config.topdir}/tmp/.env && docker compose -p ${config.instanceName} -f ${config.topdir}/docker/docker-compose.db.yml down`,
      {
        stdio: 'pipe',
      },
    );
  } catch (error) {
    console.log(error.stderr.toString());
  }
};

export default stopContainers;
