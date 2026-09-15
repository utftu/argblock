import { Block } from "../block.ts";
import { type ParsedBlock } from "../parse/parse.ts";
type ActionArgs = ParsedBlock & {
    globalParams: ParsedBlock["params"];
};
type Action = (parsed: ActionArgs) => void;
export declare class Cli {
    private root;
    private current;
    constructor({ root, commandLink, }?: {
        root?: Block;
        commandLink?: string;
    });
    static new(): Cli;
    command(pattern: string, description?: string): this;
    block(pattern: string, description: string, build: (cli: Cli) => void): this;
    param(pattern: string, description?: string): this;
    action(handler: Action): this;
    parse(args: string[]): ParsedBlock<Block<any>>[];
    run(args: string[]): void;
}
export {};
