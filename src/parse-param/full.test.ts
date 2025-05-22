import { test, expect, describe } from "bun:test";
import { checkFull, parseFull } from "./full.ts"; // укажи путь
import { Block } from "../block.ts";
import { Param } from "../param.ts";

// Утилита для генерации блока
const makeBlock = (params: Param[]) =>
  new Block({
    arg: "test",
    description: "Test block",
    params,
  });

describe("checkFull", () => {
  test("returns true for full param like --name", () => {
    expect(checkFull("--name")).toBe(true);
  });

  test("returns false for short param like -n", () => {
    expect(checkFull("-n")).toBe(false);
  });

  test("returns false for plain string", () => {
    expect(checkFull("hello")).toBe(false);
  });
});

describe("parseFull", () => {
  test("parses --param=value correctly", () => {
    const block = makeBlock([new Param({ name: "mode", type: "string" })]);

    const result = parseFull("--mode=fast", "", block);

    expect(result).toEqual({
      values: [{ param: block.findParam("mode")!, value: "fast" }],
      jumpNext: 0,
    });
  });

  test("parses --flag true for boolean param", () => {
    const block = makeBlock([new Param({ name: "flag", type: "boolean" })]);

    const result = parseFull("--flag", "true", block);

    expect(result).toEqual({
      values: [{ param: block.findParam("flag")!, value: "true" }],
      jumpNext: 1,
    });
  });

  test("parses --flag without value as 1 for boolean param", () => {
    const block = makeBlock([new Param({ name: "flag", type: "boolean" })]);

    const result = parseFull("--flag", "", block);

    expect(result).toEqual({
      values: [{ param: block.findParam("flag")!, value: "1" }],
      jumpNext: 0,
    });
  });

  test("parses --name John for string param", () => {
    const block = makeBlock([new Param({ name: "name", type: "string" })]);

    const result = parseFull("--name", "John", block);

    expect(result).toEqual({
      values: [{ param: block.findParam("name")!, value: "John" }],
      jumpNext: 1,
    });
  });

  test("throws if param is unknown", () => {
    const block = makeBlock([]);
    expect(() => parseFull("--unknown", "", block)).toThrow(
      "Unknown param --unknown"
    );
  });

  test("throws if param in --param=value is unknown", () => {
    const block = makeBlock([]);
    expect(() => parseFull("--param=value", "", block)).toThrow(
      "Unknown param --param=value"
    );
  });
});
