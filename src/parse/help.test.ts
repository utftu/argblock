import { test, expect } from "bun:test";
import { Block } from "../block.ts";
import { Param } from "../param.ts";
import { formatHelp } from "./help.ts";

test("formats commands, positionals and params into one output", () => {
  const block = new Block({
    arg: "run",
    description: "Run a file",
    children: [
      new Block({ arg: "build", description: "Build the project", params: [] }),
      new Block({ arg: "clean", params: [], description: "" }),
    ],
    positionals: [
      {
        name: "file",
        required: true,
        variadic: false,
        description: "path to the entry file",
      },
      { name: "note", required: false, variadic: false },
      {
        name: "tags",
        required: false,
        variadic: true,
        description: "extra tags",
      },
    ],
    params: [
      new Param({
        name: "verbose",
        short: "v",
        type: "boolean",
        description: "Verbose output",
      }),
      new Param({ name: "output", type: "string" }),
    ],
  });

  const help = formatHelp(block);
  console.log("-----", "help", help);

  expect(help).toBe(
    [
      "commands:",
      "  build - Build the project",
      "  clean",
      "",
      "positionals:",
      "  <file> - path to the entry file",
      "  [note]",
      "  [...tags] - extra tags",
      "",
      "params:",
      "  --verbose, -v boolean - Verbose output",
      "  --output string",
    ].join("\n"),
  );
});

test("omits a section entirely when the block has nothing for it", () => {
  const block = new Block({ arg: "clean", params: [], description: "" });

  expect(formatHelp(block)).toBe("");
});

test("prints a param default after its description, converted to the param type", () => {
  const block = new Block({
    arg: "run",
    description: "",
    params: [
      new Param({ name: "format", type: "string", description: "Output format", defaultValue: "md" }),
      new Param({ name: "level", short: "l", type: "number", defaultValue: 3 }),
      new Param({ name: "verbose", type: "boolean", defaultValue: "0" as any }),
      new Param({ name: "out", type: "string", description: "Output file" }),
    ],
  });

  expect(formatHelp(block)).toBe(
    [
      "params:",
      "  --format string - Output format (default: md)",
      "  --level, -l number (default: 3)",
      "  --verbose boolean (default: false)",
      "  --out string - Output file",
    ].join("\n"),
  );
});
