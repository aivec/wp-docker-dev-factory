import logger from '../logger';
import { validPhpVersions } from '../constants';

const validatePhpVersion = (version: string): void => {
  if (!validPhpVersions.includes(version)) {
    logger.error(
      `${logger.WHITE}Invalid PHP version. Possible versions: ${
        logger.YELLOW
      }${validPhpVersions.join(', ')}${logger.WHITE}`,
    );
    process.exit(1);
  }
};

export default validatePhpVersion;
