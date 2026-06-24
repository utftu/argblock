import { Block } from "../block.ts";
import { parseParam } from "../parse-param/parse-param.ts";

const checkValueName = (elem: string) => {
  if (elem.at(0) === "[" && elem.at(-1) === "]") {
    return true;
  }

  if (elem.at(0) === "<" && elem.at(-1) === ">") {
    return true;
  }

  if (elem.at(0) === "(" && elem.at(-1) === ")") {
    return true;
  }
};

cli.param("--type -t", "Описание");

// --type, -t, --tip <type>
function parseOption(str: string) {
  let strToParse = str.trim();

  if (strToParse.startsWith("-") === false) {
    throw new Error("Unknown format, option shoud start with -");
  }

  const elems = strToParse.split(" ").filter((part) => part !== " ");

  let short: string | void;
  let long: string | void;
  let name;

  for (let elem of elems) {
    if (elem.endsWith(",")) {
      elem = elem.slice(0, -1);
    }

    if (elem.startsWith("--")) {
      long = elem.slice(2);
      continue;
    } else if (elem.startsWith("-")) {
      short = elem.slice(1);
      if (short.length !== 1) {
        throw new Error("Short param shoub be signle letter");
      }
      continue;
    }

    if (elem.at(0) === "[" && elem.at(-1) === "]") {
      name = elem.slice(1, -1);
    } else if (elem.at(0) === "<" && elem.at(-1) === ">") {
      name = elem.slice(1, -1);
    }
  }

  // const block = new Block({
  //   arg: '',
  //   params: []
  // })
}
