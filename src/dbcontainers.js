const logger = require("./logger");
const { execSync } = require("child_process");

const makeContainers = ({ topdir, networkname }) => {
  logger.info(`${logger.WHITE}Running Container(s)...${logger.NC}`);
  execSync(`docker build -t wordpress_devenv_visiblevc:latest ${topdir}`, {
    stdio: "inherit"
  });
  execSync(
    `docker-compose -p ${networkname} -f ${topdir}/docker-compose.db.yml up -d`,
    { stdio: "inherit" }
  );
};

module.exports = makeContainers;
