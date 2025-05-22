import { test, expect, describe } from "bun:test";
import { checkNo, parseNo } from "./no.ts";
import { Param } from "../param.ts";
import { Block } from "../block.ts";

const makeBlock = (params: Param[]) =>
  new Block({
    arg: "test",
    description: "Test block",
    params,
  });

describe("checkNo", () => {
  test("returns true for --no- prefix", () => {
    expect(checkNo("--no-cache")).toBe(true);
  });

  test("returns false if no --no- prefix", () => {
    expect(checkNo("--cache")).toBe(false);
    expect(checkNo("-c")).toBe(false);
  });
});

describe("parseNo", () => {
  test("returns value=0 for known param", () => {
    const block = makeBlock([new Param({ name: "cache", type: "boolean" })]);
    const result = parseNo("--no-cache", block);

    expect(result).toEqual({
      values: [
        {
          param: block.findParam("cache")!,
          value: "0",
        },
      ],
      jumpNext: 0,
    });
  });

  test("throws for unknown param", () => {
    const block = makeBlock([]);
    expect(() => parseNo("--no-unknown", block)).toThrow(
      "Unknown param --no-unknown"
    );
  });
});
