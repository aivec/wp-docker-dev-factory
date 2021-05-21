#!/usr/bin/env node

import yargs from 'yargs';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import prompts from 'prompts';
import { cwd } from 'process';
import { InstanceConfig, FinalInstanceConfig } from './types';
import { createNewDump, overwriteDumpfile, redumpWithSelectedDumpfile } from './actions/dumpfiles';
import { isContainerRunning } from './utils';
import validateConfig from './validation/validateAll';
import buildFinalConfig from './buildFinalConfig/buildAll';
import runContainer from './actions/instance';
import stopContainers from './actions/stop';
import logContainer from './actions/logContainer';
import runNgrok from './actions/ngrok';
import logger from './logger';

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

const iselect = async function (
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

const actionMap: {
  title: string;
  value: {
    isRunning: boolean;
    requiresValidation: boolean;
    func: (config: FinalInstanceConfig) => void;
  };
}[] = [
  {
    title: 'Start WordPress',
    value: {
      isRunning: false,
      requiresValidation: true,
      func: runContainer,
    },
  },
  {
    title: 'Stop WordPress',
    value: {
      isRunning: true,
      requiresValidation: false,
      func: stopContainers,
    },
  },
  {
    title: 'Launch NGROK (local SSL)',
    value: {
      isRunning: true,
      requiresValidation: false,
      func: runNgrok,
    },
  },
  {
    title: 'Show server logs',
    value: {
      isRunning: true,
      requiresValidation: false,
      func: logContainer,
    },
  },
  {
    title: 'Update dumpfile',
    value: {
      isRunning: true,
      requiresValidation: false,
      func: overwriteDumpfile,
    },
  },
  {
    title: 'Create new dumpfile',
    value: {
      isRunning: true,
      requiresValidation: false,
      func: createNewDump,
    },
  },
  {
    title: 'Import database',
    value: {
      isRunning: true,
      requiresValidation: false,
      func: redumpWithSelectedDumpfile,
    },
  },
];
const actionSelect = async function (config: InstanceConfig): Promise<prompts.Answers<'action'>> {
  return await prompts({
    type: 'select',
    name: 'action',
    message: `Select an operation to perform for ${config.instanceName}`,
    choices: actionMap,
    initial: 0,
  });
};

(async (): Promise<void> => {
  try {
    const chosenConfig = await iselect(config);

    const {
      action: { func, isRunning, requiresValidation },
    } = await actionSelect(chosenConfig);

    if (requiresValidation) {
      try {
        validateConfig(chosenConfig, workingdir);
      } catch (error) {
        process.exit(1);
      }
    }
    const finalConfig: FinalInstanceConfig = buildFinalConfig(chosenConfig, workingdir, topdir);

    isContainerRunning(finalConfig.containerName, (running: boolean) => {
      if (!running && isRunning) {
        logger.error(
          `Container ${logger.yellow(finalConfig.containerName)} isn't running. Aborting.`,
        );
        process.exit(1);
      }

      if (running && !isRunning) {
        logger.error(
          `Container ${logger.yellow(finalConfig.containerName)} is already running. Aborting.`,
        );
        process.exit(1);
      }

      func(finalConfig);
    });
  } catch (e) {
    console.log('\nBye.');
  }
})();
