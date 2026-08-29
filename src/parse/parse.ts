import { Block } from "../block.ts";
import { parseParam } from "../parse-param/parse-param.ts";
import { convertParam } from "../convert/convert.ts";

export const globalArg = "globalArg";

type ParsedBlock<TBlock extends Block = any> = {
  arg: string;
  block: TBlock;
  params: Record<string, string | boolean | number>;
  positionals: Record<string, string | string[]>;
};

function matchChild(elems: string[], children: Block[]) {
  for (const child of children) {
    const { match, elems: afterName } = child.matcher(elems);
    if (match) return { block: child, elems: afterName };
  }
  return undefined;
}

function checkRequiredPositionals(entry: ParsedBlock) {
  for (const positional of entry.block.positionals) {
    if (!positional.required) continue;

    const value = entry.positionals[positional.name];
    const missing = positional.variadic
      ? (value as string[] | undefined)?.length === 0
      : value === undefined;

    if (missing) {
      const label = positional.variadic
        ? `...${positional.name}`
        : positional.name;
      throw new Error(`Required positional <${label}> is missing`);
    }
  }
}

export const parse = <TBlock extends Block = any>(
  args: string[],
  blocks: TBlock[],
): ParsedBlock<TBlock>[] => {
  if (blocks.length === 0) {
    throw new Error("Empty blocks");
  }

  const globalBlockProvided =
    blocks.length === 1 && blocks[0]!.arg === globalArg;

  let currentBlock: Block = globalBlockProvided
    ? blocks[0]!
    : new Block({
        arg: globalArg,
        params: [],
        description: "",
        children: blocks,
      });

  const parsedBlocks: ParsedBlock[] = [
    { arg: currentBlock.arg, params: {}, positionals: {}, block: currentBlock },
  ];

  let posIndex = 0;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === "--help") return [];

    if (arg.startsWith("-")) {
      const { values, elems: rest } = parseParam(args.slice(i), currentBlock);
      const current = parsedBlocks.at(-1)!;

      for (const { param, value } of values) {
        if (param.name in current.params) {
          throw new Error("Param duplicated: " + arg);
        }
        current.params[param.name] = convertParam(value, param, arg);
      }

      i = args.length - rest.length - 1;
      continue;
    }

    const matched = matchChild(args.slice(i), currentBlock.children);
    if (matched) {
      checkRequiredPositionals(parsedBlocks.at(-1)!);

      const newI = args.length - matched.elems.length - 1;

      parsedBlocks.push({
        arg: args.slice(i, newI + 1).join(" "),
        params: {},
        positionals: {},
        block: matched.block,
      });

      currentBlock = matched.block;
      posIndex = 0;
      i = newI;
      continue;
    }

    const positional = currentBlock.positionals[posIndex];
    if (!positional) throw new Error(`Unknown arg: ${arg}`);

    const current = parsedBlocks.at(-1)!;

    if (positional.variadic) {
      const list =
        (current.positionals[positional.name] as string[] | undefined) ?? [];
      list.push(arg);
      current.positionals[positional.name] = list;
    } else {
      current.positionals[positional.name] = arg;
      posIndex++;
    }
  }

  checkRequiredPositionals(parsedBlocks.at(-1)!);

  return globalBlockProvided ? parsedBlocks : parsedBlocks.slice(1);
};
