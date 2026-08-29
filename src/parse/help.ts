import type { Block, Positional } from "../block.ts";
import type { Param } from "../param.ts";
import { globalArg } from "./global-arg.ts";

function formatPositional(positional: Positional): string {
  const label = positional.variadic ? `...${positional.name}` : positional.name;
  return positional.required ? `<${label}>` : `[${label}]`;
}

function formatParam(param: Param): string {
  const names = param.short ? `--${param.name}, -${param.short}` : `--${param.name}`;
  return [names, param.type, param.description].filter(Boolean).join("  ");
}

export function formatHelp(block: Block): string {
  const name = block.arg === globalArg ? "<command>" : block.arg;
  const usage = [name, ...block.positionals.map(formatPositional)];
  if (block.params.length) usage.push("[options]");

  const lines = [`Usage: ${usage.join(" ")}`];

  if (block.description) {
    lines.push("", block.description);
  }

  if (block.positionals.length) {
    lines.push("", "Arguments:");
    for (const positional of block.positionals) {
      lines.push(`  ${formatPositional(positional)}`);
    }
  }

  if (block.params.length) {
    lines.push("", "Options:");
    for (const param of block.params) {
      lines.push(`  ${formatParam(param)}`);
    }
  }

  if (block.children.length) {
    lines.push("", "Commands:");
    for (const child of block.children) {
      lines.push(child.description ? `  ${child.arg}  ${child.description}` : `  ${child.arg}`);
    }
  }

  return lines.join("\n");
}
