import type { Block } from "./block.ts";
import type { Param } from "./param.ts";

export const getNameFromEq = (str: string) => {
  const [name, ...values] = str.slice(2).split("=");

  return {
    name: name as string,
    value: values.join("="),
  };
};

const throwErrorParam = (arg: string): never => {
  throw new Error("Unknown param " + arg);
};

export const getParam = (name: string, block: Block): Param => {
  const param = block.findParam(name);

  if (!param) {
    throwErrorParam(name);
  }

  return param!;
};

export const getShortParam = (name: string, block: Block): Param => {
  const param = block.findShortParam(name);

  if (!param) {
    throwErrorParam(name);
  }

  return param!;
};
