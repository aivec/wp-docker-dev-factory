import { type FinalInstanceConfig } from 'src/types';
import fs from 'fs';
import YAML from 'yaml';
import { execSync } from 'child_process';
import logger from 'src/logger';
import { buildDockerBuildArgs } from 'src/buildFinalConfig/buildDockerBuildArgs';

const runContainer = async function (config: FinalInstanceConfig): Promise<void> {
  logger.info(`${logger.WHITE}Starting Container(s)...${logger.NC}`);

  const { instanceName, containerName, envvarsMap } = config;

  // start common containers
  try {
    execSync(`docker compose -f ${config.commonServicesComposeFilePath} up -d`);
  } catch (e) {
    console.log(e);
  }

  // Create instance directory if it doesn't exist
  fs.mkdirSync(config.instanceDir, { recursive: true });

  // Convert object to .env format
  const envContent = Object.entries(envvarsMap)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Write to .env file
  fs.writeFileSync(config.instanceEnvFilePath, envContent);

  // Create JSON config file specific to this instance
  fs.writeFileSync(config.instanceConfigFilePath, JSON.stringify(config, null, 2));

  // Read and parse the template
  const file = fs.readFileSync(config.instanceComposeFileTemplatePath, 'utf8');
  const doc = YAML.parseDocument(file);

  // Inject markup
  const hostName = config.configVariables.WORDPRESS_APP_HOST_NAME.value;
  const appContainerName = config.configVariables.WORDPRESS_APP_CONTAINER_NAME.value;
  const dbServiceName = config.configVariables.WORDPRESS_DB_SERVICE_NAME.value;
  const appServiceName = config.configVariables.WORDPRESS_APP_SERVICE_NAME.value;
  const dbTemplateService = doc.getIn(['services', 'db']);
  const appTemplateService = doc.getIn(['services', 'app']);
  doc.setIn(['services', dbServiceName], dbTemplateService);
  doc.setIn(['services', appServiceName], appTemplateService);
  doc.deleteIn(['services', 'db']);
  doc.deleteIn(['services', 'app']);
  if (config.configVariables.APP_PORT?.value) {
    doc.setIn(
      ['services', appServiceName, 'ports'],
      [`${config.configVariables.APP_PORT.value}:80`],
    );
  }
  doc.setIn(['services', appServiceName, 'build', 'context'], config.topdir);
  doc.setIn(['services', appServiceName, 'volumes'], config.volumes);
  doc.deleteIn(['services', appServiceName, 'depends_on']);
  doc.setIn(
    ['services', appServiceName, 'depends_on', dbServiceName, 'condition'],
    'service_healthy',
  );
  if (hostName) {
    /* let extras = [];
    const p = platform();
    if (p !== 'darwin' && p !== 'win32') {
      // map host.docker.internal to docker0 bridge IP for linux
      extras = ['--add-host=host.docker.internal:host-gateway'];
    } */
    doc.setIn(
      ['services', appServiceName, 'labels'],
      [
        `traefik.http.routers.${appContainerName}.rule=Host(\`${hostName}\`)`,
        `traefik.http.services.${appContainerName}.loadbalancer.server.port=80`,
      ],
    );
  }

  // Write to new file
  fs.writeFileSync(config.instanceComposeFile, doc.toString(), 'utf8');

  // docker image build args
  const buildArgs = buildDockerBuildArgs(config);

  try {
    execSync(
      `docker compose -p ${instanceName} -f ${config.instanceComposeFile} build ${buildArgs} ${appServiceName}`,
      {
        stdio: 'inherit',
      },
    );
    execSync(`docker compose -p ${instanceName} -f ${config.instanceComposeFile} up -d`, {
      stdio: 'inherit',
    });
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
