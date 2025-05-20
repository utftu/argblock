import { Block } from "./block.ts";
import type { Param } from "./param.ts";
import { parseParam } from "./parse/parse.ts";

const args = process.argv;

const realArgs = args.slice(2);

const globalName = "globalArgs";

const defaultGlobalBlock = new Block({
  arg: globalName,
  params: [],
  description: `Default global params for app`,
});

type ParsedBlock = {
  arg: string;
  params: Record<string, { value: any; param: Param }>;
};

const parse = (args: string[], blocks: Block[]) => {
  if (blocks.length === 0) {
    throw new Error("Empty blocks");
  }
  const preparedBlocks =
    blocks[0]?.arg === globalName ? blocks : [defaultGlobalBlock, ...blocks];

  const parsedBlocks: ParsedBlock[] = [
    { arg: preparedBlocks[0]!.arg, params: {} },
  ];

  let currentIndex = 0;
  let currentBlock = blocks[currentIndex]!;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg.startsWith("-")) {
      const nextArg = args[i + 1] || "";
      const { jumpNext, values } = parseParam(arg, nextArg, currentBlock);
      const lastParsedBlock = parsedBlocks.at(-1)!;

      for (const { param, value } of values) {
        if (param.name in lastParsedBlock.params) {
          throw new Error("Param dublicated: " + arg);
        }

        lastParsedBlock.params[param.name] = {
          param,
          value,
        };
      }

      i += jumpNext;
    }
  }

  // not param
};

