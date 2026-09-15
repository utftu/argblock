import type { Block } from "../block.ts";
import type { ParseReturn } from "./parse-param.ts";
export declare const checkNo: (arg1: string) => boolean;
export declare const parseNo: (arg1: string, rest: string[], block: Block) => ParseReturn;
