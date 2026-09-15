import { Block } from "../block.ts";
export type ParsedBlock<TBlock extends Block = Block> = {
    arg: string;
    block: TBlock;
    params: Record<string, string | boolean | number>;
    positionals: Record<string, string | string[]>;
};
export declare function parse<TBlock extends Block = any>(args: string[], blocks: TBlock[], { onHelp }?: {
    onHelp?: (block: Block) => void;
}): ParsedBlock<TBlock>[];
