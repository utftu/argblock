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
  description: string;

  constructor({
    type,
    short,
    name,
    defaultValue,
    description = "",
  }: {
    name: string;
    type: TType;
    short?: string;
    defaultValue?: TypeMap[TType];
    description?: string;
  }) {
    this.type = type;
    this.short = short;
    this.name = name;
    this.defaultValue = defaultValue;
    this.description = description;
  }
}
