
import type { Block } from "../block.ts";
import type { ParseReturn } from "./parse-param.ts";

export const checkNo = (arg1: string) => {
  if (arg1.startsWith("--no-")) {
    return true;
  }
  return false;
};

export const parseNo = (arg1: string, block: Block): ParseReturn => {
  const param = block.findParam(arg1.slice(5));
  if (!param) {
    throw new Error("Unknown param " + arg1);
  }

  return { values: [{ param, value: "0" }], jumpNext: 0 };
};
