import type { Param } from "../param.ts";
export declare const convertParam: (value: string, param: Param, originalParam: string) => string | boolean | number;
export declare function convertDefault(value: string, param: Param): string | boolean | number;
