import logger from '../logger';
import { InstanceConfig } from '../types';
import { ERR_PROPERTY_REQUIRED, GenericError } from '../errors';

const jsonKeySetCheck = (config: InstanceConfig, keyname: string): void => {
  if (!config[keyname]) {
    logger.error(
      `${logger.WHITE}${logger.YELLOW}${keyname}${logger.WHITE} is not defined in your config.`,
    );
    throw new GenericError(ERR_PROPERTY_REQUIRED, `${keyname} is required`);
  }
};

export default jsonKeySetCheck;
