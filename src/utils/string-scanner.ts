import { isArbitraryColor, isBareColor, isPaletteColor } from "./palette-regex.js";

export interface ScanOptions {
  allowedColors?: Set<string>;
  allowBareColors?: boolean;
}

/**
 * Scans a class string (space-separated Tailwind classes) for color violations.
 * Returns an array of offending class names.
 * Checks palette colors (text-red-500), bare colors (bg-white), and arbitrary colors (text-[#ff0000]).
 */
export function scanForPaletteColors(
  classString: string,
  options: ScanOptions = {},
): string[] {
  const { allowedColors = new Set(), allowBareColors = false } = options;
  const violations: string[] = [];

  for (const token of classString.split(/\s+/)) {
    if (!token) continue;
    if (allowedColors.has(token)) continue;

    if (isPaletteColor(token)) {
      violations.push(token);
    } else if (!allowBareColors && isBareColor(token)) {
      violations.push(token);
    } else if (isArbitraryColor(token)) {
      violations.push(token);
    }
  }

  return violations;
}
