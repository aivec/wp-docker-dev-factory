import { FinalInstanceConfig } from '../types';
export declare const redumpWithSelectedDumpfile: ({ fullUrl, containerName, workingdir, }: FinalInstanceConfig) => Promise<void>;
export declare const overwriteDumpfile: ({ containerName, envvarsMap: { WORDPRESS_DB_NAME }, }: FinalInstanceConfig) => void;
export declare const createNewDump: ({ containerName, envvarsMap: { WORDPRESS_DB_NAME }, }: FinalInstanceConfig) => Promise<void>;
