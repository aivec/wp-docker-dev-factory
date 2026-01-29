export declare const containerStatus: (container: string) => "running" | "exited" | "paused" | "created" | "restarting" | null;
export declare const isRunning: (container: string) => boolean;
