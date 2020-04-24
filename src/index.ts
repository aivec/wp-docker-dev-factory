#!/usr/bin/env node

import { InstanceConfig, FinalInstanceConfig } from "./config";
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import prompts from "prompts";
import { cwd } from "process";
import { createNewDump, overwriteDumpfile } from "./dumpfiles";
import { isContainerRunning } from "./utils";
import toggleDeploymentBundle from "./toggleDeploymentBundle";
import validateConfig from "./validate";
import runContainer from "./instance";
import stopContainers from "./stop";
import logContainer from "./logContainer";
import runNgrok from "./ngrok";
import logger from "./logger";

const args = process.argv.slice(2);
let configfolder = args[0] ? args[0] : null;
let configfile = "./wp-instances.json";
let topdir = path.resolve(path.join(__dirname, '..'));
let workingdir = cwd();

if (configfolder) {
  workingdir = path.resolve(cwd(), configfolder);
  configfile = `${workingdir}/wp-instances.json`;
}

if (!existsSync(configfile)) {
  logger.error(`${logger.yellow(configfile)} doesnt exist.`);
  process.exit(1);
}

// get JSON config
let config: InstanceConfig | InstanceConfig[] = JSON.parse(readFileSync(configfile, "utf8"));

const iselect = async function(config: InstanceConfig | InstanceConfig[]) {
  if (Array.isArray(config)) {
    let instances: { title: string; value: any }[] = [];
    (<InstanceConfig[]>config).forEach((cobj, index) => {
      instances = [...instances, { title: cobj.instanceName, value: index }];
    });
    const { index } = await prompts({
      type: "select",
      name: "index",
      message: "Select an instance",
      choices: instances,
      initial: 0
    });
    config = config[index];
    return config;
  } else {
    return config;
  }
};

const actionMap: {
  title: string;
  isRunning: boolean;
  value: (config: FinalInstanceConfig) => void;
}[] = [
  {
    title: "Run Containers",
    isRunning: false,
    value: runContainer
  },
  {
    title: "Stop WordPress Container",
    value: stopContainers,
    isRunning: true
  },
  {
    title: "Launch NGROK (local SSL)",
    value: runNgrok,
    isRunning: true
  },
  {
    title: "Log WordPress Container",
    value: logContainer,
    isRunning: true
  },
  {
    title: "Overwrite host dumpfile with DB of currently mounted volume",
    value: overwriteDumpfile,
    isRunning: true
  },
  {
    title: "Create new dumpfile with DB of currently mounted volume",
    value: createNewDump,
    isRunning: true
  },
  {
    title: "Replace plugin volume with deployment ready bundle (Toggle)",
    value: toggleDeploymentBundle,
    isRunning: true
  }
];
const actionSelect = async function(config: InstanceConfig) {
  return await prompts({
    type: "select",
    name: "action",
    message: `Select an operation to perform for ${config.instanceName}`,
    choices: actionMap,
    initial: 0
  });
};

(async () => {
  try {
    let chosenConfig = await iselect(config);

    chosenConfig = validateConfig(chosenConfig, workingdir);
    chosenConfig.topdir = topdir;
    chosenConfig.workingdir = workingdir;
    chosenConfig.networkname = "wp-dev-instances";
    chosenConfig.containerName = `${chosenConfig.instanceName}_dev_wp`;

    chosenConfig.dockerBridgeIP = execSync(
      "docker network inspect bridge -f '{{ (index .IPAM.Config 0).Gateway }}'"
    ).toString();

    const finalConfig: FinalInstanceConfig = <FinalInstanceConfig>chosenConfig;

    const { action } = await actionSelect(finalConfig);

    if (action.isRunning) {
      isContainerRunning(finalConfig.containerName, (running: boolean) => {
        if (!running) {
          logger.error(
            `Container '${finalConfig.containerName}' isn't running. Aborting.`
          );
          process.exit(1);
        }

        action(finalConfig);
      });
    } else {
      action(finalConfig);
    }
  } catch (e) {
    console.log("\nBye.");
  }
})();
