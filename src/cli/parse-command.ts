export type Arg = {
  name: string;
  required: boolean;
  variadic: boolean;
};

type CommandDef = {
  name: string;
  args: Arg[];
};

function getCommandName(elems: string[]) {
  const name = elems[0];

  if (!name || name.startsWith("<") || name.startsWith("[")) {
    throw new Error("Command name is missing");
  }

  return { name, elems: elems.slice(1) };
}

function parseArg(token: string): Arg {
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

function getArgs(elems: string[]) {
  const args: Arg[] = [];

  for (let i = 0; i < elems.length; i++) {
    const arg = parseArg(elems[i]!);

    if (i > 0 && args[i - 1]!.variadic) {
      throw new Error("Variadic arg must be last");
    }

    if (i > 0 && !args[i - 1]!.required && arg.required) {
      throw new Error("Required arg cannot follow optional arg");
    }

    args.push(arg);
  }

  return args;
}

export function parseCommand(pattern: string, _description?: string): CommandDef {
  const elems = pattern.trim().split(/\s+/);

  const { name, elems: rest } = getCommandName(elems);
  const args = getArgs(rest);

  return { name, args };
}
