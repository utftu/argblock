type TypeMap = {
    string: string;
    boolean: boolean;
    number: number;
};
export declare class Param<TType extends keyof TypeMap = any> {
    name: string;
    type: TType;
    short?: string;
    defaultValue?: TypeMap[TType];
    description: string;
    constructor({ type, short, name, defaultValue, description, }: {
        name: string;
        type: TType;
        short?: string;
        defaultValue?: TypeMap[TType];
        description?: string;
    });
}
export {};
