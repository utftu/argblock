import type { Param } from "./param.ts";

type Matcher = (
  args: string[],
  index: number
) => {
  jumpNext: number;
  match: boolean;
};

const createDefaultMatcher =
  (name: string): Matcher =>
  (args: string[], index: number) => {
    if (name === args[index]) {
      return { jumpNext: 0, match: true };
    }

    return { jumpNext: 0, match: false };
  };

export class Block<TData extends Record<any, any> = any> {
  arg: string;
  params: Param[];
  description: string;
  matcher: Matcher;
  data: TData;

  children: Block[] = [];
  constructor({
    arg,
    params,
    description,
    matcher,
    children = [],
    data = {} as TData,
  }: {
    arg: string;
    params: Param[];
    description: string;
    matcher?: Matcher;
    children?: Block[];
    data?: TData;
  }) {
    this.arg = arg;
    this.params = params;
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
