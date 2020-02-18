const logger = require("./logger");
const { execSync } = require("child_process");

const stopContainers = config => {
  logger.info(`${logger.WHITE}Stopping Container(s)...${logger.NC}`);
  execSync(`docker stop ${config.containerName}`, { stdio: "inherit" });
  execSync(`docker rm ${config.containerName}`, { stdio: "inherit" });
  /* execSync(
    `docker-compose -p ${config.networkname} -f ${config.topdir}/docker-compose.db.yml down`,
    { stdio: "inherit" }
  ); */
};

module.exports = stopContainers;
