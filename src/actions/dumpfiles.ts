import { FinalInstanceConfig } from '../types';
import { exec } from 'child_process';
import prompts from 'prompts';
import logger from '../logger';

export const overwriteDumpfile = ({
  containerName,
  envvarsMap: { DB_NAME },
}: FinalInstanceConfig): void => {
  try {
    exec(
      `docker exec -i ${containerName} /bin/sh -c "php scripts/redump.php root root ${DB_NAME} /data/db.sql"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          logger.error('command failed');
          process.exit(1);
        }
        if (stderr) {
          console.error(error);
          logger.error('command failed');
          process.exit(1);
        }

        if (stdout) {
          logger.error(stdout);
          process.exit(1);
        } else {
          logger.info('Success');
        }
      },
    );
  } catch (e) {
    console.log(e);
    logger.error('Is the container running?');
  }
};

export const createNewDump = async ({
  containerName,
  envvarsMap: { DB_NAME },
}: FinalInstanceConfig): Promise<void> => {
  try {
    logger.info(
      `New dumpfiles are placed in a folder named ${logger.yellow(
        'dumpfiles',
      )} in your project directory.`,
    );
    const response = await prompts({
      type: 'text',
      name: 'filename',
      message: `Please enter a file name for your new dumpfile (.sql is not required):`,
    });
    if (!response.filename) {
      throw new Error();
    }
    exec(
      `docker exec -i ${containerName} /bin/sh -c "php scripts/redump.php root root ${DB_NAME} /app/dumpfiles/${response.filename}.sql"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          logger.error('command failed');
          process.exit(1);
        }
        if (stderr) {
          console.error(error);
          logger.error('command failed');
          process.exit(1);
        }

        if (stdout) {
          logger.error(stdout);
          process.exit(1);
        } else {
          logger.info('Success');
        }
      },
    );
  } catch (e) {
    console.log('\nAborted.');
  }
};
