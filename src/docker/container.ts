import { execSync } from 'child_process';

export const containerStatus = (
  container: string,
): 'running' | 'exited' | 'paused' | 'created' | 'restarting' | null => {
  try {
    const res = execSync(`docker inspect -f '{{.State.Status}}' ${container}`, {
      stdio: 'pipe',
    })
      .toString()
      .trim()
      .replace(/^\'|\'$/g, '');
    return res as 'running' | 'exited' | 'paused' | 'created' | 'restarting';
  } catch (error) {
    return null;
  }
};

export const isRunning = (container: string): boolean => {
  return containerStatus(container) === 'running';
};
