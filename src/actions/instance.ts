import { FinalInstanceConfig } from '../types';
import { execSync } from 'child_process';
import { _ } from 'lodash';
import makeContainers from './dbcontainers';
import logger from '../logger';

const runContainer = function (config: FinalInstanceConfig): void {
  makeContainers(config);

  const {
    phpVersion,
    wordpressVersion,
    locale,
    instanceName,
    networkname,
    containerName,
    containerPort,
    dockerBridgeIP,
    envvars,
    volumes,
  } = config;

  try {
    execSync(
      `docker run -d --name=${containerName} -p ${containerPort}:80 \
        --cap-add=SYS_ADMIN \
        --device=/dev/fuse \
        --security-opt apparmor=unconfined \
        ${volumes} \
        ${envvars} \
        --env XDEBUG_CONFIG=remote_host="${dockerBridgeIP}" \
        --env DOCKER_BRIDGE_IP="${dockerBridgeIP}" \
        --env DOCKER_CONTAINER_PORT=${containerPort} \
        --env INSTANCE_NAME=${instanceName} \
        --env WP_LOCALE=${locale} \
        --env WP_DEBUG=1 \
        --env WP_DEBUG_DISPLAY=1 \
        --env DB_HOST=aivec_wp_mysql \
        --env DB_USER=root \
        --env DB_PASS=root \
        --env WP_VERSION=${wordpressVersion} \
        --env URL_REPLACE="http://localhost:${containerPort}" \
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
