import { Block } from "../block.ts";
import { globalArg, parse } from "../parse/parse.ts";
import { parseCommand } from "./parse-command.ts";
import { parseParam } from "./parse-param.ts";

export class Cli {
  private root: Block;
  private current: Block;

  constructor() {
    this.root = new Block({
      arg: globalArg,
      params: [],
      description: "",
      children: [],
    });
    this.current = this.root;
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

  param(pattern: string, description?: string) {
    const param = parseParam(pattern, description);
    this.current.params.push(param);

    return this;
  }

  parse(args: string[]) {
    return parse(args, [this.root]);
  }
}
