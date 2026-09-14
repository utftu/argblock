import { Block } from "../block.ts";
import { parse, type ParsedBlock } from "../parse/parse.ts";
import { globalArg } from "../parse/global-arg.ts";
import { formatHelp } from "../parse/help.ts";
import { parseCommand } from "./parse-command.ts";
import { parseParam } from "./parse-param.ts";

type Action = (parsed: ParsedBlock) => void;

export class Cli {
  private root: Block;
  private current: Block;

  constructor({
    root,
    commandLink,
  }: { root?: Block; commandLink?: string } = {}) {
    this.root =
      root ??
      new Block({
        arg: globalArg,
        params: [],
        description: "",
        children: [],
      });
    this.current = this.root;

    if (commandLink !== undefined) {
      this.root.link = commandLink;
    }
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

  block(pattern: string, description: string, build: (cli: Cli) => void) {
    const { name, args } = parseCommand(pattern, description);

    const block = new Block({
      arg: name,
      params: [],
      positionals: args,
      description,
      children: [],
    });

    this.root.children.push(block);
    build(new Cli({ root: block }));

    this.current = block;

    return this;
  }

  param(pattern: string, description?: string) {
    const param = parseParam(pattern, description);
    this.current.params.push(param);

    return this;
  }

  action(handler: Action) {
    if (this.current === this.root && this.root.link !== undefined) {
      throw new Error(
        `Global action conflicts with command link "${this.root.link}"`,
      );
    }

    this.current.data.action = handler;

    return this;
  }

  parse(args: string[]) {
    return parse(args, [this.root], {
      onHelp: (block) => console.log(formatHelp(block)),
    });
  }

  run(args: string[]) {
    const result = this.parse(args);
    const matched = result.at(-1);
    if (!matched) return;

    const handler = matched.block.data.action as Action | undefined;
    if (!handler) {
      const label = matched.arg === globalArg ? "the global command" : matched.arg;
      throw new Error(`No action defined for ${label}`);
    }

    handler(matched);
  }
}
