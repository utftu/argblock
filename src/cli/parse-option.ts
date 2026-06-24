export type OptionDef = {
  name: string;
  short?: string;
  description: string;
  hasValue: boolean;
  defaultValue?: unknown;
};

const kebabToCamel = (s: string) =>
  s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

export const parseOptionFlags = (
  flags: string,
  description: string,
  config?: { default?: unknown }
): OptionDef => {
  let hasValue = false;
  const stripped = flags
    .replace(/<[^>]+>/g, () => {
      hasValue = true;
      return "";
    })
    .replace(/\[[^\]]+\]/g, () => {
      hasValue = true;
      return "";
    });

  let name = "";
  let short: string | undefined;

  for (const part of stripped.split(",").map((s) => s.trim())) {
    if (part.startsWith("--")) {
      name = part.slice(2).trim();
    } else if (part.startsWith("-")) {
      short = part.slice(1).trim();
    }
  }

  return { name, short, description, hasValue, defaultValue: config?.default };
};
