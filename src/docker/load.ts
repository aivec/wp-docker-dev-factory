import { execp } from '../utils';
import { PromiseWithChild } from 'child_process';

export const load = (imagePath: string): PromiseWithChild<{ stdout: string; stderr: string }> => {
  return execp(`docker load -i ${imagePath}`);
};
