import { Block } from "../block.ts";
import { checkParam, parseParam } from "../parse-param/parse-param.ts";
import { convertDefault, convertParam } from "../convert/convert.ts";
import { globalArg } from "./global-arg.ts";

export type ParsedBlock<TBlock extends Block = any> = {
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

function findLink(block: Block): Block | undefined {
  if (block.link === undefined) {
    return;
  }

  const link = block.children.find((child) => child.arg === block.link);
  if (link === undefined) {
    throw new Error(`Command link "${block.link}" not found`);
  }

  return link;
}

function enterBlock(
  parsedBlocks: ParsedBlock[],
  { block, arg }: { block: Block; arg: string },
): void {
  checkRequiredPositionals(parsedBlocks.at(-1)!);
  parsedBlocks.push({ arg, params: {}, positionals: {}, block });
}

function applyDefaults(entry: ParsedBlock): void {
  for (const param of entry.block.params) {
    if (param.defaultValue === undefined) {
      continue;
    }

    if (param.name in entry.params) {
      continue;
    }

    entry.params[param.name] = convertDefault(
      String(param.defaultValue),
      param,
    );
  }
}

export const parse = <TBlock extends Block = any>(
  args: string[],
  blocks: TBlock[],
  { onHelp }: { onHelp?: (block: Block) => void } = {},
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

    if (arg === "--help") {
      onHelp?.(currentBlock);
      return [];
    }

    const link = findLink(currentBlock);

    if (arg.startsWith("-")) {
      if (
        link !== undefined &&
        !checkParam(arg, currentBlock) &&
        checkParam(arg, link)
      ) {
        enterBlock(parsedBlocks, { block: link, arg: link.arg });
        currentBlock = link;
        posIndex = 0;
      }

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
      const newI = args.length - matched.elems.length - 1;

      enterBlock(parsedBlocks, {
        block: matched.block,
        arg: args.slice(i, newI + 1).join(" "),
      });

      currentBlock = matched.block;
      posIndex = 0;
      i = newI;
      continue;
    }

    if (
      currentBlock.positionals[posIndex] === undefined &&
      link !== undefined
    ) {
      enterBlock(parsedBlocks, { block: link, arg: link.arg });
      currentBlock = link;
      posIndex = 0;
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

  const link = findLink(currentBlock);
  if (link !== undefined) {
    enterBlock(parsedBlocks, { block: link, arg: link.arg });
  }

  checkRequiredPositionals(parsedBlocks.at(-1)!);

  for (const entry of parsedBlocks) {
    applyDefaults(entry);
  }

  return parsedBlocks;
};
