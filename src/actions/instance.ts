import { FinalInstanceConfig } from '../types';
import { platform } from 'os';
import { execSync } from 'child_process';
import makeContainers from './dbcontainers';
import logger from '../logger';

const runContainer = function (config: FinalInstanceConfig): void {
  logger.info(`${logger.WHITE}Starting Container(s)...${logger.NC}`);
  makeContainers(config);

  const {
    phpVersion,
    flushOnRestart,
    networkname,
    containerName,
    runningFromCache,
    snapshotImage,
    containerPort,
    envvarsMap,
    envvars,
    volumes,
  } = config;

  let extras = '';
  const p = platform();
  if (p !== 'darwin' && p !== 'win32') {
    // map host.docker.internal to docker0 bridge IP for linux
    extras = '--add-host=host.docker.internal:host-gateway';
  }

  let image = `wordpress_devenv_visiblevc:latest-${phpVersion}`;
  if (runningFromCache) {
    image = snapshotImage;
  } else {
    if (flushOnRestart) {
      try {
        execSync(
          `docker exec -i aivec_wp_mysql mysql -uroot -proot -e 'DROP DATABASE IF EXISTS \`${envvarsMap.DB_NAME}\`;'`,
        );
      } catch (e) {
        console.log(e);
      }
    }
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
        ${image}`,
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
      `${logger.yellow(
        containerName,
      )} is still running in the background. You can view the log stream anytime with ${logger.green(
        'Show server logs',
      )}`,
    );
  }
};

export default runContainer;
