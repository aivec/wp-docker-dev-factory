const { execSync, exec } = require("child_process");
const prompts = require("prompts");
const logger = require("./logger");

const overwriteDumpfile = ({ containerName, envvars: { DB_NAME } }) => {
  try {
    exec(
      `docker exec -it ${containerName} /bin/sh -c "php redump.php root root ${DB_NAME} /app/db.sql"`,
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

        if (stdout) {
          logger.error(stdout);
          process.exit(1);
        } else {
          logger.info("Success");
        }
      }
    );
  } catch (e) {
    console.log(e);
    logger.error("Is the container running?");
  }
};

const createNewDump = async ({ containerName, envvars: { DB_NAME } }) => {
  try {
    logger.info(
      "New dump-files are placed in a folder named dumpfiles in your project directory."
    );
    const response = await prompts({
      type: "text",
      name: "filename",
      message:
        "Please enter a file name for your new dump-file (.sql is not required):"
    });
    exec(
      `docker exec -i ${containerName} /bin/sh -c "php redump.php root root ${DB_NAME} /app/dumpfiles/${response.filename}.sql"`,
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

        if (stdout) {
          logger.error(stdout);
          process.exit(1);
        } else {
          logger.info("Success");
        }
      }
    );
  } catch (e) {
    console.log("\nAborted.");
  }
};

module.exports = { createNewDump, overwriteDumpfile };
