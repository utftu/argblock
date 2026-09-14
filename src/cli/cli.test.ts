import { test, expect, spyOn } from "bun:test";
import { Cli } from "./cli.ts";
import { globalArg } from "../parse/global-arg.ts";

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

test(".block() registers a nested command group instead of a flat command", () => {
  const cli = new Cli()
    .command("status", "Show status")
    .block("remote", "Manage remotes", (remote) => {
      remote
        .command("add <name> <url>", "Add a remote")
        .param("--tags -t boolean 0", "Track tags")
        .command("remove <name>", "Remove a remote");
    });

  const result = cli.parse(["remote", "add", "origin", "url", "--tags"]);

  expect(result).toMatchObject([
    { arg: globalArg, params: {} },
    { arg: "remote", params: {} },
    {
      arg: "add",
      positionals: { name: "origin", url: "url" },
      params: { tags: true },
    },
  ]);
});

test("a required positional is still enforced on a command nested inside a .block()", () => {
  const cli = new Cli().block("remote", "Manage remotes", (remote) => {
    remote.command("remove <name>", "Remove a remote");
  });

  expect(() => cli.parse(["remote", "remove"])).toThrow("Required positional <name> is missing");
});

test("a top-level command declared after a .block() stays a sibling, not nested inside it", () => {
  const cli = new Cli()
    .block("remote", "Manage remotes", (remote) => {
      remote.command("add <name>", "Add a remote");
    })
    .command("status", "Show status");

  const result = cli.parse(["status"]);

  expect(result).toMatchObject([{ arg: globalArg, params: {} }, { arg: "status", params: {} }]);
});

test("throws on unknown param", () => {
  const cli = new Cli().command("run");

  expect(() => cli.parse(["run", "--unknown"])).toThrow();
});

test("run dispatches to the matched command's action with its params and positionals", () => {
  const calls: unknown[] = [];

  const cli = new Cli()
    .command("run <file>", "Run a file")
    .param("--verbose -v boolean 0", "Verbose output")
    .action((ctx) => calls.push(ctx))
    .command("build [...files]", "Build the project")
    .action((ctx) => calls.push(ctx));

  cli.run(["run", "app.ts", "--verbose"]);

  expect(calls).toMatchObject([
    { arg: "run", params: { verbose: true }, positionals: { file: "app.ts" } },
  ]);
});

test("run dispatches to a command nested inside a .block()", () => {
  const calls: unknown[] = [];

  const cli = new Cli().block("remote", "Manage remotes", (remote) => {
    remote.command("add <name>", "Add a remote").action((ctx) => calls.push(ctx));
  });

  cli.run(["remote", "add", "origin"]);

  expect(calls).toMatchObject([{ arg: "add", params: {}, positionals: { name: "origin" } }]);
});

test("run throws when the matched command has no action", () => {
  const cli = new Cli().command("run <file>", "Run a file");

  expect(() => cli.run(["run", "app.ts"])).toThrow("No action defined for run");
});

test("run does nothing after --help (no action to dispatch to)", () => {
  const cli = new Cli().command("run <file>", "Run a file").action(() => {
    throw new Error("should not be called");
  });
  const log = spyOn(console, "log").mockImplementation(() => {});

  expect(() => cli.run(["run", "--help"])).not.toThrow();

  log.mockRestore();
});

test("--help prints usage for the current command", () => {
  const cli = new Cli().command("run <file>", "Run a file");
  const log = spyOn(console, "log").mockImplementation(() => {});

  const result = cli.parse(["run", "--help"]);

  expect(result).toEqual([]);
  expect(log).toHaveBeenCalledTimes(1);
  expect(log.mock.calls[0]![0]).toContain("positionals:");
  expect(log.mock.calls[0]![0]).toContain("<file>");

  log.mockRestore();
});

test("defaults from the pattern land in params when the flag is absent", () => {
  const cli = new Cli()
    .command("run", "Run")
    .param("--threshold number 1")
    .param("--concurrency -c number 4")
    .param("--tag -t string all")
    .param("--verbose -v boolean 0");

  const result = cli.parse(["run"]);

  expect(result.at(-1)!.params).toEqual({
    threshold: 1,
    concurrency: 4,
    tag: "all",
    verbose: false,
  });
});

test("an explicit value wins over the default", () => {
  const cli = new Cli()
    .command("run", "Run")
    .param("--tag -t string all")
    .param("--concurrency -c number 4");

  expect(cli.parse(["run", "--tag", "beta"]).at(-1)!.params).toEqual({
    tag: "beta",
    concurrency: 4,
  });
  expect(cli.parse(["run", "-c=8"]).at(-1)!.params).toEqual({
    tag: "all",
    concurrency: 8,
  });
});

test("--no- turns off a boolean that defaults to true", () => {
  const cli = new Cli().command("run", "Run").param("--color boolean 1");

  expect(cli.parse(["run"]).at(-1)!.params).toEqual({ color: true });
  expect(cli.parse(["run", "--no-color"]).at(-1)!.params).toEqual({
    color: false,
  });
});

test("defaults on the global block are filled too", () => {
  const cli = new Cli()
    .param("--level number 3")
    .command("build", "Build")
    .param("--watch -w boolean 0");

  const result = cli.parse(["build"]);

  expect(result[0]!.params).toEqual({ level: 3 });
  expect(result[1]!.params).toEqual({ watch: false });
});

test("run() hands defaults to the action", () => {
  let seen: Record<string, unknown> | undefined;

  const cli = new Cli()
    .command("run", "Run")
    .param("--tag -t string all")
    .param("--retries number 2")
    .action(({ params }) => {
      seen = params;
    });

  cli.run(["run"]);

  expect(seen).toEqual({ tag: "all", retries: 2 });
});

test("a default that does not match the type throws at declaration", () => {
  expect(() => new Cli().param("--threshold number abc")).toThrow(
    "Param must be number: default for --threshold",
  );
  expect(() => new Cli().param("--verbose -v boolean yes")).toThrow(
    "Param must be boolean: default for --verbose",
  );
});

function createLinkedCli(): Cli {
  return new Cli({ commandLink: "run" })
    .param("--verbose boolean 0")
    .command("run [file]", "Run a file")
    .param("--tag -t string all")
    .param("--verbose boolean 0")
    .command("build", "Build");
}

test("a bare positional goes to the linked command", () => {
  const result = createLinkedCli().parse(["app.ts"]);

  expect(result.map((entry) => entry.arg)).toEqual([globalArg, "run"]);
  expect(result[1]!.positionals).toEqual({ file: "app.ts" });
});

test("a flag only the linked command knows enters the link", () => {
  const result = createLinkedCli().parse(["--tag", "beta", "app.ts"]);

  expect(result.map((entry) => entry.arg)).toEqual([globalArg, "run"]);
  expect(result[1]!.params).toEqual({ tag: "beta", verbose: false });
  expect(result[1]!.positionals).toEqual({ file: "app.ts" });
});

test("a flag known to the global block stays global and keeps explicit commands", () => {
  const result = createLinkedCli().parse(["--verbose", "build"]);

  expect(result.map((entry) => entry.arg)).toEqual([globalArg, "build"]);
  expect(result[0]!.params).toEqual({ verbose: true });
});

test("an explicit command is not taken over by the link", () => {
  const result = createLinkedCli().parse(["build"]);

  expect(result.map((entry) => entry.arg)).toEqual([globalArg, "build"]);
});

test("no args enter the linked command", () => {
  const result = createLinkedCli().parse([]);

  expect(result.map((entry) => entry.arg)).toEqual([globalArg, "run"]);
});

test("no args still enforce required positionals of the linked command", () => {
  const cli = new Cli({ commandLink: "run" }).command("run <file>", "Run");

  expect(() => cli.parse([])).toThrow("Required positional <file> is missing");
});

test("run() dispatches to the linked command action", () => {
  let seen: string | undefined;

  const cli = new Cli({ commandLink: "run" })
    .command("run <file>", "Run")
    .action(({ positionals }) => {
      seen = positionals.file as string;
    });

  cli.run(["app.ts"]);

  expect(seen).toBe("app.ts");
});

test("a link to a missing command throws on parse", () => {
  const cli = new Cli({ commandLink: "rn" }).command("run", "Run");

  expect(() => cli.parse([])).toThrow('Command link "rn" not found');
});

test("a global action cannot be combined with a command link", () => {
  expect(() => new Cli({ commandLink: "run" }).action(() => {})).toThrow(
    'Global action conflicts with command link "run"',
  );
});

test("a global-only flag after entering the link is unknown", () => {
  const cli = new Cli({ commandLink: "run" })
    .param("--debug boolean 0")
    .command("run [file]", "Run")
    .param("--tag -t string all");

  expect(cli.parse(["--debug", "--tag", "beta", "app.ts"])[0]!.params).toEqual({
    debug: true,
  });
  expect(() => cli.parse(["--tag", "beta", "--debug", "app.ts"])).toThrow(
    "Unknown param --debug",
  );
});
