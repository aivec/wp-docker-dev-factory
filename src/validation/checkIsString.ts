import logger from '../logger';
import { InstanceConfig } from '../types';
import { isString } from '../utils';

const isStringOrExit = (config: InstanceConfig, keyname: string): void => {
  if (!isString(config[keyname])) {
    logger.error(
      `${logger.WHITE}${logger.YELLOW}${keyname}${logger.WHITE} is defined in your config but it is not a string.`,
    );
    process.exit(1);
  }
};

export default isStringOrExit;
