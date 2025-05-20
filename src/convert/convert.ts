import { checkBoolValue } from "../parse/parse.ts";
import type { Param } from "../parser.ts";

export const convertParam = (
  value: string,
  param: Param,
  originalParam: string
) => {
  if (param.type === "boolean") {
    if (!checkBoolValue(value)) {
      throw new Error("Param must be boolean: " + originalParam);
    }
    if (value === "1" || value === "true") {
      return true;
    }

    // 0 false
    return false;
  }

  if (param.type === "number") {
    const number = +value;

    if (isFinite(number) === false) {
      throw new Error("Param must be number: " + originalParam);
    }

    return number;
  }

  if (param.type === "string") {
    return value;
  }
};
