/**
 * CSS properties that accept color values.
 */
export const COLOR_PROPERTIES = new Set([
  "color",
  "backgroundColor",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderBlockColor",
  "borderBlockStartColor",
  "borderBlockEndColor",
  "borderInlineColor",
  "borderInlineStartColor",
  "borderInlineEndColor",
  "outlineColor",
  "textDecorationColor",
  "fill",
  "stroke",
  "caretColor",
  "accentColor",
  "columnRuleColor",
  "floodColor",
  "lightingColor",
  "stopColor",
]);

/**
 * Shorthand CSS properties that can embed color values (e.g. `border: 1px solid red`).
 * These are handled separately from COLOR_PROPERTIES because their values are compound
 * (not pure colors), requiring embedded color token detection rather than a plain disallow.
 */
export const SHORTHAND_COLOR_PROPERTIES = new Set([
  "border",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "borderBlock",
  "borderBlockStart",
  "borderBlockEnd",
  "borderInline",
  "borderInlineStart",
  "borderInlineEnd",
  "outline",
  "background",
  "boxShadow",
  "textShadow",
  "columnRule",
]);

/**
 * SVG presentation attributes that accept color values.
 */
export const SVG_COLOR_ATTRIBUTES = new Set([
  "fill",
  "stroke",
  "color",
  "stopColor",
  "stop-color",
  "floodColor",
  "flood-color",
  "lightingColor",
  "lighting-color",
]);

/**
 * CSS global keywords and color keywords that are inherently non-hardcoded.
 * These inherit behavior or reset, so they don't represent a hardcoded color choice.
 */
export const CSS_GLOBAL_VALUES = new Set([
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
  "currentColor",
  "currentcolor",
]);

/**
 * Values that are allowed for SVG color attributes (non-color meanings).
 */
export const SVG_ALLOWED_VALUES = new Set([
  "none",
  "transparent",
  "inherit",
  "initial",
  "unset",
  "revert",
  "currentColor",
  "currentcolor",
  "context-fill",
  "context-stroke",
]);

/**
 * All W3C CSS named colors. Used to detect arbitrary color values in Tailwind brackets.
 */
export const CSS_NAMED_COLORS = new Set([
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure",
  "beige", "bisque", "black", "blanchedalmond", "blue", "blueviolet",
  "brown", "burlywood",
  "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue",
  "cornsilk", "crimson", "cyan",
  "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen",
  "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange",
  "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue",
  "darkslategray", "darkslategrey", "darkturquoise", "darkviolet",
  "deeppink", "deepskyblue", "dimgray", "dimgrey", "dodgerblue",
  "firebrick", "floralwhite", "forestgreen", "fuchsia",
  "gainsboro", "ghostwhite", "gold", "goldenrod", "gray", "green",
  "greenyellow", "grey",
  "honeydew", "hotpink",
  "indianred", "indigo", "ivory",
  "khaki",
  "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue",
  "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray",
  "lightgreen", "lightgrey", "lightpink", "lightsalmon", "lightseagreen",
  "lightskyblue", "lightslategray", "lightslategrey", "lightsteelblue",
  "lightyellow", "lime", "limegreen", "linen",
  "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid",
  "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen",
  "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream",
  "mistyrose", "moccasin",
  "navajowhite", "navy",
  "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid",
  "palegoldenrod", "palegreen", "paleturquoise", "palevioletred",
  "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue",
  "purple",
  "rebeccapurple", "red", "rosybrown", "royalblue",
  "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna",
  "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow",
  "springgreen", "steelblue",
  "tan", "teal", "thistle", "tomato", "turquoise",
  "violet",
  "wheat", "white", "whitesmoke",
  "yellow", "yellowgreen",
]);

/**
 * Checks if a compound CSS value (e.g. "1px solid #e0e0e0") contains an embedded color token.
 * Used for shorthand properties like `border`, `background`, `boxShadow`.
 */
export function containsColorToken(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("var(")) return false;

  // Hex color anywhere in the value
  if (/#[0-9a-fA-F]{3,8}\b/.test(trimmed)) return true;

  // Color function anywhere in the value
  if (/\b(rgba?|hsla?|oklch|oklab|lch|lab|color)\(/.test(trimmed)) return true;

  // Named colors as whitespace/comma-separated tokens
  const tokens = trimmed.split(/[\s,]+/);
  return tokens.some((token) => CSS_NAMED_COLORS.has(token.toLowerCase()));
}

/**
 * Checks if a value looks like a CSS color (for arbitrary Tailwind value detection).
 * Returns true for hex, rgb/hsl functions, and named CSS colors.
 */
export function isColorValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();

  // Hex color: #rgb, #rgba, #rrggbb, #rrggbbaa
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(trimmed)) return true;

  // Color functions: rgb(), rgba(), hsl(), hsla(), oklch(), oklab(), lch(), lab(), color()
  if (/^(rgba?|hsla?|oklch|oklab|lch|lab|color)\(/.test(trimmed)) return true;

  // Named CSS color
  if (CSS_NAMED_COLORS.has(trimmed)) return true;

  return false;
}
