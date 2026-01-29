import type { FinalInstanceConfig } from 'src/types';
/**
 * Returns a list of host ports currently being used by existing docker containers,
 * regardless of the containers' status.
 *
 * @returns An array of port numbers (as numbers) that are bound to host ports
 */
export declare const getPortsInUse: () => number[];
export declare const down: (config: FinalInstanceConfig) => void;
