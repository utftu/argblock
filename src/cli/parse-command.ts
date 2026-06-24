export type PositionalDef = {
  name: string;
  required: boolean;
};

export type CommandPattern = {
  name: string;
  positionals: PositionalDef[];
};

export const parseCommandPattern = (pattern: string): CommandPattern => {
  const tokens = pattern.trim().split(/\s+/);
  const first = tokens[0] ?? "";

  let name = "";
  let startIndex = 0;

  if (!first.startsWith("<") && !first.startsWith("[")) {
    name = first;
    startIndex = 1;
  }

  const positionals: PositionalDef[] = [];
  for (const token of tokens.slice(startIndex)) {
    if (token.startsWith("<") && token.endsWith(">")) {
      positionals.push({ name: token.slice(1, -1), required: true });
    } else if (token.startsWith("[") && token.endsWith("]")) {
      positionals.push({ name: token.slice(1, -1), required: false });
    }
  }

  return { name, positionals };
};
