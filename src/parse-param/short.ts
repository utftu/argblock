import type { Block } from "../block.ts";
import { checkBoolValue, getNameFromEq, type ParseReturn } from "./parse-param.ts";

export const checkShort = (arg: string) => {
  if (arg.startsWith("-") && !arg.startsWith("--")) {
    return true;
  }

  return false;
};

export const parseShort = (
  arg1: string,
  rest: string[],
  block: Block
): ParseReturn => {
  const [arg2 = "", ...remaining] = rest;

  if (arg1.length > 2) {
    if (arg1.includes("=")) {
      const { name, value } = getNameFromEq(arg1.slice(1));

      const param = block.findShortParam(name);
      if (!param) {
        throw new Error("Unknown param " + arg1);
      }

      return { values: [{ param, value }], elems: rest };
    }

    // -abc
    const values = arg1
      .slice(1)
      .split("")
      .map((name) => {
        const param = block.findShortParam(name);
        if (!param) {
          throw new Error(
            "Unknown param: " +
              arg1 +
              " No param property for shortkey: " +
              name
          );
        }
        return { param, value: "1" };
      });

    return { values, elems: rest };
  }

  const name = arg1[1]!;
  const param = block.findShortParam(name);
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
