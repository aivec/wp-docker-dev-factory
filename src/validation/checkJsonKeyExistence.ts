import logger from '../logger';
import { InstanceConfig } from '../types';

const jsonKeyExistsOrExit = (config: InstanceConfig, keyname: string): void => {
  if (!config[keyname]) {
    logger.error(
      `${logger.WHITE}${logger.YELLOW}${keyname}${logger.WHITE} is not defined in your config.`,
    );
    process.exit(1);
  }
};

export default jsonKeyExistsOrExit;
