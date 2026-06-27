import { Param } from "../param.ts";

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
        throw new Error(`Short param shoulb be signle letter, got ${short}`);
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

    throw new Error(`Uknow property ${elem}, should be param`);
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
    throw new Error(`Unknow type ${elem}`);
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
  let strToParse = pattern.trim();

  if (strToParse.startsWith("-") === false) {
    throw new Error("Unknown format, option shoud start with -");
  }

  var elems = strToParse.split(" ").filter((part) => part !== " ");

  var { elems, full, short } = getParamNames(elems);
  var { elems, type } = getType(elems);

  const defaultResult = getDefault(elems);

  var elems = elems;
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
    defaultValue,
    description: description,
  });

  return param;
}
