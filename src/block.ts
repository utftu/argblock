import type { Param } from "./param.ts";

export class Block {
  arg: string;
  params: Param[];
  description: string;

  children: Block[] = [];
  constructor({
    arg,
    params,
    description,
  }: {
    arg: string;
    params: Param[];
    description: string;
  }) {
    this.arg = arg;
    this.params = params;
    this.description = description;
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