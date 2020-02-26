const { execSync } = require("child_process");
const fs = require("fs")
const archiver = require('archiver');
const path = require("path");
const prompts = require("prompts");
const logger = require("./logger");

const toggleDeploymentBundle = async config => {
  try {
    const { index } = await prompts({
      type: "select",
      name: "index",
      message: "Select a plugin to bundle",
      choices: config.localPlugins
    });
    const selected = config.localPlugins[index];
    const pluginName = path.basename(selected);
    const pluginParentDirPath = path.dirname(selected);
    // console.log(`plugin abspath: ${selected}`);
    // console.log(`plugin parent dir path: ${pluginParentDirPath}`);
    // console.log(`plugin name: ${pluginName}`);

    fs.open(`${pluginParentDirPath}/${pluginName}.devrepo.zip`, 'r', (err, fd) => {
      if (err) {
        if (err.code === 'ENOENT') {
          logger.info(
            `${logger.WHITE}Replacing ${logger.YELLOW}${pluginName} ${logger.WHITE}volume with ${logger.GREEN}deployment${logger.WHITE} bundle`
          );

          try {
            execSync(`cd ${selected} && ./bundle.sh`, { stdio: "inherit" });
          } catch (e) {
            logger.error(`${e}`);
            process.exit(1)
          }

          var output = fs.createWriteStream(`${pluginParentDirPath}/${pluginName}.devrepo.zip`);
          var archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
          });
        }
      } else {
        logger.error(err);
        process.exit(1)
      }
    });
  } catch (e) {
    console.log("\nAborted.");
  }
};

module.exports = toggleDeploymentBundle;
