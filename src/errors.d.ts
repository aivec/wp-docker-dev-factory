export declare const ERR_FILE_NOT_FOUND = "FileNotFound";
export declare const ERR_PROPERTY_REQUIRED = "PropertyRequired";
export declare class GenericError extends Error {
    code: string | number;
    constructor(code: string | number, message: string);
}
