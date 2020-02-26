const { exec } = require("child_process");
const logger = require("./logger");

const isContainerRunning = (containerName, callback) => {
  exec(
    `docker ps --filter "name=${containerName}" -q`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        logger.error("command failed");
        process.exit(1);
      }
      if (stderr) {
        console.error(error);
        logger.error("command failed");
        process.exit(1);
      }
      // container was found and is running
      return callback(stdout ? true : false);
    }
  );
};

module.exports = { isContainerRunning };
