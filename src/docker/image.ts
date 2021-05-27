import { execSync } from 'child_process';

export const imageExists = (image: string): boolean => {
  try {
    execSync(`docker image inspect ${image}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
};
