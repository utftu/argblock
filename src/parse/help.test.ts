import { test, expect } from "bun:test";
import { Block } from "../block.ts";
import { Param } from "../param.ts";
import { formatHelp } from "./help.ts";

test("formats usage, positionals, options and description", () => {
  const block = new Block({
    arg: "run",
    description: "Run a file",
    positionals: [
      { name: "file", required: true, variadic: false },
      { name: "note", required: false, variadic: false },
    ],
    params: [new Param({ name: "verbose", short: "v", type: "boolean", description: "Verbose output" })],
  });

  const help = formatHelp(block);

  expect(help).toContain("Usage: run <file> [note] [options]");
  expect(help).toContain("Run a file");
  expect(help).toContain("<file>");
  expect(help).toContain("[note]");
  expect(help).toContain("--verbose, -v");
});

test("lists child commands", () => {
  const block = new Block({
    arg: "globalArg",
    description: "",
    params: [],
    children: [new Block({ arg: "build", description: "Build the project", params: [] })],
  });

  const help = formatHelp(block);

  expect(help).toContain("Commands:");
  expect(help).toContain("build  Build the project");
});
