import { Block } from "../block.ts";
import { Param } from "../param.ts";
import { parseCommandPattern, type PositionalDef } from "./parse-command.ts";
import { parseOptionFlags } from "./parse-option.ts";

export class Command {
  readonly name: string;
  readonly pattern: string;
  readonly positionals: PositionalDef[];
  readonly block: Block;

  private _action?: (...args: unknown[]) => unknown;

  constructor(pattern: string, description: string) {
    this.pattern = pattern;
    const { name, positionals } = parseCommandPattern(pattern);
    this.name = name;
    this.positionals = positionals;
    this.block = new Block({ arg: name || "*", params: [], description });
  }

  option(
    flags: string,
    description: string = "",
    config?: { default?: unknown }
  ): this {
    const def = parseOptionFlags(flags, description, config);
    const param = new Param({
      name: def.name,
      short: def.short,
      type: def.hasValue ? "string" : "boolean",
      defaultValue: def.defaultValue as string | undefined,
      description: def.description,
    });
    this.block.params.push(param);
    return this;
  }

  action(fn: (...args: unknown[]) => unknown): this {
    this._action = fn;
    return this;
  }

  invoke(positionalValues: string[], options: Record<string, unknown>): void {
    this._action?.(...positionalValues, options);
  }
}
