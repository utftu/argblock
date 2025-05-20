import type { Block } from "../block.ts";
import { checkBoolValue, getNameFromEq, type ParseReturn } from "./parse.ts";

export const checkFull = (arg: string) => {
  if (arg.startsWith("--")) {
    return true;
  }

  return false;
};

export const parseFull = (
  arg1: string,
  arg2: string,
  block: Block
): ParseReturn => {
  if (arg1.includes("=")) {
    const { name, value } = getNameFromEq(arg1.slice(2));

    const param = block.findParam(name);
    if (!param) {
      throw new Error("Unknown param " + arg1);
    }

    return { values: [{ param, value }], jumpNext: 0 };
  }

  const name = arg1.slice(2);
  const param = block.findParam(name);
  if (!param) {
    throw new Error("Unknown param " + arg1);
  }

  if (param.type === "boolean") {
    // --hello 1
    if (checkBoolValue(arg2)) {
      return { values: [{ param, value: arg2 }], jumpNext: 1 };
    }

    return { values: [{ param, value: "1" }], jumpNext: 0 };
  }

  //--hello world
  return { values: [{ param, value: arg2 }], jumpNext: 1 };
};
