import type { Param } from "./param.ts";
export type Positional = {
    name: string;
    required: boolean;
    variadic: boolean;
    description?: string;
};
type Matcher = (elems: string[]) => {
    elems: string[];
    match: boolean;
};
export declare class Block<TData extends Record<any, any> = any> {
    arg: string;
    params: Param[];
    positionals: Positional[];
    description: string;
    matcher: Matcher;
    data: TData;
    link?: string;
    children: Block[];
    constructor({ arg, params, positionals, description, matcher, children, data, link, }: {
        arg: string;
        params: Param[];
        positionals?: Positional[];
        description: string;
        matcher?: Matcher;
        children?: Block[];
        data?: TData;
        link?: string;
    });
    findParam(name: string): Param<any> | undefined;
    findShortParam(name: string): Param<any> | undefined;
}
export {};
