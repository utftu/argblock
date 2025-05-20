import { test, expect, describe } from "bun:test";
import { checkShort, parseShort } from "./short.ts"; // укажи путь
import { Param } from "../param.ts";
import { Block } from "../block.ts";


// Утилита создания блока
const makeBlock = (params: Param[]) =>
  new Block({
    arg: "test",
    description: "Test block",
    params,
  });

describe("checkShort", () => {
  test("returns true for short arg like -a", () => {
    expect(checkShort("-a")).toBe(true);
  });

  test("returns false for long arg like --alpha", () => {
    expect(checkShort("--alpha")).toBe(false);
  });

  test("returns false for regular string", () => {
    expect(checkShort("abc")).toBe(false);
  });
});

describe("parseShort", () => {
  test("parses -abc as multiple boolean params", () => {
    const block = makeBlock([
      new Param({ name: "a", type: "boolean", short: "a" }),
      new Param({ name: "b", type: "boolean", short: "b" }),
      new Param({ name: "c", type: "boolean", short: "c" }),
    ]);

    const result = parseShort("-abc", "", block);

    expect(result).toEqual({
      values: [
        { param: block.findShortParam("a")!, value: "1" },
        { param: block.findShortParam("b")!, value: "1" },
        { param: block.findShortParam("c")!, value: "1" },
      ],
      jumpNext: 0,
    });
  });

  test("parses -v=hello", () => {
    const block = makeBlock([
      new Param({ name: "verbose", type: "string", short: "v" }),
    ]);

    const result = parseShort("-v=hello", "", block);

    expect(result).toEqual({
      values: [{ param: block.findShortParam("v")!, value: "hello" }],
      jumpNext: 0,
    });
  });

  test("parses -f true for boolean param", () => {
    const block = makeBlock([
      new Param({ name: "force", type: "boolean", short: "f" }),
    ]);

    const result = parseShort("-f", "true", block);

    expect(result).toEqual({
      values: [{ param: block.findShortParam("f")!, value: "true" }],
      jumpNext: 1,
    });
  });

  test("parses -f without value as true", () => {
    const block = makeBlock([
      new Param({ name: "force", type: "boolean", short: "f" }),
    ]);

    const result = parseShort("-f", "", block);

    expect(result).toEqual({
      values: [{ param: block.findShortParam("f")!, value: "1" }],
      jumpNext: 0,
    });
  });

  test("parses -n 123 for string or number param", () => {
    const block = makeBlock([
      new Param({ name: "number", type: "string", short: "n" }),
    ]);

    const result = parseShort("-n", "123", block);

    expect(result).toEqual({
      values: [{ param: block.findShortParam("n")!, value: "123" }],
      jumpNext: 1,
    });
  });

  test("throws error if param not found", () => {
    const block = makeBlock([]);
    expect(() => parseShort("-x", "", block)).toThrow("Unknown param -x");
  });

  test("throws error for unknown short param in -abc", () => {
    const block = makeBlock([
      new Param({ name: "a", type: "boolean", short: "a" }),
    ]);

    expect(() => parseShort("-ab", "", block)).toThrow(
      /No param property for shortkey: b/
    );
  });
});
