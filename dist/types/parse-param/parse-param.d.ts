import type { Block } from "../block.ts";
import type { Param } from "../param.ts";
export type ParseReturn = {
    values: {
        param: Param;
        value: string;
    }[];
    elems: string[];
};
export declare const getNameFromEq: (str: string) => {
    name: string;
    value: string;
};
export declare const checkBoolValue: (str: string) => boolean;
export declare const checkParam: (arg: string, block: Block) => boolean;
export declare const parseParam: (elems: string[], block: Block) => ParseReturn;
