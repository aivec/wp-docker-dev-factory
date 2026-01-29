import { PromiseWithChild } from 'child_process';
export declare const load: (imagePath: string) => PromiseWithChild<{
    stdout: string;
    stderr: string;
}>;
