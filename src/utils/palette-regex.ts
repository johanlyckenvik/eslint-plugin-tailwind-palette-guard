import { isColorValue } from "./css-colors.js";

const PREFIXES = [
  "bg",
  "text",
  "border",
  "ring",
  "fill",
  "stroke",
  "shadow",
  "outline",
  "decoration",
  "accent",
  "caret",
  "divide",
  "from",
  "via",
  "to",
  "placeholder",
] as const;

const COLORS = [
  "red",
  "green",
  "blue",
  "amber",
  "yellow",
  "orange",
  "emerald",
  "gray",
  "slate",
  "violet",
  "cyan",
  "pink",
  "purple",
  "teal",
  "lime",
  "indigo",
  "fuchsia",
  "rose",
  "sky",
  "zinc",
  "neutral",
  "stone",
] as const;

const SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

const BARE_COLORS = ["white", "black"] as const;

const prefixGroup = PREFIXES.join("|");
const colorGroup = COLORS.join("|");
const shadeGroup = SHADES.join("|");
const bareGroup = BARE_COLORS.join("|");

// Match: prefix-color-shade with optional /opacity
const PALETTE_REGEX = new RegExp(
  `^(${prefixGroup})-(${colorGroup})-(${shadeGroup})(\\/\\d+)?$`,
);

// Match: prefix-white, prefix-black with optional /opacity
const BARE_COLOR_REGEX = new RegExp(
  `^(${prefixGroup})-(${bareGroup})(\\/\\d+)?$`,
);

// Match: prefix-[...] with optional /opacity
const ARBITRARY_COLOR_REGEX = new RegExp(
  `^(${prefixGroup})-\\[([^\\]]+)\\](\\/\\d+)?$`,
);

/**
 * Strips Tailwind modifiers from a class name.
 * Modifiers are everything before (and including) the last colon.
 * e.g. "hover:dark:text-red-500" → "text-red-500"
 * e.g. "[&>svg]:text-red-500" → "text-red-500"
 */
export function stripModifiers(className: string): string {
  const lastColon = className.lastIndexOf(":");
  if (lastColon === -1) return className;
  return className.slice(lastColon + 1);
}

function cleanClass(className: string): string {
  const base = stripModifiers(className);
  return base.startsWith("!") ? base.slice(1) : base;
}

/**
 * Checks if a Tailwind class is a hardcoded palette color (with shade).
 * e.g. text-red-500, bg-green-100
 */
export function isPaletteColor(className: string): boolean {
  return PALETTE_REGEX.test(cleanClass(className));
}

/**
 * Checks if a Tailwind class is a bare color (no shade).
 * e.g. bg-white, text-black
 */
export function isBareColor(className: string): boolean {
  return BARE_COLOR_REGEX.test(cleanClass(className));
}

/**
 * Checks if a Tailwind class uses an arbitrary color value.
 * e.g. text-[#ff0000], bg-[red], border-[rgb(255,0,0)]
 * Does NOT flag non-color arbitrary values like text-[14px] or bg-[url(...)].
 */
export function isArbitraryColor(className: string): boolean {
  const cleaned = cleanClass(className);
  const match = ARBITRARY_COLOR_REGEX.exec(cleaned);
  if (!match) return false;

  const bracketContent = match[2];

  // Allow CSS variable references
  if (bracketContent.startsWith("var(")) return false;

  // Check if the bracket content is a color value
  return isColorValue(bracketContent);
}

export { PREFIXES, COLORS, SHADES, BARE_COLORS };
