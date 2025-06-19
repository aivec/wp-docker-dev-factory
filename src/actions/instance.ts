import { FinalInstanceConfig } from '../types';
import { platform } from 'os';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { execSync } from 'child_process';
import makeContainers from './dbcontainers';
import { load } from '../docker/load';
import logger from '../logger';

const runContainer = async function (config: FinalInstanceConfig): Promise<void> {
  logger.info(`${logger.WHITE}Starting Container(s)...${logger.NC}`);

  const {
    phpVersion,
    flushOnRestart,
    instanceName,
    networkname,
    containerName,
    hostName,
    runningFromCache,
    image,
    snapshotImage,
    containerPort,
    envvarsMap,
    envvars,
    volumes,
    topdir,
  } = config;

  let extras = [];
  const p = platform();
  if (p !== 'darwin' && p !== 'win32') {
    // map host.docker.internal to docker0 bridge IP for linux
    extras = ['--add-host=host.docker.internal:host-gateway'];
  }

  if (hostName) {
    extras = [
      ...extras,
      `--label='traefik.http.routers.${instanceName}.rule=Host(\`${hostName}\`)'`,
    ];
  }

  if (containerPort) {
    extras = [...extras, `-p ${containerPort}:80`];
  }

  // start common containers
  try {
    execSync(`docker compose -f ${topdir}/docker/docker-compose.common.yml up -d`);
  } catch (e) {
    console.log(e);
  }

  // Convert object to .env format
  const envContent = Object.entries(envvarsMap)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  // Write to .env file
  const envfpath = `${topdir}/docker/.env`;
  fs.writeFileSync(envfpath, envContent);

  // start db container
  try {
    execSync(`docker compose -p ${instanceName} -f ${topdir}/docker/docker-compose.wp.yml up -d`);
  } catch (e) {
    console.log(e);
  }

  // Read and parse the template
  const file = fs.readFileSync(`${topdir}/docker/docker-compose.template.yml`, 'utf8');
  const doc = YAML.parseDocument(file);

  // Inject markup
  if (config.containerPort) {
    doc.setIn(['services', 'app', 'ports'], [`${config.containerPort}:80`]);
  }

  // Write to new file
  fs.writeFileSync(`${topdir}/docker/docker-compose.wp.yml`, doc.toString(), 'utf8');
  try {
    /* execSync(
      `docker buildx create --name container-network-builder --driver docker-container --driver-opt network=local-wp-net --use`,
    );
    execSync(
      `docker buildx build --network=local-wp-net -t ${envvarsMap.WORDPRESS_APP_IMAGE_NAME} -f ${topdir}/docker/Dockerfile.php${envvarsMap.PHP_VERSION} --load ${topdir}`,
    ); */
    execSync(
      `docker compose -p ${instanceName} -f ${topdir}/docker/docker-compose.wp.yml build app`,
      {
        stdio: 'inherit',
      },
    );
    execSync(
      `docker compose -p ${instanceName} -f ${topdir}/docker/docker-compose.wp.yml up -d app`,
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
