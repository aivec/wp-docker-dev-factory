const { execSync } = require("child_process");
const makeContainers = require("./dbcontainers");

const runContainer = function(config) {
  makeContainers(config);

  const {
    networkname,
    instanceName,
    containerName,
    containerPort,
    dockerBridgeIP,
    ftp
  } = config;

  let { downloadPlugins } = config;
  downloadPlugins = [...downloadPlugins, "relative-url"];
  const dplugins = `--env PLUGINS="${downloadPlugins.join(" ")}"`;

  let volumes = config.volumes;
  volumes = [
    ...volumes,
    `-v ${config.topdir}/initwp.sh:/docker-entrypoint-initwp.d/initwp.sh`
  ];
  volumes = [...volumes, `-v ${config.topdir}/redump.php:/app/redump.php`];
  volumes = [...volumes, `-v ${config.topdir}/dumpfiles:/app/dumpfiles`];
  const v = volumes.join(" ");

  execSync(
    `docker run -d --name=${containerName} -p ${containerPort}:80 \
        --cap-add=SYS_ADMIN \
        --device=/dev/fuse \
        --security-opt apparmor=unconfined \
        ${v} \
        ${dplugins} \
        --env XDEBUG_CONFIG=remote_host="${dockerBridgeIP}" \
        --env AVC_NODE_ENV=development \
        --env DOCKER_BRIDGE_IP="${dockerBridgeIP}" \
        --env DOCKER_CONTAINER_PORT=${containerPort} \
        --env URL_REPLACE="http://localhost:${containerPort}" \
        --env DB_HOST=aivec_wp_mysql \
        --env DB_NAME=${instanceName} \
        --env FTP_CONFIGS='${JSON.stringify(ftp)}' \
        --env WORDPRESS_DEBUG=1 \
        --env WP_DEBUG_DISPLAY=1 \
        --env WORDPRESS_DEBUG=1 \
        --env WORDPRESS_DB_NAME=${instanceName} \
        --env WORDPRESS_DB_HOST=aivec_wp_mysql \
        --env WORDPRESS_DB_USER=admin \
        --env WORDPRESS_DB_PASSWORD=admin \
        --network=${networkname}_default \
        wordpress_devenv_visiblevc`,
    { stdio: "inherit" }
  );

  execSync(`docker logs -f ${containerName}`, { stdio: "inherit" });
};

module.exports = runContainer;
