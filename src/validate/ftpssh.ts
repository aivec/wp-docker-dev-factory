import { existsSync, readFileSync } from "fs";
import { FtpConfig, FtpMeta, FinalFtpConfig } from "src/config";
import { isObject } from "../utils";
import logger from "../logger";
import {
  serverConfigsDirpath,
  ftpConfigsFilename,
  ftpConfigsFilepath,
  instanceConfFilename
} from "../constants";

const validateFtpMeta = function(ftpMeta: FtpMeta, filepath: string): void {
  if (!ftpMeta.host) {
    console.log(ftpMeta);
    logger.syntaxError(`${logger.yellow("host")} is not defined.`, filepath);
    process.exit(1);
  }
  if (!ftpMeta.user) {
    console.log(ftpMeta);
    logger.syntaxError(`${logger.yellow("user")} is not defined.`, filepath);
    process.exit(1);
  }
};

const validate = function(ftp: FtpConfig[]): FinalFtpConfig[] {
  let finalFtpConfig: FinalFtpConfig[] = []
  // proprietary plugins and themes data
  if (!Array.isArray(ftp)) {
    console.log(ftp);
    logger.syntaxError(
      `${logger.yellow(
        "ftp"
      )} is defined in your config but it is not an array.`,
      instanceConfFilename
    );
    process.exit(1);
  }

  ftp.forEach((ftpConfig, index) => {
    if (!isObject(ftpConfig)) {
      console.log(ftpConfig);
      logger.syntaxError(
        `ftp config at index ${logger.yellow(index)} is not an object.`,
        instanceConfFilename
      );
      process.exit(1);
    }

    if (!ftpConfig.plugins && !ftpConfig.themes) {
      console.log(ftpConfig);
      logger.error(
        `At least one of ${logger.yellow("plugins")} or ${logger.yellow(
          "themes"
        )} must be defined`
      );
      process.exit(1);
    }
    if (!Array.isArray(ftpConfig.plugins)) {
      console.log(ftpConfig);
      logger.error(`${logger.yellow("plugins")} is not an array`);
      process.exit(1);
    }
    if (!Array.isArray(ftpConfig.themes)) {
      console.log(ftpConfig);
      logger.error(`${logger.yellow("themes")} is not an array`);
      process.exit(1);
    }

    if (ftpConfig.confpath) {
      if (!existsSync(ftpConfig.confpath)) {
        logger.error(
          `No such file exists: ${logger.yellow(ftpConfig.confpath)}`
        );
        process.exit(1);
      }
      try {
        const ftpMeta: FtpMeta = JSON.parse(
          readFileSync(ftpConfig.confpath, "utf8")
        );
        validateFtpMeta(ftpMeta, ftpConfig.confpath);
        finalFtpConfig = [...finalFtpConfig, { ...ftpConfig, meta: ftpMeta }]
      } catch (err) {
        logger.error(err);
        process.exit(1);
      }
    } else {
      if (!ftpConfig.confname) {
        console.log(ftpConfig);
        logger.syntaxError(
          `${logger.yellow("confname")} in ftp config at index ${logger.yellow(
            index
          )} is not defined.`,
          instanceConfFilename
        );
        process.exit(1);
      }

      if (existsSync(`${serverConfigsDirpath}/${ftpConfig.confname}.json`)) {
        try {
          const ftpMeta: FtpMeta = JSON.parse(
            readFileSync(
              `${serverConfigsDirpath}/${ftpConfig.confname}.json`,
              "utf8"
            )
          );
          validateFtpMeta(
            ftpMeta,
            `${serverConfigsDirpath}/${ftpConfig.confname}.json`
          );
          finalFtpConfig = [...finalFtpConfig, { ...ftpConfig, meta: ftpMeta }]
        } catch (err) {
          logger.error(err);
          process.exit(1);
        }
      } else if (existsSync(ftpConfigsFilepath)) {
        try {
          const allConfigs = JSON.parse(
            readFileSync(ftpConfigsFilepath, "utf8")
          );
          if (!allConfigs[ftpConfig.confname]) {
            console.log(allConfigs);
            logger.syntaxError(
              `${logger.yellow(
                ftpConfig.confname
              )} is not defined in ${logger.yellow(
                ftpConfigsFilepath
              )}. Either create a new file named ${logger.yellow(
                `${ftpConfig.confname}.json`
              )} in ${logger.yellow(
                serverConfigsDirpath
              )}, or add ${logger.yellow(
                ftpConfig.confname
              )} to ${logger.yellow(ftpConfigsFilename)}.`,
              ftpConfigsFilename
            );
            process.exit(1);
          }
          if (!isObject(allConfigs[ftpConfig.confname])) {
            console.log(allConfigs);
            logger.syntaxError(
              `${logger.yellow(
                ftpConfig.confname
              )} is defined in ${logger.yellow(
                ftpConfigsFilepath
              )} but it is not an object.`,
              ftpConfigsFilename
            );
            process.exit(1);
          }

          validateFtpMeta(allConfigs[ftpConfig.confname], ftpConfigsFilepath);
          finalFtpConfig = [...finalFtpConfig, { ...ftpConfig, meta: allConfigs[ftpConfig.confname] }]
        } catch (err) {
          logger.error(err);
          process.exit(1);
        }
      } else {
        console.log(ftpConfig);
        const ftpfile = `${ftpConfig.confname}.json`;
        logger.error(
          `A file named ${logger.yellow(
            ftpfile
          )} nor a file named ${logger.yellow(
            ftpConfigsFilename
          )} exists in ${logger.yellow(
            serverConfigsDirpath
          )}. Either create a new file named ${logger.yellow(
            ftpfile
          )} in ${logger.yellow(
            serverConfigsDirpath
          )}, or create a ${logger.yellow(
            ftpConfigsFilename
          )} file with ${logger.yellow(ftpConfig.confname)} as a key.`
        );
        process.exit(1);
      }
    }
  });

  return finalFtpConfig
};

export default validate;
