import { existsSync, readFileSync } from 'fs';
import path from 'path';
import prompts from 'prompts';
import { cwd } from 'process';
import { InstanceConfig, FinalInstanceConfig } from './types';
import { createNewDump, overwriteDumpfile, redumpWithSelectedDumpfile } from './actions/dumpfiles';
import { isRunning } from './docker/container';
import validateConfig from './validation/validateAll';
import buildFinalConfig from './buildFinalConfig/buildAll';
import runContainer from './actions/instance';
import stopContainers from './actions/stop';
import saveSnapshot from './actions/savesnapshot';
import logContainer from './actions/logContainer';
import runNgrok from './actions/ngrok';
import logger from './logger';

const environmentSelect = async function (
  config: InstanceConfig | InstanceConfig[],
): Promise<InstanceConfig> {
  if (Array.isArray(config)) {
    let instances: { title: string; value: any }[] = [];
    (config as InstanceConfig[]).forEach((cobj, index) => {
      instances = [...instances, { title: cobj.instanceName, value: index }];
    });
    const { index } = await prompts({
      type: 'select',
      name: 'index',
      message: 'Select an instance',
      choices: instances,
      initial: 0,
    });
    config = config[index];
    return config;
  } else {
    return config;
  }
};

const actionSelect = async function (config: InstanceConfig): Promise<prompts.Answers<'action'>> {
  const actionMap: {
    title: string;
    value: {
      shouldBeRunning?: boolean;
      requiresValidation: boolean;
      func: (config: FinalInstanceConfig) => void;
    };
  }[] = [
    {
      title: 'Start WordPress',
      value: {
        shouldBeRunning: false,
        requiresValidation: true,
        func: runContainer,
      },
    },
    {
      title: 'Stop WordPress',
      value: {
        requiresValidation: false,
        func: stopContainers,
      },
    },
    {
      title: 'Save snapshot',
      value: {
        shouldBeRunning: true,
        requiresValidation: false,
        func: saveSnapshot,
      },
    },
    {
      title: 'Launch NGROK (local SSL)',
      value: {
        shouldBeRunning: true,
        requiresValidation: false,
        func: runNgrok,
      },
    },
    {
      title: 'Show server logs',
      value: {
        shouldBeRunning: true,
        requiresValidation: false,
        func: logContainer,
      },
    },
    {
      title: 'Update dumpfile',
      value: {
        shouldBeRunning: true,
        requiresValidation: false,
        func: overwriteDumpfile,
      },
    },
    {
      title: 'Create new dumpfile',
      value: {
        shouldBeRunning: true,
        requiresValidation: false,
        func: createNewDump,
      },
    },
    {
      title: 'Import database',
      value: {
        shouldBeRunning: true,
        requiresValidation: false,
        func: redumpWithSelectedDumpfile,
      },
    },
  ];

  return await prompts({
    type: 'select',
    name: 'action',
    message: `Select an operation for ${config.instanceName}`,
    choices: actionMap,
    initial: 0,
  });
};

export const showPrompts = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const configfolder = args[0] ? args[0] : null;
  let configfile = './wp-instances.json';
  const topdir = path.resolve(path.join(__dirname, '..'));
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
  const config: InstanceConfig | InstanceConfig[] = JSON.parse(readFileSync(configfile, 'utf8'));

  try {
    const chosenConfig = await environmentSelect(config);
    chosenConfig.workingdir = workingdir;
    chosenConfig.topdir = topdir;

    const {
      action: { func, shouldBeRunning, requiresValidation },
    } = await actionSelect(chosenConfig);

    if (requiresValidation) {
      try {
        validateConfig(chosenConfig);
      } catch (error) {
        process.exit(1);
      }
    }
    const finalConfig: FinalInstanceConfig = buildFinalConfig(chosenConfig, workingdir, topdir);

    const running = isRunning(finalConfig.containerName);
    if (!running && shouldBeRunning === true) {
      logger.error(`Container ${logger.yellow(finalConfig.containerName)} isn't running.`);
      process.exit(1);
    }

    if (running && shouldBeRunning === false) {
      logger.error(`Container ${logger.yellow(finalConfig.containerName)} is already running.`);
      process.exit(1);
    }

    func(finalConfig);
  } catch (e) {
    console.log('\nBye.');
  }
};
