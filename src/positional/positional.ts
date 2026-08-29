import type { Positional } from "../block.ts";

export const validatePositionals = (positionals: Positional[]): void => {
  for (let i = 1; i < positionals.length; i++) {
    const pos = positionals[i]!;
    const prev = positionals[i - 1]!;

    if (prev.variadic) {
      throw new Error(`Variadic positional <...${prev.name}> must be last`);
    }
    if (!prev.required && pos.required) {
      throw new Error(
        `Required positional <${pos.name}> cannot follow optional <${prev.name}>`,
      );
    }
  }
};
