import { expect, it } from "bun:test";
import { Param } from "../param.ts";
import { Block } from "../block.ts";
import { globalArg, parse } from "./parse.ts";

it("long with global", () => {
  const globalBlock = new Block({
    arg: globalArg,
    description: "",
    params: [
      new Param({ name: "hello", short: "h", type: "string" }),
      new Param({ name: "age", short: "a", type: "number" }),
      new Param({ name: "enabled", type: "boolean", short: "e" }),
    ],
    children: [
      new Block({
        arg: "hello",
        params: [new Param({ type: "string", name: "hello" })],
        description: "",
      }),
    ],
  });

  const rawArgs = "--hello world -a=25 -e hello --hello=world1";
  const result = parse(rawArgs.split(" "), [globalBlock]);

  expect(result).toMatchObject([
    { arg: globalArg, params: { hello: "world", age: 25, enabled: true } },
    {
      arg: "hello",
      params: {
        hello: "world1",
      },
    },
  ]);
});

it("long without global", () => {
  const notGlobalBlock = new Block({
    arg: "hello",
    params: [new Param({ type: "string", name: "hello" })],
    description: "",
  });

  const rawArgs = "hello --hello=world1";
  const result = parse(rawArgs.split(" "), [notGlobalBlock]);

  expect(result).toMatchObject([
    {
      arg: "hello",
      params: {
        hello: "world1",
      },
    },
  ]);
});

it("error arg", () => {
  const notGlobalBlock = new Block({
    arg: "hello",
    params: [new Param({ type: "string", name: "hello" })],
    description: "",
  });

  const rawArgs = "world --hello=world1";

  expect(() => {
    parse(rawArgs.split(" "), [notGlobalBlock]);
  }).toThrow();
});

it("error param", () => {
  const notGlobalBlock = new Block({
    arg: "hello",
    params: [new Param({ type: "string", name: "hello" })],
    description: "",
  });

  const rawArgs = "hello --world=world1";

  expect(() => {
    parse(rawArgs.split(" "), [notGlobalBlock]);
  }).toThrow();
});

it("--help stops parsing and reports the current block via onHelp, without printing anything itself", () => {
  const notGlobalBlock = new Block({
    arg: "hello",
    params: [new Param({ type: "string", name: "hello" })],
    description: "",
  });

  let reportedBlock: Block | undefined;
  const result = parse(["hello", "--help"], [notGlobalBlock], {
    onHelp: (block) => {
      reportedBlock = block;
    },
  });

  expect(result).toEqual([]);
  expect(reportedBlock).toBe(notGlobalBlock);
});

it("defaults on hand-built params are converted to the param type", () => {
  const block = new Block({
    arg: "run",
    description: "",
    params: [
      new Param({ name: "verbose", type: "boolean", short: "v", defaultValue: "0" as any }),
      new Param({ name: "output", type: "string", short: "o", defaultValue: "./output" }),
      new Param({ name: "retries", type: "number", defaultValue: 2 }),
    ],
  });

  const result = parse(["run", "-o", "dist"], [block]);

  expect(result[0]!.params).toEqual({
    verbose: false,
    output: "dist",
    retries: 2,
  });
});

it("a param without a default stays absent from params", () => {
  const block = new Block({
    arg: "run",
    description: "",
    params: [new Param({ name: "output", type: "string" })],
  });

  expect(parse(["run"], [block])[0]!.params).toEqual({});
});
