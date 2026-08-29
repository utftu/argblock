import type { Positional } from "../block.ts";
import { validatePositionals } from "../positional/positional.ts";

type CommandDef = {
  name: string;
  args: Positional[];
};

function getCommandName(elems: string[]) {
  const name = elems[0];

  if (!name || name.startsWith("<") || name.startsWith("[")) {
    throw new Error("Command name is missing");
  }

  return { name, elems: elems.slice(1) };
}

function parseArg(token: string): Positional {
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

function getArgs(elems: string[]): Positional[] {
  const args = elems.map(parseArg);
  validatePositionals(args);
  return args;
}

export function parseCommand(
  pattern: string,
  _description?: string,
): CommandDef {
  const elems = pattern.trim().split(/\s+/);

  const { name, elems: rest } = getCommandName(elems);
  const args = getArgs(rest);

  return { name, args };
}
