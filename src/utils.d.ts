import { exec } from 'child_process';
export declare const isObject: (vartocheck: any) => boolean;
export declare const isString: (vartocheck: any) => boolean;
export declare const resolvePathToAbsolute: (contextdirpath: string, p: string) => string;
export declare const execp: typeof exec.__promisify__;
