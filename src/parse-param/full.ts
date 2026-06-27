import type { Block } from "../block.ts";
import { checkBoolValue, getNameFromEq, type ParseReturn } from "./parse-param.ts";

export const checkFull = (arg: string) => {
  if (arg.startsWith("--")) {
    return true;
  }

  return false;
};

export const parseFull = (
  arg1: string,
  rest: string[],
  block: Block
): ParseReturn => {
  const [arg2 = "", ...remaining] = rest;

  if (arg1.includes("=")) {
    const { name, value } = getNameFromEq(arg1.slice(2));

    const param = block.findParam(name);
    if (!param) {
      throw new Error("Unknown param " + arg1);
    }

    return { values: [{ param, value }], elems: rest };
  }

  const name = arg1.slice(2);
  const param = block.findParam(name);
  if (!param) {
    throw new Error("Unknown param " + arg1);
  }

  if (param.type === "boolean") {
    if (checkBoolValue(arg2)) {
      return { values: [{ param, value: arg2 }], elems: remaining };
    }

    return { values: [{ param, value: "1" }], elems: rest };
  }

  return { values: [{ param, value: arg2 }], elems: remaining };
};
