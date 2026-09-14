import { Param } from "../param.ts";
import { convertDefault } from "../convert/convert.ts";

const types = {
  number: ["number", "num", "int"],
  string: ["string", "str"],
  boolean: ["boolean", "bool"],
};

function findType(value: string): keyof typeof types | undefined {
  for (const key in types) {
    const arr = types[key as keyof typeof types];

    if (arr.includes(value)) {
      return key as keyof typeof types;
    }
  }
  return undefined;
}

function getParamNames(elems: string[]) {
  let full: string | undefined;
  let short: string | undefined;

  for (let i = 0; i < elems.length; i++) {
    const elem = elems[i]!;

    if (elem.startsWith("--")) {
      full = elem.slice(2);
      continue;
    } else if (elem.startsWith("-")) {
      short = elem.slice(1);
      if (short.length !== 1) {
        throw new Error(`Short param should be a single letter, got ${short}`);
      }
      continue;
    }

    if (full) {
      return {
        full,
        short,
        elems: elems.slice(i),
      };
    }

    throw new Error(`Unknown property ${elem}, should be param`);
  }

  throw new Error("Only params, no types");
}

function getType(elems: string[]) {
  if (elems.length === 0) {
    throw new Error("No type");
  }
  const elem = elems[0]!;
  const localType = findType(elem);

  if (!localType) {
    throw new Error(`Unknown type ${elem}`);
  }

  return { elems: elems.slice(1), type: localType };
}

function getDefault(
  elems: string[],
): { defaultValue: string; elems: string[] } | undefined {
  if (elems.length === 0) {
    return;
  }

  return {
    defaultValue: elems[0]!,
    elems: elems.slice(1),
  };
}

export function parseParam(pattern: string, description?: string) {
  const trimmed = pattern.trim();

  if (!trimmed.startsWith("-")) {
    throw new Error("Unknown format, option should start with -");
  }

  let elems = trimmed.split(" ").filter((part) => part !== " ");

  const { full, short, elems: afterNames } = getParamNames(elems);
  elems = afterNames;

  const { type, elems: afterType } = getType(elems);
  elems = afterType;

  const defaultResult = getDefault(elems);
  let defaultValue;
  if (defaultResult) {
    elems = defaultResult.elems;
    defaultValue = defaultResult.defaultValue;
  }

  if (elems.length) {
    throw new Error(`Unknown props ${elems.join(" ")}`);
  }

  const param = new Param({
    type,
    name: full,
    short,
    description,
  });

  if (defaultValue !== undefined) {
    param.defaultValue = convertDefault(defaultValue, param);
  }

  return param;
}
