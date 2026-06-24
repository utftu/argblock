import type { Command } from "./command.ts";
import type { Param } from "../param.ts";

const PAD = 26;

const formatParam = (param: Param): string => {
  const short = param.short ? `-${param.short}, ` : "    ";
  const value = param.type !== "boolean" ? ` <${param.name}>` : "";
  return `${short}--${param.name}${value}`;
};

const formatDefault = (param: Param): string => {
  if (param.defaultValue === undefined) return "";
  return ` (default: ${String(param.defaultValue)})`;
};

export const printGlobalHelp = (
  appName: string,
  commands: Command[],
  globalParams: Param[]
): void => {
  const hasCommands = commands.some((c) => c.name !== "");

  if (hasCommands) {
    console.log(`Usage:`);
    console.log(`  $ ${appName} <command> [options]\n`);
    console.log(`Commands:`);
    for (const cmd of commands) {
      if (cmd.name === "") continue;
      const pos = cmd.positionals
        .map((p) => (p.required ? `<${p.name}>` : `[${p.name}]`))
        .join(" ");
      const sig = [cmd.name, pos].filter(Boolean).join(" ");
      console.log(
        `  ${sig.padEnd(PAD)} ${cmd.block.description}`
      );
    }
  } else {
    const defaultCmd = commands.find((c) => c.name === "");
    if (defaultCmd) {
      const pos = defaultCmd.positionals
        .map((p) => (p.required ? `<${p.name}>` : `[${p.name}]`))
        .join(" ");
      const sig = [appName, pos, "[options]"].filter(Boolean).join(" ");
      console.log(`Usage:`);
      console.log(`  $ ${sig}\n`);
    }
  }

  const allParams = [
    ...globalParams,
    ...commands.flatMap((c) => (c.name === "" ? c.block.params : [])),
  ];

  if (allParams.length > 0) {
    console.log(`\nOptions:`);
    for (const param of allParams) {
      const flag = formatParam(param);
      console.log(
        `  ${flag.padEnd(PAD)} ${param.description}${formatDefault(param)}`
      );
    }
  }

  console.log(`  ${`-h, --help`.padEnd(PAD)} Display this message`);
  console.log();
};

export const printCommandHelp = (
  appName: string,
  cmd: Command,
  globalParams: Param[]
): void => {
  const pos = cmd.positionals
    .map((p) => (p.required ? `<${p.name}>` : `[${p.name}]`))
    .join(" ");
  const sig = [appName, cmd.name, pos, "[options]"].filter(Boolean).join(" ");

  console.log(`Usage:`);
  console.log(`  $ ${sig}\n`);

  if (cmd.block.description) {
    console.log(`${cmd.block.description}\n`);
  }

  const params = [...globalParams, ...cmd.block.params];
  if (params.length > 0) {
    console.log(`Options:`);
    for (const param of params) {
      const flag = formatParam(param);
      console.log(
        `  ${flag.padEnd(PAD)} ${param.description}${formatDefault(param)}`
      );
    }
  }

  console.log(`  ${`-h, --help`.padEnd(PAD)} Display this message`);
  console.log();
};
