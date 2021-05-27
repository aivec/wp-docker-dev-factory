import path from 'path';
import fs from 'fs';
import { FinalInstanceConfig } from '../types';
import { exec } from 'child_process';
import prompts from 'prompts';
import { dockerDumpfilesDirpath, dockerScriptsDirpath } from '../constants';
import logger from '../logger';

export const redumpWithSelectedDumpfile = async ({
  containerName,
  workingdir,
  containerPort,
}: FinalInstanceConfig): Promise<void> => {
  try {
    const dumpfilesDir = path.resolve(workingdir, 'dumpfiles');
    const dumpfiles = fs
      .readdirSync(dumpfilesDir, { withFileTypes: true })
      .filter((item) => !item.isDirectory())
      .map((item) => ({
        title: item.name,
        value: `${dockerDumpfilesDirpath}/${item.name}`,
      }));

    const { selection } = await prompts(
      {
        type: 'select',
        name: 'selection',
        message: 'Select a dump file to overwrite the current database with',
        choices: dumpfiles,
        initial: 0,
      },
      {
        onCancel: () => {
          console.log('\nBye.');
          process.exit();
        },
      },
    );

    const replacementUrl = `http://localhost:${containerPort}`;
    const wpcmds = [
      'wp db drop --yes',
      'wp db create',
      `wp db import ${selection}`,
      // we have to check whether a search-replace is required because the command will fail if no hits were found
      // in the search... Even though running the command directly from the command line will only output a
      // warning message if no hits were found... super annoying
      `siteurl=$(wp option get siteurl)`,
      `if [ "$siteurl" != "${replacementUrl}" ]; then wp search-replace $siteurl ${replacementUrl}; fi`,
      'wp core update-db',
    ];
    exec(
      `docker exec -i ${containerName} /bin/sh -c '${wpcmds.join(' && ')}'`,
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
          console.log(stdout);
        }
      },
    );
  } catch (e) {
    console.log(e);
    logger.error('Is the container running?');
  }
};

export const overwriteDumpfile = ({
  containerName,
  envvarsMap: { DB_NAME },
}: FinalInstanceConfig): void => {
  try {
    exec(
      `docker exec -i ${containerName} /bin/sh -c "php ${dockerScriptsDirpath}/redump.php root root ${DB_NAME} /data/db.sql"`,
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
      `docker exec -i ${containerName} /bin/sh -c "php ${dockerScriptsDirpath}/redump.php root root ${DB_NAME} ${dockerDumpfilesDirpath}/${response.filename}.sql"`,
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
