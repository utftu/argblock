import { test, expect } from "bun:test";
import { Cli } from "./cli.ts";
import { globalArg } from "../parse/parse.ts";

test("parses a single command with params and positionals", () => {
  const cli = new Cli()
    .command("run <file>", "Run a file")
    .param("--verbose -v boolean 0", "Verbose output")
    .param("--output -o string", "Output dir");

  const result = cli.parse(["run", "app.ts", "--verbose", "-o", "dist"]);

  expect(result).toMatchObject([
    { arg: globalArg, params: {} },
    {
      arg: "run",
      positionals: { file: "app.ts" },
      params: { verbose: true, output: "dist" },
    },
  ]);
});

test("a flag can appear between the command name and its positionals", () => {
  const cli = new Cli()
    .command("run <file>", "Run a file")
    .param("--verbose -v boolean 0", "Verbose output");

  const result = cli.parse(["run", "--verbose", "app.ts"]);

  expect(result).toMatchObject([
    { arg: globalArg, params: {} },
    { arg: "run", positionals: { file: "app.ts" }, params: { verbose: true } },
  ]);
});

test("throws when a required positional is never provided", () => {
  const cli = new Cli()
    .command("run <file>", "Run a file")
    .param("--verbose -v boolean 0", "Verbose output");

  expect(() => cli.parse(["run", "--verbose"])).toThrow("Required positional <file> is missing");
});

test("a variadic positional collects tokens up to the first flag", () => {
  const cli = new Cli()
    .command("build [...files]", "Build the project")
    .param("--watch -w boolean 0", "Watch for changes");

  const result = cli.parse(["build", "a.ts", "b.ts", "--watch"]);

  expect(result).toMatchObject([
    { arg: globalArg, params: {} },
    {
      arg: "build",
      positionals: { files: ["a.ts", "b.ts"] },
      params: { watch: true },
    },
  ]);
});

test("params declared before any command attach to the global block", () => {
  const cli = new Cli()
    .param("--debug -d boolean 0", "Debug mode")
    .command("build", "Build the project");

  const result = cli.parse(["--debug", "build"]);

  expect(result).toMatchObject([
    { arg: globalArg, params: { debug: true } },
    { arg: "build", params: {} },
  ]);
});

test("supports multiple commands", () => {
  const cli = new Cli()
    .command("start", "Start the app")
    .param("--port -p number 3000")
    .command("stop", "Stop the app");

  const result = cli.parse(["stop"]);

  expect(result).toMatchObject([
    { arg: globalArg, params: {} },
    { arg: "stop", params: {} },
  ]);
});

test("throws on unknown param", () => {
  const cli = new Cli().command("run");

  expect(() => cli.parse(["run", "--unknown"])).toThrow();
});
