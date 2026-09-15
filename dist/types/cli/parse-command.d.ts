import type { Positional } from "../block.ts";
type CommandDef = {
    name: string;
    args: Positional[];
};
export declare function parseCommand(pattern: string, _description?: string): CommandDef;
export {};
