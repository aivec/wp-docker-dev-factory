import { execSync } from 'child_process';

/**
 * Returns a list of host ports currently being used by existing docker containers,
 * regardless of the containers' status.
 *
 * @returns An array of port numbers (as numbers) that are bound to host ports
 */
export const getPortsInUse = (): number[] => {
  try {
    // Get all container IDs (including stopped containers)
    const containerIds = execSync('docker ps -a -q', { stdio: 'pipe' })
      .toString()
      .trim()
      .split('\n')
      .filter((id) => id.length > 0);

    if (containerIds.length === 0) {
      return [];
    }

    const ports = new Set<number>();

    // For each container, inspect port bindings
    for (const containerId of containerIds) {
      try {
        // Get port bindings using docker inspect
        // This extracts HostPort from all port bindings
        const portOutput = execSync(
          `docker inspect -f '{{range $p, $conf := .NetworkSettings.Ports}}{{range $conf}}{{if .HostPort}}{{.HostPort}} {{end}}{{end}}{{end}}' ${containerId}`,
          { stdio: 'pipe' },
        )
          .toString()
          .trim();

        // Parse ports from the output
        const containerPorts = portOutput
          .split(/\s+/)
          .filter((port) => port.length > 0)
          .map((port) => parseInt(port, 10))
          .filter((port) => !isNaN(port) && port > 0);

        containerPorts.forEach((port) => ports.add(port));
      } catch (error) {
        // Skip containers that can't be inspected (might have been removed)
        continue;
      }
    }

    return Array.from(ports).sort((a, b) => a - b);
  } catch (error) {
    // If docker command fails, return empty array
    return [];
  }
};
