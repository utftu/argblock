import { expect, it } from "bun:test";
import { Param } from "./param.ts";
import { Block } from "./block.ts";
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

  expect(result).toEqual([
    { arg: globalArg, params: { hello: "world", age: "25", enabled: "1" } },
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

  expect(result).toEqual([
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
