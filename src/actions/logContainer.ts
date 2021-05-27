import { FinalInstanceConfig } from '../types';
import { execSync } from 'child_process';

const logContainer = (config: FinalInstanceConfig): void => {
  try {
    execSync(`docker logs -f ${config.containerName}`, { stdio: 'inherit' });
  } catch (e) {
    console.log('\nBye.');
  }
};

export default logContainer;
