# Argblock

`argblock` is a lightweight and flexible JavaScript/TypeScript library for parsing command-line arguments. It supports long (`--flag`), short (`-f`), and negated (`--no-flag`) parameter formats, positional arguments, and nested command structures with custom argument matching.

## Installation

Install the library via npm:

```bash
npm i argblock
```

## Usage

There are two ways to use `argblock`: the declarative `Cli` builder (recommended for most CLIs), or the lower-level `Block`/`Param`/`parse` API it's built on.

### The `Cli` builder

```javascript
import { Cli } from "argblock";

const cli = new Cli()
  .command("run <file>", "Run a file")
  .param("--verbose -v boolean 0", "Verbose output")
  .param("--output -o string", "Output directory")
  .command("build [...files]", "Build the project")
  .param("--watch -w boolean 0", "Watch for changes");

const result = cli.parse(process.argv.slice(2));
console.log(result);
```

```bash
node cli.js run app.ts --verbose -o dist
```

Output:

```javascript
[
  { arg: "globalArg", params: {}, positionals: {} },
  {
    arg: "run",
    params: { verbose: true, output: "dist" },
    positionals: { file: "app.ts" },
  },
];
```

Flags and positional arguments can be interleaved freely — `run app.ts --verbose`, `run --verbose app.ts`, and `run --verbose app.ts --output dist` all fill `file` the same way. Only the relative order *among* the positionals themselves matters (the first non-flag, non-subcommand token fills the first positional, the second fills the second, and so on).

- **`.command(pattern, description?)`** declares a command and makes it the current context for subsequent `.param()` calls. The pattern is the command name followed by positional arguments: `<name>` for required, `[name]` for optional, and `[...name]` for variadic (must be last).
- **`.param(pattern, description?)`** declares a parameter on the current command (or on the global block if called before any `.command()`). The pattern is `--name [-s] <type> [default]`, where `type` is one of `string`/`str`, `number`/`num`/`int`, `boolean`/`bool`.
- **`.parse(args)`** parses `args` and returns the same shape as the low-level `parse()` function, always including a leading entry for the global block.

### The low-level API

#### Importing

```javascript
import { Param, Block, parse } from "argblock";
```

#### Defining Parameters and Blocks

1. **Create Parameters** using the `Param` class:

   ```javascript
   const verboseParam = new Param({
     name: "verbose",
     type: "boolean",
     short: "v",
     defaultValue: "0",
   });
   ```

2. **Create Blocks** using the `Block` class:

   ```javascript
   const mainBlock = new Block({
     arg: "run",
     params: [verboseParam],
     description: "Run the application",
     children: [],
   });
   ```

3. **Parse Arguments** using the `parse` function:

   ```javascript
   const args = ["run", "--verbose", "1"];
   const result = parse(args, [mainBlock]);
   console.log(result);
   ```

   Example output:

   ```javascript
   [
     {
       arg: "run",
       params: { verbose: "1" },
       positionals: {},
     },
   ];
   ```

### Key Features

- **Long Parameters**: Supports `--name value` and `--name=value` formats.
- **Short Parameters**: Supports `-f` for single flags and `-abc` for multiple boolean flags.
- **Negated Parameters**: Supports `--no-name` for boolean flags.
- **Positional Arguments**: Required, optional, and variadic positionals per block via `positionals`, freely interleaved with flags.
- **Custom Matchers**: Allows custom matching logic for blocks via the `matcher` property.
- **Nested Commands**: Supports hierarchical command structures through `children` in `Block`.
- **Error Handling**: Throws descriptive errors for unknown or duplicated parameters.

### Code Structure

The library consists of several internal modules:

- **`block.ts`**: Defines the `Block` class and a default matcher for argument matching.

  - `Block`: Represents a command with an argument name, parameters, positionals, description, matcher, and child blocks.
  - Methods: `findParam(name)` and `findShortParam(name)` to locate parameters by name or short form.

- **`param.ts`**: Defines the `Param` class for parameter configuration.

  - Properties: `name`, `type`, `short`, `defaultValue`, `description`.

- **`parse/parse.ts`**: Contains the main `parse` function and global block logic.
  - Handles argument parsing and block traversal.
  - Supports a default global block for top-level parameters.
  - Walks the argument list token by token: a token starting with `-` is parsed as a flag, a token matching a child block's name starts a new command, and any other token fills the current block's next unfilled positional (or is appended to a trailing variadic positional). Required positionals are checked once the block is done being read (on switching to a new command, or at the end of the arguments), so flags and positionals can be interleaved in any order.

- **`parse/positional.ts`**: Owns positional-argument declaration validation.
  - `validatePositionals(positionals)`: enforces that required positionals can't follow optional ones and that a variadic positional is always last. Runs both when `Block` is constructed and when a `Cli` command pattern is parsed, so both APIs reject invalid positional declarations up front.

- **`cli/`**: Defines the `Cli` builder (`cli.ts`) and the string-pattern parsers it's built on (`parse-command.ts` for command/positional patterns, `parse-param.ts` for parameter patterns).

### Example

```javascript
import { Param, Block, parse } from "argblock";

const verboseParam = new Param({
  name: "verbose",
  type: "boolean",
  short: "v",
  defaultValue: "0",
});

const outputParam = new Param({
  name: "output",
  type: "string",
  short: "o",
  defaultValue: "./output",
});

const runBlock = new Block({
  arg: "run",
  params: [verboseParam, outputParam],
  description: "Run the application",
  children: [],
});

const args = ["run", "--verbose", "-o", "dist"];
const result = parse(args, [runBlock]);
console.log(result);
```

Output:

```javascript
[
  {
    arg: "run",
    params: {
      verbose: "1",
      output: "dist",
    },
    positionals: {},
  },
];
```

### Error Handling

The parser throws errors in the following cases:

- Unknown parameters (e.g., `--unknown`).
- Duplicated parameters in the same block.
- Invalid argument formats.
- Missing required positional arguments.
- Empty block list provided to `parse`.

### Custom Matchers

You can define custom matchers for blocks to handle complex argument patterns. A matcher receives the remaining argument list and returns whether it matched, along with the remaining elements to continue parsing from:

```javascript
import { Block } from "argblock";

const customMatcher = (elems) => {
  if (elems[0]?.startsWith("custom:")) {
    return { elems: elems.slice(1), match: true };
  }
  return { elems, match: false };
};

const customBlock = new Block({
  arg: "custom",
  params: [],
  description: "Custom command",
  matcher: customMatcher,
  children: [],
});
```

### Limitations

- Boolean parameters expect values like `0`, `1`, `true`, or `false`.
- Short parameters (`-abc`) assume boolean type with a default value of `1` unless specified.
- The parser does not support advanced features like parameter validation beyond type checking.
