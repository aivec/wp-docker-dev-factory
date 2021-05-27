import { execSync } from 'child_process';

export const isRunning = (container: string): boolean => {
  try {
    const res = execSync(`docker inspect -f '{{.State.Status}}' ${container}`, { stdio: 'pipe' })
      .toString()
      .trim();
    if (res === 'running') {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
