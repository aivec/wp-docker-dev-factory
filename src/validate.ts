import path from "path";
import logger from "./logger";
import validateFtpConfig from "./validate/ftpssh";
import { existsSync } from "fs";
import { InstanceConfig } from "./config"

const validateConfig = (config: InstanceConfig, workingdir: string) => {
  config.instanceName = config.instanceName ? config.instanceName : "";
  config.locale = config.locale ? config.locale : "en_US";
  config.localPlugins = config.localPlugins ? config.localPlugins : [];
  config.localThemes = config.localThemes ? config.localThemes : [];
  config.downloadPlugins = config.downloadPlugins ? config.downloadPlugins : [];
  
  let alreadyInstalled = [...config.downloadPlugins];

  if (!config.instanceName) {
    logger.error(
      `${logger.WHITE}${logger.YELLOW}instanceName${logger.WHITE} is not defined in your config.`
    );
    process.exit(1);
  }

  if (!config.containerPort) {
    logger.error(
      `${logger.WHITE}${logger.YELLOW}containerPort${logger.WHITE} is not defined in your config.`
    );
    process.exit(1);
  }

  if (config.localPlugins) {
    if (!Array.isArray(config.localPlugins)) {
      logger.error(
        `${logger.WHITE}${logger.YELLOW}localPlugins${logger.WHITE} is defined in your config but it is not an array.`
      );
      process.exit(1);
    }
  }

  if (config.localThemes) {
    if (!Array.isArray(config.localThemes)) {
      logger.error(
        `${logger.WHITE}${logger.YELLOW}localThemes${logger.WHITE} is defined in your config but it is not an array.`
      );
      process.exit(1);
    }
  }

  if (config.downloadPlugins) {
    if (!Array.isArray(config.downloadPlugins)) {
      logger.error(
        `${logger.WHITE}${logger.YELLOW}downloadPlugins${logger.WHITE} is defined in your config but it is not an array.`
      );
      process.exit(1);
    }
  }

  let { ftp } = config;
  if (ftp) {
    config.ftp = validateFtpConfig(ftp);
  }

  let volumes = [];
  config.localPlugins.forEach(p => {
    const abspath = path.resolve(workingdir, p);
    const folder = path.basename(abspath);
    if (!existsSync(abspath)) {
      logger.error(
        `${logger.WHITE}Local plugin at '${logger.YELLOW}${abspath}' ${logger.WHITE} does not exist.`
      );
      process.exit(1);
    }
    volumes = [...volumes, `-v ${abspath}:/app/wp-content/plugins/${folder}`];
    alreadyInstalled = [...alreadyInstalled, folder];
  });

  config.localThemes.forEach(t => {
    const abspath = path.resolve(workingdir, t);
    const folder = path.basename(abspath);
    if (!existsSync(abspath)) {
      logger.error(
        `${logger.WHITE}Local theme at '${logger.YELLOW}${abspath}' ${logger.WHITE} does not exist.`
      );
      process.exit(1);
    }
    volumes = [...volumes, `-v ${abspath}:/app/wp-content/themes/${folder}`];
  });

  let envvars = {};
  envvars["DB_NAME"] = config.instanceName;
  envvars["DB_PREFIX"] = "wp_";
  if (config.database) {
    const db = config.database;
    if (db.mysqlDumpfile) {
      const abspath = path.resolve(workingdir, db.mysqlDumpfile);
      if (!existsSync(abspath)) {
        logger.error(
          `${logger.WHITE}Local MySQL dump file at ${logger.CYAN}${abspath}${logger.WHITE} doesn't exist.`
        );
        process.exit(1);
      }
      volumes = [...volumes, `-v ${abspath}:/data/db.sql`];
    }
    if (db.dbName) {
      envvars["DB_NAME"] = db.dbName;
    }
    if (db.dbPrefix) {
      envvars["DB_PREFIX"] = db.dbPrefix;
    }
  }

  config.volumes = volumes;
  config.envvars = envvars;
  config.alreadyInstalled = alreadyInstalled;

  return config;
};

export default validateConfig;
