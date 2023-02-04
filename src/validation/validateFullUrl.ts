import { InstanceConfig } from '../types';
import { GenericError } from '../errors';
import logger from '../logger';

export const PORT_INVALID = 'PortInvalid';
export const HOST_INVALID = 'HostInvalid';
export const HOST_OR_PORT_REQUIRED = 'HostOrPortRequired';

const validateFullUrl = (config: InstanceConfig): void => {
  if (config.containerPort) {
    const port = Number(config.containerPort);
    if (port < 1023 || port > 65353) {
      const emsg = `Port number ${port} is out of range. Valid port range: 1023-65353`;
      logger.error(emsg);
      throw new GenericError(PORT_INVALID, emsg);
    }
  }

  if (config.hostName) {
    const host = String(config.hostName);
    const hpieces = host.split('.');
    if (hpieces[hpieces.length - 1] !== 'localhost') {
      const emsg = `Expected ${logger.yellow(
        'hostName',
      )} to be a sub-domain of localhost (eg. test.wp.localhost). Got ${host}`;
      logger.error(emsg);
      throw new GenericError(HOST_INVALID, emsg);
    }
  }

  if (!config.containerPort && !config.hostName) {
    const emsg = `At least one of ${logger.yellow('containerPort')} or ${logger.yellow(
      'hostName',
    )} is required.`;
    logger.error(emsg);
    throw new GenericError(HOST_OR_PORT_REQUIRED, emsg);
  }
};

export default validateFullUrl;
