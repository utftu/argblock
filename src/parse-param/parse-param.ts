import type { Block } from "../block.ts";
import type { Param } from "../param.ts";
import { checkFull, parseFull } from "./full.ts";
import { checkNo, parseNo } from "./no.ts";
import { checkShort, parseShort } from "./short.ts";

export type ParseReturn = {
  values: { param: Param; value: string }[];
  jumpNext: number;
};

export const getNameFromEq = (str: string) => {
  const [name, ...values] = str.split("=");

  return {
    name: name as string,
    value: values.join("="),
  };
};

export const checkBoolValue = (str: string) => {
  if (str === "1" || str === "0" || str === "true" || str === "false") {
    return true;
  }
  return false;
};


export const parseParam = (
  arg1: string,
  arg2: string,
  block: Block
): ParseReturn => {
  if (checkNo(arg1)) {
    return parseNo(arg1, block);
  }

  if (checkShort(arg1)) {
    return parseShort(arg1, arg2, block);
  }

  if (checkFull(arg1)) {
    return parseFull(arg1, arg2, block);
  }

  return null as never;
};
