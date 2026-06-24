import { Block } from "../block.ts";
import { Param } from "../param.ts";
import { parseParam } from "../parse-param/parse-param.ts";
import { convertParam } from "../convert/convert.ts";
import { Command } from "./command.ts";
import { parseOptionFlags } from "./parse-option.ts";
import { printCommandHelp, printGlobalHelp } from "./help.ts";

export class Cli {
  private name: string;
  private _version?: string;
  private commands: Command[] = [];
  private globalParams: Param[] = [];
  private globalBlock: Block;

  constructor(name: string = "") {
    this.name = name;
    this.globalBlock = new Block({
      arg: "__global__",
      params: this.globalParams,
      description: "",
    });
  }

  command(pattern: string, description: string = ""): Command {
    const cmd = new Command(pattern, description);
    this.commands.push(cmd);
    return cmd;
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
    this.globalParams.push(param);
    return this;
  }

  version(v: string): this {
    this._version = v;
    return this;
  }

  help(): this {
    return this;
  }

  parse(argv: string[] = process.argv.slice(2)): void {
    if (this._version && (argv.includes("--version") || argv.includes("-V"))) {
      console.log(this._version);
      return;
    }

    const helpRequested =
      argv.includes("--help") || argv.includes("-h");

    // Find named command
    let cmd: Command | undefined;
    let cmdArgIndex = -1;

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i]!;
      if (arg.startsWith("-")) continue;

      const found = this.commands.find((c) => c.name === arg);
      if (found) {
        cmd = found;
        cmdArgIndex = i;
        break;
      }
    }

    // Fallback: default command (no name) or catch-all
    if (!cmd) {
      cmd =
        this.commands.find((c) => c.name === "") ??
        this.commands.find((c) => c.name === "*");
    }

    if (helpRequested) {
      if (cmd && cmdArgIndex !== -1) {
        printCommandHelp(this.name, cmd, this.globalParams);
      } else {
        printGlobalHelp(this.name, this.commands, this.globalParams);
      }
      return;
    }

    if (!cmd) {
      printGlobalHelp(this.name, this.commands, this.globalParams);
      return;
    }

    // Build a merged block: global params + command params
    const mergedBlock = new Block({
      arg: "__merged__",
      params: [...this.globalParams, ...cmd.block.params],
      description: "",
    });

    // Separate remaining argv into flags and positionals
    const remaining = argv.filter((_, i) => i !== cmdArgIndex);
    const options: Record<string, unknown> = {};
    const positionalValues: string[] = [];

    for (let i = 0; i < remaining.length; i++) {
      const arg = remaining[i]!;

      if (arg.startsWith("-")) {
        const nextArg = remaining[i + 1] ?? "";
        const { jumpNext, values } = parseParam(arg, nextArg, mergedBlock);
        for (const { param, value } of values) {
          options[param.name] = convertParam(value, param, arg);
        }
        i += jumpNext;
      } else {
        positionalValues.push(arg);
      }
    }

    // Apply defaults
    for (const param of mergedBlock.params) {
      if (!(param.name in options) && param.defaultValue !== undefined) {
        options[param.name] = convertParam(
          String(param.defaultValue),
          param,
          param.name
        );
      }
    }

    // Validate required positionals
    for (let i = 0; i < cmd.positionals.length; i++) {
      const pos = cmd.positionals[i]!;
      if (pos.required && positionalValues[i] === undefined) {
        throw new Error(`Missing required argument: <${pos.name}>`);
      }
    }

    cmd.invoke(positionalValues, options);
  }
}

export const createCli = (name: string = ""): Cli => new Cli(name);
