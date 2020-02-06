const path = require("path");
const { execSync } = require("child_process");
const prompts = require("prompts");
const validateConfig = require("./src/validate");
const runContainer = require("./src/instance");
const stopContainers = require("./src/stop");
const logContainer = require("./src/logContainer");
const runNgrok = require("./src/ngrok");

const args = process.argv.slice(2);
let configfolder = args[0] ? args[0] : null;
let configfile = "./wp-instances.json";
let topdir = path.resolve(__dirname);
let workingdir = topdir;

if (configfolder) {
  workingdir = path.resolve(__dirname, configfolder);
  configfile = `${workingdir}/wp-instances.json`;
}

// get JSON config
let config = require(configfile);

const iselect = async function(config) {
  if (Array.isArray(config)) {
    let instances = [];
    config.forEach(cobj => {
      instances = [...instances, { title: cobj.instanceName }];
    });
    const { index } = await prompts({
      type: "select",
      name: "index",
      message: "Select an instance",
      choices: instances,
      initial: 0
    });
    if (config[index]) {
      config = config[index];
    }
    return config;
  } else {
    return config;
  }
};

const actionMap = [
  { title: "Run Containers", action: runContainer },
  { title: "Stop Containers", action: stopContainers },
  { title: "Launch NGROK (local SSL)", action: runNgrok },
  { title: "Toggle SSL" },
  { title: "Log Container", action: logContainer },
  { title: "Overwrite host dumpfile with DB of currently mounted volume" },
  { title: "Create new host dumpfile with DB of currently mounted volume" },
  { title: "Replace plugin volume with deployment ready bundle (Toggle)" }
];
const actionSelect = async function(config) {
  return await prompts({
    type: "select",
    name: "actionIndex",
    message: `Select an operation to perform for ${config.instanceName}`,
    choices: actionMap,
    initial: 0
  });
};

(async () => {
  config = await iselect(config);
  config = validateConfig(config, workingdir);
  config.topdir = topdir;
  config.workingdir = workingdir;
  config.networkname = "wp-dev-instances";
  config.containerName = `${config.instanceName}_dev_wp`;

  config.dockerBridgeIP = execSync(
    "docker network inspect bridge -f '{{ (index .IPAM.Config 0).Gateway }}'"
  ).toString();

  const { actionIndex } = await actionSelect(config);
  actionMap[actionIndex].action(config);
})();
