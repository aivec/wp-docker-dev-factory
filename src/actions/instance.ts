import { FinalInstanceConfig } from '../types';
import { platform } from 'os';
import { execSync } from 'child_process';
import makeContainers from './dbcontainers';
import { load } from '../docker/load';
import logger from '../logger';

const runContainer = async function (config: FinalInstanceConfig): Promise<void> {
  logger.info(`${logger.WHITE}Starting Container(s)...${logger.NC}`);
  makeContainers(config);

  const {
    phpVersion,
    flushOnRestart,
    networkname,
    containerName,
    runningFromCache,
    image,
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

  let imagename = `wordpress_devenv_visiblevc:latest-${phpVersion}`;
  if (runningFromCache) {
    try {
      logger.info(`Loading ${logger.green(image)} (this might take a while)...`);
      const { stderr: loaderr } = await load(image);
      if (loaderr) {
        console.log(loaderr.toString());
        logger.error('Failed loading image file.');
        process.exit(1);
      }
      imagename = snapshotImage;
    } catch (error) {
      console.log(error);
      logger.error('Failed loading image file.');
    }
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
        ${imagename}`,
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
