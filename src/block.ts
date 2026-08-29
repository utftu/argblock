import type { Param } from "./param.ts";
import { validatePositionals } from "./positional/positional.ts";

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

const createDefaultMatcher =
  (name: string): Matcher =>
  (elems: string[]) => {
    if (name === elems[0]) {
      return { elems: elems.slice(1), match: true };
    }

    return { elems, match: false };
  };

export class Block<TData extends Record<any, any> = any> {
  arg: string;
  params: Param[];
  positionals: Positional[];
  description: string;
  matcher: Matcher;
  data: TData;

  children: Block[] = [];
  constructor({
    arg,
    params,
    positionals = [],
    description,
    matcher,
    children = [],
    data = {} as TData,
  }: {
    arg: string;
    params: Param[];
    positionals?: Positional[];
    description: string;
    matcher?: Matcher;
    children?: Block[];
    data?: TData;
  }) {
    validatePositionals(positionals);

    this.arg = arg;
    this.params = params;
    this.positionals = positionals;
    this.description = description;
    this.children = children;
    this.data = data;

    if (matcher) {
      this.matcher = matcher;
    } else {
      this.matcher = createDefaultMatcher(this.arg);
    }
  }

  findParam(name: string) {
    for (const param of this.params) {
      if (param.name === name) {
        return param;
      }
    }
  }

  findShortParam(name: string) {
    for (const param of this.params) {
      if (param.short === name) {
        return param;
      }
    }
  }
}
