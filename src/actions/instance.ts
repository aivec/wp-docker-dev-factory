import { FinalInstanceConfig } from '../types';
import { platform } from 'os';
import { execSync } from 'child_process';
import makeContainers from './dbcontainers';
import logger from '../logger';

const runContainer = function (config: FinalInstanceConfig): void {
  makeContainers(config);

  const {
    phpVersion,
    flushOnRestart,
    networkname,
    containerName,
    containerPort,
    envvarsMap,
    envvars,
    volumes,
  } = config;

  if (flushOnRestart) {
    try {
      execSync(
        `docker exec -i aivec_wp_mysql mysql -uroot -proot -e 'DROP DATABASE IF EXISTS \`${envvarsMap.DB_NAME}\`;'`,
      );
    } catch (e) {
      console.log(e);
    }
  }

  let extras = '';
  const p = platform();
  if (p !== 'darwin' && p !== 'win32') {
    // map host.docker.internal to docker0 bridge IP for linux
    extras = '--add-host=host.docker.internal:host-gateway';
  }

  try {
    execSync(
      `docker run -d --name=${containerName} -p ${containerPort}:80 \
        --cap-add=SYS_ADMIN \
        --device=/dev/fuse \
        --security-opt apparmor=unconfined \
        ${extras} \
        ${volumes} \
        ${envvars} \
        --network=${networkname}_default \
        wordpress_devenv_visiblevc:latest-${phpVersion}`,
      { stdio: 'inherit' },
    );
  } catch (e) {
    console.log(e);
    logger.error('Something went wrong :(');
    process.exit(1);
  }

  try {
    execSync(`docker logs -f ${containerName}`, { stdio: 'inherit' });
  } catch (e) {
    logger.info(
      `${logger.YELLOW}${containerName}${logger.WHITE} is still running in the background. You can view the log stream anytime with ${logger.GREEN}Log WordPress Container`,
    );
  }
};

export default runContainer;
