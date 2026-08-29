import { test, expect } from "bun:test";
import { Block } from "./block.ts";

test("rejects a required positional declared after an optional one", () => {
  expect(
    () =>
      new Block({
        arg: "run",
        params: [],
        description: "",
        positionals: [
          { name: "a", required: false, variadic: false },
          { name: "b", required: true, variadic: false },
        ],
      }),
  ).toThrow("Required positional <b> cannot follow optional <a>");
});

test("rejects a variadic positional that isn't last", () => {
  expect(
    () =>
      new Block({
        arg: "run",
        params: [],
        description: "",
        positionals: [
          { name: "a", required: false, variadic: true },
          { name: "b", required: false, variadic: false },
        ],
      }),
  ).toThrow("Variadic positional <...a> must be last");
});
