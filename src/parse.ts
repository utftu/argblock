import { Block } from "./block.ts";
import { parseParam } from "./parse-param/parse-param.ts";

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
  params: Record<string, string>;
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
    { arg: currentBlock.arg, params: {}, block: currentBlock },
  ];

  outer: for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === "--help") {
      return [];
    }

    // params
    if (arg.startsWith("-")) {
      const nextArg = args[i + 1] || "";
      const { jumpNext, values } = parseParam(arg, nextArg, currentBlock);
      const lastParsedBlock = parsedBlocks.at(-1)!;

      for (const { param, value } of values) {
        if (param.name in lastParsedBlock.params) {
          throw new Error("Param dublicated: " + arg);
        }

        lastParsedBlock.params[param.name] = value;
      }

      i += jumpNext;
      continue;
    }

    // args
    for (const childBlock of currentBlock.children) {
      const { jumpNext, match } = childBlock.matcher(args, i);

      if (!match) {
        continue;
      }

      const lastI = i;
      i += jumpNext;

      const arg = args.slice(lastI, i + 1 + jumpNext);
      parsedBlocks.push({
        arg: arg.join(" "),
        params: {},
        block: childBlock,
      });

      currentBlock = childBlock;

      continue outer;
    }

    throw new Error(`Not param or arg: ${arg}`);
  }

  return globalArgInit ? parsedBlocks : parsedBlocks.slice(1);
};
