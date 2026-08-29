import type { Block, Positional } from "../block.ts";

function formatPositional(positional: Positional): string {
  const label = positional.variadic ? `...${positional.name}` : positional.name;
  return positional.required ? `<${label}>` : `[${label}]`;
}

function withDescription(label: string, description?: string): string {
  return description ? `${label} - ${description}` : label;
}

export function formatHelp(block: Block): string {
  const lines: string[] = [];

  if (block.children.length) {
    lines.push("commands:");
    for (const child of block.children) {
      lines.push(`  ${withDescription(child.arg, child.description)}`);
    }
  }

  if (block.positionals.length) {
    if (lines.length) lines.push("");
    lines.push("positionals:");
    for (const positional of block.positionals) {
      lines.push(`  ${withDescription(formatPositional(positional), positional.description)}`);
    }
  }

  if (block.params.length) {
    if (lines.length) lines.push("");
    lines.push("params:");
    for (const param of block.params) {
      const names = param.short ? `--${param.name}, -${param.short}` : `--${param.name}`;
      lines.push(`  ${withDescription(`${names} ${param.type}`, param.description)}`);
    }
  }

  return lines.join("\n");
}
