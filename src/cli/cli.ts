import { Block } from "../block.ts";
import { globalArg, parse } from "../parse/parse.ts";
import { formatHelp } from "../parse/help.ts";
import { parseCommand } from "./parse-command.ts";
import { parseParam } from "./parse-param.ts";

export class Cli {
  private root: Block;
  private current: Block;

  constructor(root?: Block) {
    this.root =
      root ??
      new Block({
        arg: globalArg,
        params: [],
        description: "",
        children: [],
      });
    this.current = this.root;
  }

  static new() {
    return new Cli();
  }

  command(pattern: string, description = "") {
    const { name, args } = parseCommand(pattern, description);

    const block = new Block({
      arg: name,
      params: [],
      positionals: args,
      description,
      children: [],
    });

    this.root.children.push(block);
    this.current = block;

    return this;
  }

  base(pattern: string, description: string, build: (cli: Cli) => void) {
    const { name, args } = parseCommand(pattern, description);

    const block = new Block({
      arg: name,
      params: [],
      positionals: args,
      description,
      children: [],
    });

    this.root.children.push(block);
    build(new Cli(block));

    this.current = block;

    return this;
  }

  param(pattern: string, description?: string) {
    const param = parseParam(pattern, description);
    this.current.params.push(param);

    return this;
  }

  parse(args: string[]) {
    return parse(args, [this.root], {
      onHelp: (block) => console.log(formatHelp(block)),
    });
  }
}
