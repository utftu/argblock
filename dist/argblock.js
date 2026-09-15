// src/positional/positional.ts
var validatePositionals = (positionals) => {
  for (let i = 1;i < positionals.length; i++) {
    const pos = positionals[i];
    const prev = positionals[i - 1];
    if (prev.variadic) {
      throw new Error(`Variadic positional <...${prev.name}> must be last`);
    }
    if (!prev.required && pos.required) {
      throw new Error(`Required positional <${pos.name}> cannot follow optional <${prev.name}>`);
    }
  }
};

// src/block.ts
var createDefaultMatcher = (name) => (elems) => {
  if (name === elems[0]) {
    return { elems: elems.slice(1), match: true };
  }
  return { elems, match: false };
};

class Block {
  arg;
  params;
  positionals;
  description;
  matcher;
  data;
  link;
  children = [];
  constructor({
    arg,
    params,
    positionals = [],
    description,
    matcher,
    children = [],
    data = {},
    link
  }) {
    validatePositionals(positionals);
    this.arg = arg;
    this.params = params;
    this.positionals = positionals;
    this.description = description;
    this.children = children;
    this.data = data;
    this.link = link;
    if (matcher) {
      this.matcher = matcher;
    } else {
      this.matcher = createDefaultMatcher(this.arg);
    }
  }
  findParam(name) {
    for (const param of this.params) {
      if (param.name === name) {
        return param;
      }
    }
  }
  findShortParam(name) {
    for (const param of this.params) {
      if (param.short === name) {
        return param;
      }
    }
  }
}

// src/parse-param/full.ts
var checkFull = (arg) => {
  if (arg.startsWith("--")) {
    return true;
  }
  return false;
};
var parseFull = (arg1, rest, block) => {
  const [arg2 = "", ...remaining] = rest;
  if (arg1.includes("=")) {
    const { name: name2, value } = getNameFromEq(arg1.slice(2));
    const param2 = block.findParam(name2);
    if (!param2) {
      throw new Error("Unknown param " + arg1);
    }
    return { values: [{ param: param2, value }], elems: rest };
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

// src/parse-param/no.ts
var checkNo = (arg1) => {
  if (arg1.startsWith("--no-")) {
    return true;
  }
  return false;
};
var parseNo = (arg1, rest, block) => {
  const param = block.findParam(arg1.slice(5));
  if (!param) {
    throw new Error("Unknown param " + arg1);
  }
  return { values: [{ param, value: "0" }], elems: rest };
};

// src/parse-param/short.ts
var checkShort = (arg) => {
  if (arg.startsWith("-") && !arg.startsWith("--")) {
    return true;
  }
  return false;
};
var parseShort = (arg1, rest, block) => {
  const [arg2 = "", ...remaining] = rest;
  if (arg1.length > 2) {
    if (arg1.includes("=")) {
      const { name: name2, value } = getNameFromEq(arg1.slice(1));
      const param2 = block.findShortParam(name2);
      if (!param2) {
        throw new Error("Unknown param " + arg1);
      }
      return { values: [{ param: param2, value }], elems: rest };
    }
    const values = arg1.slice(1).split("").map((name2) => {
      const param2 = block.findShortParam(name2);
      if (!param2) {
        throw new Error("Unknown param: " + arg1 + " No param property for shortkey: " + name2);
      }
      return { param: param2, value: "1" };
    });
    return { values, elems: rest };
  }
  const name = arg1[1];
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

// src/parse-param/parse-param.ts
var getNameFromEq = (str) => {
  const [name, ...values] = str.split("=");
  return {
    name,
    value: values.join("=")
  };
};
var checkBoolValue = (str) => {
  if (str === "1" || str === "0" || str === "true" || str === "false") {
    return true;
  }
  return false;
};
var checkParam = (arg, block) => {
  if (checkNo(arg)) {
    return block.findParam(arg.slice(5)) !== undefined;
  }
  if (checkShort(arg)) {
    return block.findShortParam(arg[1]) !== undefined;
  }
  return block.findParam(getNameFromEq(arg.slice(2)).name) !== undefined;
};
var parseParam = (elems, block) => {
  const [arg1 = ""] = elems;
  const rest = elems.slice(1);
  if (checkNo(arg1))
    return parseNo(arg1, rest, block);
  if (checkShort(arg1))
    return parseShort(arg1, rest, block);
  if (checkFull(arg1))
    return parseFull(arg1, rest, block);
  return null;
};

// src/convert/convert.ts
var convertParam = (value, param, originalParam) => {
  if (param.type === "boolean") {
    if (!checkBoolValue(value)) {
      throw new Error("Param must be boolean: " + originalParam);
    }
    if (value === "1" || value === "true") {
      return true;
    }
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
  throw new Error("Unknown param type: " + param.type);
};
function convertDefault(value, param) {
  return convertParam(value, param, `default for --${param.name}`);
}

// src/parse/global-arg.ts
var globalArg = "__globalArg";

// src/parse/parse.ts
function resolveRoot(blocks) {
  if (blocks.length === 1 && blocks[0].arg === globalArg) {
    return blocks[0];
  }
  return new Block({
    arg: globalArg,
    params: [],
    description: "",
    children: blocks
  });
}
function findLink(block) {
  if (block.link === undefined) {
    return;
  }
  const link = block.children.find((child) => child.arg === block.link);
  if (link === undefined) {
    throw new Error(`Command link "${block.link}" not found`);
  }
  return link;
}
function matchChild(rest, children) {
  for (const child of children) {
    const { match, elems } = child.matcher(rest);
    if (match) {
      return { block: child, rest: elems };
    }
  }
  return;
}
function checkRequiredPositionals(entry) {
  for (const positional of entry.block.positionals) {
    if (!positional.required) {
      continue;
    }
    if (positional.name in entry.positionals) {
      continue;
    }
    const label = positional.variadic ? `...${positional.name}` : positional.name;
    throw new Error(`Required positional <${label}> is missing`);
  }
}
function checkInsideLink(parsedBlocks) {
  if (parsedBlocks.length !== 2) {
    return false;
  }
  const link = findLink(parsedBlocks[0].block);
  if (link === undefined) {
    return false;
  }
  return parsedBlocks[1].block === link;
}
function enterBlock(parsedBlocks, { block, arg }) {
  checkRequiredPositionals(parsedBlocks.at(-1));
  parsedBlocks.push({ arg, params: {}, positionals: {}, block });
}
function readParam(entry, rest) {
  const token = rest[0];
  const { values, elems } = parseParam(rest, entry.block);
  for (const { param, value } of values) {
    if (param.name in entry.params) {
      throw new Error("Param duplicated: " + token);
    }
    entry.params[param.name] = convertParam(value, param, token);
  }
  return elems;
}
function findFreePositional(entry) {
  for (const positional of entry.block.positionals) {
    if (positional.variadic || !(positional.name in entry.positionals)) {
      return positional;
    }
  }
  return;
}
function readPositional(entry, token) {
  const positional = findFreePositional(entry);
  if (positional === undefined) {
    return false;
  }
  if (!positional.variadic) {
    entry.positionals[positional.name] = token;
    return true;
  }
  const list = entry.positionals[positional.name] ?? [];
  list.push(token);
  entry.positionals[positional.name] = list;
  return true;
}
function readSeparated(parsedBlocks, tokens) {
  for (const token of tokens) {
    while (!readPositional(parsedBlocks.at(-1), token)) {
      const link = findLink(parsedBlocks.at(-1).block);
      if (link === undefined) {
        throw new Error(`Unknown arg: ${token}`);
      }
      enterBlock(parsedBlocks, { block: link, arg: link.arg });
    }
  }
}
function applyDefaults(entry) {
  for (const param of entry.block.params) {
    if (param.defaultValue === undefined) {
      continue;
    }
    if (param.name in entry.params) {
      continue;
    }
    entry.params[param.name] = convertDefault(String(param.defaultValue), param);
  }
}
function parse(args, blocks, { onHelp } = {}) {
  if (blocks.length === 0) {
    throw new Error("Empty blocks");
  }
  const root = resolveRoot(blocks);
  const parsedBlocks = [
    { arg: root.arg, params: {}, positionals: {}, block: root }
  ];
  let rest = args;
  while (rest.length > 0) {
    const current = parsedBlocks.at(-1);
    const token = rest[0];
    if (token === "--help") {
      onHelp?.(current.block);
      return [];
    }
    if (token === "--") {
      readSeparated(parsedBlocks, rest.slice(1));
      rest = [];
      continue;
    }
    const link2 = findLink(current.block);
    if (token.startsWith("-")) {
      const root2 = parsedBlocks[0];
      if (checkInsideLink(parsedBlocks) && checkParam(token, root2.block)) {
        rest = readParam(root2, rest);
        continue;
      }
      if (link2 !== undefined && !checkParam(token, current.block) && checkParam(token, link2)) {
        enterBlock(parsedBlocks, { block: link2, arg: link2.arg });
        continue;
      }
      rest = readParam(current, rest);
      continue;
    }
    const matched = matchChild(rest, current.block.children);
    if (matched !== undefined) {
      const consumed = rest.slice(0, rest.length - matched.rest.length);
      enterBlock(parsedBlocks, {
        block: matched.block,
        arg: consumed.join(" ")
      });
      rest = matched.rest;
      continue;
    }
    if (readPositional(current, token)) {
      rest = rest.slice(1);
      continue;
    }
    if (link2 === undefined) {
      throw new Error(`Unknown arg: ${token}`);
    }
    enterBlock(parsedBlocks, { block: link2, arg: link2.arg });
  }
  const link = findLink(parsedBlocks.at(-1).block);
  if (link !== undefined) {
    enterBlock(parsedBlocks, { block: link, arg: link.arg });
  }
  checkRequiredPositionals(parsedBlocks.at(-1));
  for (const entry of parsedBlocks) {
    applyDefaults(entry);
  }
  return parsedBlocks;
}

// src/param.ts
class Param {
  name;
  type;
  short;
  defaultValue;
  description;
  constructor({
    type,
    short,
    name,
    defaultValue,
    description = ""
  }) {
    this.type = type;
    this.short = short;
    this.name = name;
    this.defaultValue = defaultValue;
    this.description = description;
  }
}

// src/parse/help.ts
function formatPositional(positional) {
  const label = positional.variadic ? `...${positional.name}` : positional.name;
  return positional.required ? `<${label}>` : `[${label}]`;
}
function withDescription(label, description) {
  return description ? `${label} - ${description}` : label;
}
function formatDefault(param) {
  if (param.defaultValue === undefined) {
    return "";
  }
  return ` (default: ${convertDefault(String(param.defaultValue), param)})`;
}
function formatHelp(block) {
  const lines = [];
  if (block.children.length) {
    lines.push("commands:");
    for (const child of block.children) {
      lines.push(`  ${withDescription(child.arg, child.description)}`);
    }
  }
  if (block.positionals.length) {
    if (lines.length)
      lines.push("");
    lines.push("positionals:");
    for (const positional of block.positionals) {
      lines.push(`  ${withDescription(formatPositional(positional), positional.description)}`);
    }
  }
  if (block.params.length) {
    if (lines.length)
      lines.push("");
    lines.push("params:");
    for (const param of block.params) {
      const names = param.short ? `--${param.name}, -${param.short}` : `--${param.name}`;
      lines.push(`  ${withDescription(`${names} ${param.type}`, param.description)}${formatDefault(param)}`);
    }
  }
  return lines.join(`
`);
}

// src/cli/parse-command.ts
function getCommandName(elems) {
  const name = elems[0];
  if (!name || name.startsWith("<") || name.startsWith("[")) {
    throw new Error("Command name is missing");
  }
  return { name, elems: elems.slice(1) };
}
function parseArg(token) {
  const required = token.startsWith("<");
  const optional = token.startsWith("[");
  if (!required && !optional) {
    throw new Error(`Unknown token ${token}, expected <arg> or [arg]`);
  }
  const inner = token.slice(1, -1);
  const variadic = inner.startsWith("...");
  const name = variadic ? inner.slice(3) : inner;
  if (!name) {
    throw new Error(`Arg name is empty in ${token}`);
  }
  return { name, required, variadic };
}
function getArgs(elems) {
  const args = elems.map(parseArg);
  validatePositionals(args);
  return args;
}
function parseCommand(pattern, _description) {
  const elems = pattern.trim().split(/\s+/);
  const { name, elems: rest } = getCommandName(elems);
  const args = getArgs(rest);
  return { name, args };
}

// src/cli/parse-param.ts
var types = {
  number: ["number", "num", "int"],
  string: ["string", "str"],
  boolean: ["boolean", "bool"]
};
function findType(value) {
  for (const key in types) {
    const arr = types[key];
    if (arr.includes(value)) {
      return key;
    }
  }
  return;
}
function getParamNames(elems) {
  let full;
  let short;
  for (let i = 0;i < elems.length; i++) {
    const elem = elems[i];
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
        elems: elems.slice(i)
      };
    }
    throw new Error(`Unknown property ${elem}, should be param`);
  }
  throw new Error("Only params, no types");
}
function getType(elems) {
  if (elems.length === 0) {
    throw new Error("No type");
  }
  const elem = elems[0];
  const localType = findType(elem);
  if (!localType) {
    throw new Error(`Unknown type ${elem}`);
  }
  return { elems: elems.slice(1), type: localType };
}
function getDefault(elems) {
  if (elems.length === 0) {
    return;
  }
  return {
    defaultValue: elems[0],
    elems: elems.slice(1)
  };
}
function parseParam2(pattern, description) {
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
    description
  });
  if (defaultValue !== undefined) {
    param.defaultValue = convertDefault(defaultValue, param);
  }
  return param;
}

// src/cli/cli.ts
class Cli {
  root;
  current;
  constructor({
    root,
    commandLink
  } = {}) {
    this.root = root ?? new Block({
      arg: globalArg,
      params: [],
      description: "",
      children: []
    });
    this.current = this.root;
    if (commandLink !== undefined) {
      this.root.link = commandLink;
    }
  }
  static new() {
    return new Cli;
  }
  command(pattern, description = "") {
    const { name, args } = parseCommand(pattern, description);
    const block = new Block({
      arg: name,
      params: [],
      positionals: args,
      description,
      children: []
    });
    this.root.children.push(block);
    this.current = block;
    return this;
  }
  block(pattern, description, build) {
    const { name, args } = parseCommand(pattern, description);
    const block = new Block({
      arg: name,
      params: [],
      positionals: args,
      description,
      children: []
    });
    this.root.children.push(block);
    build(new Cli({ root: block }));
    this.current = block;
    return this;
  }
  param(pattern, description) {
    const param = parseParam2(pattern, description);
    this.current.params.push(param);
    return this;
  }
  action(handler) {
    if (this.current === this.root && this.root.link !== undefined) {
      throw new Error(`Global action conflicts with command link "${this.root.link}"`);
    }
    this.current.data.action = handler;
    return this;
  }
  parse(args) {
    return parse(args, [this.root], {
      onHelp: (block) => console.log(formatHelp(block))
    });
  }
  run(args) {
    const result = this.parse(args);
    const matched = result.at(-1);
    if (!matched)
      return;
    const handler = matched.block.data.action;
    if (!handler) {
      const label = matched.arg === globalArg ? "the global command" : matched.arg;
      throw new Error(`No action defined for ${label}`);
    }
    handler({ ...matched, globalParams: result[0].params });
  }
}
export {
  parse,
  globalArg,
  Param,
  Cli,
  Block
};
