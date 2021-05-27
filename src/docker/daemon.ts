import { execp } from '../utils';
import logger from '../logger';

export const canUseDockerOrExit = async (): Promise<void> => {
  try {
    await execp('docker info');
  } catch (error) {
    // command succeeded but the daemon isn't running
    if (error.stdout) {
      console.log(error.stdout.toString());
      process.exit(1);
    }

    // command failed. Docker isn't installed or is not in PATH
    logger.error(error.stderr.toString());
    console.log('Please be sure that Docker is installed and exists in PATH');
    process.exit(1);
  }
};
