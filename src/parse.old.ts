import { Block } from "./block.ts";
import type { Arg } from "./block.ts";
import { parseParam } from "./parse-param/parse-param.ts";
import { convertParam } from "./convert/convert.ts";

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
      values[pos.name] = collected;
    } else {
      if (rest.length === 0 || rest[0]!.startsWith("-")) {
        break;
      }
      values[pos.name] = rest[0]!;
      rest = rest.slice(1);
    }
  }

  return { values, elems: rest };
}

export const globalArg = "globalArg";

const createDefaultGlobalBlock = (children: Block[]) => {
  return new Block({
    arg: globalArg,
    params: [],
    description: `Default global params for app`,
    children,
  });
};

type ParsedBlock<TBlock extends Block = any> = {
  arg: string;
  block: TBlock;
  params: Record<string, string | boolean | number>;
  positionals: Record<string, string | string[]>;
};

export const parse = <TBlock extends Block = any>(
  args: string[],
  blocks: TBlock[]
): ParsedBlock<TBlock>[] => {
  if (blocks.length === 0) {
    throw new Error("Empty blocks");
  }

  const globalArgInit = blocks.length === 1 && blocks[0]!.arg === globalArg;

  let currentBlock = globalArgInit
    ? blocks[0]!
    : createDefaultGlobalBlock(blocks);

  const parsedBlocks: ParsedBlock[] = [
    { arg: currentBlock.arg, params: {}, positionals: {}, block: currentBlock },
  ];

  outer: for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === "--help") {
      return [];
    }

    // params
    if (arg.startsWith("-")) {
      const { values, elems: rest } = parseParam(args.slice(i), currentBlock);
      const lastParsedBlock = parsedBlocks.at(-1)!;

      for (const { param, value } of values) {
        if (param.name in lastParsedBlock.params) {
          throw new Error("Param dublicated: " + arg);
        }

        lastParsedBlock.params[param.name] = convertParam(value, param, arg);
      }

      i = args.length - rest.length - 1;
      continue;
    }

    // args
    for (const childBlock of currentBlock.children) {
      const { match, elems: afterName } = childBlock.matcher(args.slice(i));

      if (!match) {
        continue;
      }

      const { values: positionalValues, elems: rest } = consumePositionals(
        afterName,
        childBlock.positionals,
      );

      const newI = args.length - rest.length - 1;
      const arg = args.slice(i, newI + 1);

      parsedBlocks.push({
        arg: arg.join(" "),
        params: {},
        positionals: positionalValues,
        block: childBlock,
      });

      currentBlock = childBlock;
      i = newI;

      continue outer;
    }

    throw new Error(`Not param or arg: ${arg}`);
  }

  return globalArgInit ? parsedBlocks : parsedBlocks.slice(1);
};
