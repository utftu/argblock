import type { Block } from "../block.ts";
import { type ParseReturn } from "./parse-param.ts";
export declare const checkShort: (arg: string) => boolean;
export declare const parseShort: (arg1: string, rest: string[], block: Block) => ParseReturn;
