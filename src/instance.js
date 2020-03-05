const { execSync } = require("child_process");
const makeContainers = require("./dbcontainers");
const logger = require("./logger");

const runContainer = function(config) {
  makeContainers(config);

  const {
    locale,
    instanceName,
    networkname,
    containerName,
    containerPort,
    dockerBridgeIP,
    alreadyInstalled,
    ftp
  } = config;

  let { downloadPlugins } = config;
  downloadPlugins = [...downloadPlugins, "relative-url"];
  const dplugins = `--env PLUGINS="${downloadPlugins.join(" ")}"`;

  let envvars = Object.keys(config.envvars).map(key => {
    return `--env ${key}=${config.envvars[key]}`;
  });
  const envs = envvars.join(" ");

  let volumes = config.volumes;
  volumes = [
    ...volumes,
    `-v ${config.topdir}/initwp.sh:/docker-entrypoint-initwp.d/initwp.sh`
  ];
  volumes = [...volumes, `-v ${config.topdir}/redump.php:/app/redump.php`];
  volumes = [
    ...volumes,
    `-v ${config.topdir}/get_active_plugins.php:/app/get_active_plugins.php`
  ];
  volumes = [...volumes, `-v ${config.topdir}/dumpfiles:/app/dumpfiles`];
  const v = volumes.join(" ");

  try {
    execSync(
      `docker run -d --name=${containerName} -p ${containerPort}:80 \
        --cap-add=SYS_ADMIN \
        --device=/dev/fuse \
        --security-opt apparmor=unconfined \
        ${v} \
        ${dplugins} \
        ${envs} \
        --env XDEBUG_CONFIG=remote_host="${dockerBridgeIP}" \
        --env AVC_NODE_ENV=development \
        --env DOCKER_BRIDGE_IP="${dockerBridgeIP}" \
        --env DOCKER_CONTAINER_PORT=${containerPort} \
        --env INSTANCE_NAME=${instanceName} \
        --env FTP_CONFIGS='${JSON.stringify(ftp)}' \
        --env ALREADY_INSTALLED_PLUGINS='${JSON.stringify(alreadyInstalled)}' \
        --env WP_LOCALE=${locale} \
        --env WP_DEBUG=1 \
        --env WP_DEBUG_DISPLAY=1 \
        --env DB_HOST=aivec_wp_mysql \
        --env DB_USER=root \
        --env DB_PASS=root \
        --env URL_REPLACE="http://localhost:${containerPort}" \
        --network=${networkname}_default \
        wordpress_devenv_visiblevc`,
      { stdio: "inherit" }
    );
  } catch (e) {
    console.log(e);
    logger.error("Something went wrong :(");
    process.exit(1);
  }

  try {
    execSync(`docker logs -f ${containerName}`, { stdio: "inherit" });
  } catch (e) {
    logger.info(
      `${logger.YELLOW}${containerName}${logger.WHITE} is still running in the background. You can view the log stream anytime with ${logger.GREEN}Log WordPress Container`
    );
  }
};

module.exports = runContainer;
