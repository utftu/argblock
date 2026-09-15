import type { Block } from "../block.ts";
import { type ParseReturn } from "./parse-param.ts";
export declare const checkFull: (arg: string) => boolean;
export declare const parseFull: (arg1: string, rest: string[], block: Block) => ParseReturn;
