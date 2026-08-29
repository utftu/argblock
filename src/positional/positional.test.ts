import { test, expect, describe } from "bun:test";
import { validatePositionals } from "./positional.ts";
import type { Positional } from "../block.ts";

const required = (name: string): Positional => ({ name, required: true, variadic: false });
const optional = (name: string): Positional => ({ name, required: false, variadic: false });
const variadic = (name: string, required = false): Positional => ({
  name,
  required,
  variadic: true,
});

describe("validatePositionals", () => {
  test("allows required followed by optional", () => {
    expect(() => validatePositionals([required("a"), optional("b")])).not.toThrow();
  });

  test("rejects required after optional", () => {
    expect(() => validatePositionals([optional("a"), required("b")])).toThrow(
      "Required positional <b> cannot follow optional <a>",
    );
  });

  test("rejects a variadic positional that isn't last", () => {
    expect(() => validatePositionals([variadic("a"), required("b")])).toThrow(
      "Variadic positional <...a> must be last",
    );
  });

  test("allows a variadic positional as the last one", () => {
    expect(() => validatePositionals([required("a"), variadic("b")])).not.toThrow();
  });
});
