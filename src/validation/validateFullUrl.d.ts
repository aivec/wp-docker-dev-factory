import { InstanceConfig } from '../types';
export declare const PORT_INVALID = "PortInvalid";
export declare const HOST_INVALID = "HostInvalid";
export declare const HOST_OR_PORT_REQUIRED = "HostOrPortRequired";
declare const validateFullUrl: (config: InstanceConfig) => void;
export default validateFullUrl;
