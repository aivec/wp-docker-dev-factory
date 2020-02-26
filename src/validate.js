const path = require("path");
const logger = require("./logger");
const { existsSync } = require("fs");

const validateConfig = (config, workingdir) => {
  config.instanceName = config.instanceName ? config.instanceName : "";
  config.containerPort = config.containerPort ? config.containerPort : "";
  config.localPlugins = config.localPlugins ? config.localPlugins : [];
  config.localThemes = config.localThemes ? config.localThemes : [];
  config.downloadPlugins = config.downloadPlugins ? config.downloadPlugins : [];
  config.mysqlDumpfile = config.mysqlDumpfile ? config.mysqlDumpfile : "";
  config.database = config.database ? config.database : [];

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

  // proprietary plugins and themes data
  let { ftp } = config;
  if (ftp) {
    if (!Array.isArray(ftp)) {
      logger.error(
        `${logger.WHITE}${logger.YELLOW}ftp${logger.WHITE} is defined in your config but it is not an array.`
      );
      process.exit(1);
    }
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
  envvars['DB_NAME'] = config.instanceName
  if (config.database) {
    const db = config.database
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
      envvars['DB_NAME'] = db.dbName
    }
    if (db.dbPrefix) {
      envvars['DB_PREFIX'] = db.dbPrefix
    }
  }

  config.volumes = volumes
  config.envvars = envvars

  return config
}

module.exports = validateConfig
