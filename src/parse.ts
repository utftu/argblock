import { Block, type Arg } from "./block.ts";
import { parseParam } from "./parse-param/parse-param.ts";
import { convertParam } from "./convert/convert.ts";

export const globalArg = "globalArg";

type ParsedBlock<TBlock extends Block = any> = {
  arg: string;
  block: TBlock;
  params: Record<string, string | boolean | number>;
  positionals: Record<string, string | string[]>;
};

function consumePositionals(
  elems: string[],
  positionals: Arg[],
): { values: Record<string, string | string[]>; elems: string[] } {
  const values: Record<string, string | string[]> = {};
  let rest = elems;

  for (const pos of positionals) {
    if (pos.variadic) {
      const collected: string[] = [];
      while (rest.length > 0 && !rest[0]!.startsWith("-")) {
        collected.push(rest[0]!);
        rest = rest.slice(1);
      }
      if (pos.required && collected.length === 0) {
        throw new Error(`Required positional <...${pos.name}> is missing`);
      }
      values[pos.name] = collected;
    } else {
      if (rest.length === 0 || rest[0]!.startsWith("-")) {
        if (pos.required) {
          throw new Error(`Required positional <${pos.name}> is missing`);
        }
        break;
      }
      values[pos.name] = rest[0]!;
      rest = rest.slice(1);
    }
  }

  return { values, elems: rest };
}

function matchChild(elems: string[], children: Block[]) {
  for (const child of children) {
    const { match, elems: afterName } = child.matcher(elems);
    if (!match) continue;

    const { values, elems: rest } = consumePositionals(
      afterName,
      child.positionals,
    );

    return { block: child, positionals: values, elems: rest };
  }
  return undefined;
}

export const parse = <TBlock extends Block = any>(
  args: string[],
  blocks: TBlock[],
): ParsedBlock<TBlock>[] => {
  if (blocks.length === 0) {
    throw new Error("Empty blocks");
  }

  const isGlobalBlock = blocks.length === 1 && blocks[0]!.arg === globalArg;

  let currentBlock: Block = isGlobalBlock
    ? blocks[0]!
    : new Block({
        arg: globalArg,
        params: [],
        description: "",
        children: blocks,
      });

  const result: ParsedBlock[] = [
    { arg: currentBlock.arg, params: {}, positionals: {}, block: currentBlock },
  ];

  for (let i = 0; i < args.length; i++) {
    const token = args[i]!;

    if (token === "--help") return [];

    if (token.startsWith("-")) {
      const { values, elems: rest } = parseParam(args.slice(i), currentBlock);
      const current = result.at(-1)!;

      for (const { param, value } of values) {
        if (param.name in current.params) {
          throw new Error("Param duplicated: " + token);
        }
        current.params[param.name] = convertParam(value, param, token);
      }

      i = args.length - rest.length - 1;
      continue;
    }

    const matched = matchChild(args.slice(i), currentBlock.children);
    if (!matched) throw new Error(`Unknown arg: ${token}`);

    const newI = args.length - matched.elems.length - 1;

    result.push({
      arg: args.slice(i, newI + 1).join(" "),
      params: {},
      positionals: matched.positionals,
      block: matched.block,
    });

    currentBlock = matched.block;
    i = newI;
  }

  return isGlobalBlock ? result : result.slice(1);
};
