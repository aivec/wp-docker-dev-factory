import { FinalInstanceConfig } from "./config";
import { exec } from "child_process";
import prompts from "prompts";
import logger from "./logger";

export const overwriteDumpfile = ({
  containerName,
  envvars: { DB_NAME }
}: FinalInstanceConfig) => {
  try {
    exec(
      `docker exec -i ${containerName} /bin/sh -c "php redump.php root root ${DB_NAME} /app/db.sql"`,
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

export const createNewDump = async ({
  containerName,
  envvars: { DB_NAME }
}: FinalInstanceConfig) => {
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
