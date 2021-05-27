import { execp } from '../utils';
import { dockerScriptsDirpath } from '../constants';
import { PromiseWithChild } from 'child_process';
import { FinalInstanceConfig } from '../types';

export const commit = (
  config: FinalInstanceConfig,
): PromiseWithChild<{ stdout: string; stderr: string }> => {
  return execp(
    `docker commit --change='CMD ["${dockerScriptsDirpath}/run.sh"]' ${config.containerName} ${config.snapshotImage}:latest`,
  );
};
