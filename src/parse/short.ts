import type { Block } from "../block.ts";
import { checkBoolValue, getNameFromEq, type ParseReturn } from "./parse.ts";

export const checkShort = (arg: string) => {
  if (arg.startsWith("-") && !arg.startsWith("--")) {
    return true;
  }

  return false;
};

export const parseShort = (
  arg1: string,
  arg2: string,
  block: Block
): ParseReturn => {
  if (arg1.length > 2) {
    // -v=hello
    if (arg1.includes("=")) {
      const { name, value } = getNameFromEq(arg1.slice(1));

      const param = block.findShortParam(name);
      if (!param) {
        throw new Error("Unknown param " + arg1);
      }

      return { values: [{ param, value }], jumpNext: 0 };
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

    return { values, jumpNext: 0 };
  }

  const name = arg1[1]!;
  const param = block.findShortParam(name);
  if (!param) {
    throw new Error("Unknown param " + arg1);
  }

  if (param.type === "boolean") {
    // -a 1
    if (checkBoolValue(arg2)) {
      return { values: [{ param, value: arg2 }], jumpNext: 1 };
    }

    // -a
    return { values: [{ param, value: "1" }], jumpNext: 0 };
  }

  // -a hello
  return { values: [{ param, value: arg2 }], jumpNext: 1 };
};
