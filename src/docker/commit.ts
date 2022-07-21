import { execp } from '../utils';
import { debug } from '../logger';
import { dockerScriptsDirpath } from '../constants';
import { PromiseWithChild } from 'child_process';
import { FinalInstanceConfig } from '../types';

export const commit = (
  config: FinalInstanceConfig,
): PromiseWithChild<{ stdout: string; stderr: string }> => {
  const command = `docker commit --change='CMD ["${dockerScriptsDirpath}/run.sh"]' ${config.containerName} ${config.snapshotImage}:latest`;
  debug('Executing the following command:', command);
  return execp(command);
};
