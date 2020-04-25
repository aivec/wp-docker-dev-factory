import { FinalInstanceConfig } from '../types';
import { execSync } from 'child_process';
import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import prompts from 'prompts';
import logger from '../logger';

const toggleDeploymentBundle = async (config: FinalInstanceConfig) => {
  try {
    /* const { index } = await prompts({
      type: "select",
      name: "index",
      message: "Select a plugin to bundle",
      choices: config.localPlugins
    }); */
    const selected = config.localPlugins[0];
    const pluginName = path.basename(selected);
    const pluginParentDirPath = path.dirname(selected);
    // console.log(`plugin abspath: ${selected}`);
    // console.log(`plugin parent dir path: ${pluginParentDirPath}`);
    // console.log(`plugin name: ${pluginName}`);

    fs.open(`${pluginParentDirPath}/${pluginName}.devrepo.zip`, 'r', (err, fd) => {
      if (err) {
        if (err.code === 'ENOENT') {
          logger.info(
            `${logger.WHITE}Replacing ${logger.YELLOW}${pluginName} ${logger.WHITE}volume with ${logger.GREEN}deployment${logger.WHITE} bundle`,
          );

          try {
            execSync(`cd ${selected} && ./bundle.sh`, { stdio: 'inherit' });
          } catch (e) {
            logger.error(`${e}`);
            process.exit(1);
          }

          const output = fs.createWriteStream(`${pluginParentDirPath}/${pluginName}.devrepo.zip`);
          const archive = archiver('zip', {
            zlib: { level: 9 }, // Sets the compression level.
          });
        }
      } else {
        logger.error(err);
        process.exit(1);
      }
    });
  } catch (e) {
    console.log('\nAborted.');
  }

  const bashcommand = `if [ -e "$plugin_name.devrepo.tar" ]; then
    printf "\n${logger.INFO} ${logger.WHITE}Found repo backup archive, setting volume back to ${logger.YELLOW}development${logger.WHITE} repo\n"
    rm -rf $plugin_name/*
    mv $plugin_name.devrepo.tar $plugin_name/git_bundle.tar
    cd $plugin_name
    tar -xf git_bundle.tar
    rm git_bundle.tar
  else
    printf "\n${logger.WHITE}Replacing volume with ${logger.GREEN}deployment${logger.WHITE} bundle\n"
    cd $plugin_name
    if [ ! -e "bundle.sh" ]; then
        printf "\n${logger.WHITE}${logger.YELLOW}bundle.sh${logger.WHITE} does not exist in project folder. Aborting.\n"
        exit 1
    fi
    ./bundle.sh
    mv $plugin_name*.zip ../$plugin_name.zip
    tar --create --file=../$plugin_name.devrepo.tar .
    cd ../
    rm -rf $plugin_name/*
    rm -rf $plugin_name/.* 2>/dev/null
    mv $plugin_name.zip $plugin_name/bundle.zip
    cd $plugin_name
    unzip bundle.zip
    cp -a $plugin_name*/. .
    rm bundle.zip
    find . ! -type f -name "$plugin_name*" | xargs rm -R
  fi`;
};

export default toggleDeploymentBundle;
