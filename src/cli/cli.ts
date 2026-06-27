import { parseCommand } from "./parse-command.ts";
import { parseParam } from "./parse-param.ts";

class Cli {
  constructor() {}

  param(pattern: string, description?: string) {
    const param = parseParam(pattern, description);
  }

  command(pattern: string, description?: string) {
    const param = parseCommand(pattern, description);
  }
}
