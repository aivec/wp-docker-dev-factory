import { execSync, PromiseWithChild } from 'child_process';
import { execp } from '../utils';

export const imageExists = (image: string): boolean => {
  try {
    execSync(`docker image inspect ${image}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
};

export const save = (
  tarPath: string,
  savedImage: string,
): PromiseWithChild<{ stdout: string; stderr: string }> => {
  return execp(`docker image save -o ${tarPath} ${savedImage}`);
};
