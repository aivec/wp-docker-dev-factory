import logger from '../logger';
import { InstanceConfig } from '../types';

const isArrayOrExit = (config: InstanceConfig, keyname: string): void => {
  if (!Array.isArray(config[keyname])) {
    logger.error(
      `${logger.WHITE}${logger.YELLOW}${keyname}${logger.WHITE} is defined in your config but it is not an array.`,
    );
    process.exit(1);
  }
};

export default isArrayOrExit;
