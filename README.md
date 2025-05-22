# Argblock

`argblock` is a lightweight and flexible JavaScript/TypeScript library for parsing command-line arguments. It supports long (`--flag`), short (`-f`), and negated (`--no-flag`) parameter formats, as well as nested command structures with custom argument matching.

## Installation

Install the library via npm:

```bash
npm i argblock
```

## Usage

### Importing

Import the necessary components from the `argblock` package:

```javascript
import { Param, Block, parse } from "argblock";
```

### Defining Parameters and Blocks

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
     },
   ];
   ```

### Key Features

- **Long Parameters**: Supports `--name value` and `--name=value` formats.
- **Short Parameters**: Supports `-f` for single flags and `-abc` for multiple boolean flags.
- **Negated Parameters**: Supports `--no-name` for boolean flags.
- **Custom Matchers**: Allows custom matching logic for blocks via the `matcher` property.
- **Nested Commands**: Supports hierarchical command structures through `children` in `Block`.
- **Error Handling**: Throws descriptive errors for unknown or duplicated parameters.

### Code Structure

The library consists of several internal modules:

- **`block.ts`**: Defines the `Block` class and a default matcher for argument matching.

  - `Block`: Represents a command with an argument name, parameters, description, matcher, and child blocks.
  - Methods: `findParam(name)` and `findShortParam(name)` to locate parameters by name or short form.

- **`param.ts`**: Defines the `Param` class for parameter configuration.

  - Properties: `name`, `type`, `short`, `defaultValue`.

- **`parse.ts`**: Contains the main `parse` function and global block logic.
  - Handles argument parsing and block traversal.
  - Supports a default global block for top-level parameters.

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
  },
];
```

### Error Handling

The parser throws errors in the following cases:

- Unknown parameters (e.g., `--unknown`).
- Duplicated parameters in the same block.
- Invalid argument formats.
- Empty block list provided to `parse`.

### Custom Matchers

You can define custom matchers for blocks to handle complex argument patterns:

```javascript
import { Block } from "argblock";

const customMatcher = (args, index) => {
  if (args[index].startsWith("custom:")) {
    return { jumpNext: 0, match: true };
  }
  return { jumpNext: 0, match: false };
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
