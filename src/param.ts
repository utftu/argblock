type TypeMap = {
  string: string;
  boolean: boolean;
  number: number;
};

export class Param<TType extends keyof TypeMap = any> {
  name: string;
  type: TType;
  short?: string;
  defaultValue?: TypeMap[TType];

  constructor({
    type,
    short,
    name,
    defaultValue,
  }: {
    name: string;
    type: TType;
    short?: string;
    defaultValue?: TypeMap[TType];
  }) {
    this.type = type;
    this.short = short;
    this.name = name;
    this.defaultValue = defaultValue;
  }
}