# eslint-plugin-tailwind-palette-guard

ESLint plugin that enforces semantic design tokens over hardcoded colors in Tailwind CSS and inline styles.

## Why?

Hardcoded palette colors (`text-red-500`, `bg-white`) and inline color styles (`style={{ color: 'red' }}`) scatter raw color values across your codebase, making theme changes painful and dark mode support inconsistent. Semantic tokens (`text-destructive`, `bg-background`) provide a single source of truth.

## Requirements

- ESLint 9+ (flat config only)
- Node.js 18+

## Installation

```bash
npm install -D eslint-plugin-tailwind-palette-guard
```

## Usage

Use a preset or configure manually:

**Recommended** — enables `no-palette-colors` only:

```js
// eslint.config.js
import tailwindPaletteGuard from "eslint-plugin-tailwind-palette-guard";

export default [tailwindPaletteGuard.configs.recommended];
```

**Strict** — enables both rules:

```js
// eslint.config.js
import tailwindPaletteGuard from "eslint-plugin-tailwind-palette-guard";

export default [tailwindPaletteGuard.configs.strict];
```

**Manual** — full control:

```js
// eslint.config.js
import tailwindPaletteGuard from "eslint-plugin-tailwind-palette-guard";

export default [
  {
    plugins: {
      "tailwind-palette-guard": tailwindPaletteGuard,
    },
    rules: {
      "tailwind-palette-guard/no-palette-colors": ["warn", {
        allowedColors: ["stroke-gray-100"],
        allowedFiles: ["**/icons/**"],
      }],
      "tailwind-palette-guard/no-inline-color-styles": ["warn", {
        allowedProperties: ["fill"],
        allowedValues: ["transparent"],
        allowedFiles: ["**/charts/**"],
      }],
    },
  },
];
```

## Rules

### `no-palette-colors`

Flags Tailwind classes that use hardcoded colors instead of semantic design tokens.

#### What it detects

**Palette colors** — `{prefix}-{color}-{shade}` with optional `/{opacity}`:

| Pattern | Example |
| ------- | ------- |
| Static className | `className="text-red-500"` |
| cn/clsx/cx/twMerge/twJoin | `cn("text-red-500", cond && "bg-green-100")` |
| Object syntax | `cn({ "text-red-500": isError })` |
| cva definitions | `cva("base", { variants: { v: { danger: "text-red-500" } } })` |
| Template literals | `` className={`px-4 text-red-500 ${x}`} `` |
| Ternary expressions | `className={isError ? "text-red-500" : "text-green-500"}` |
| Standalone strings\* | `const color = "text-red-500"` |

\*Requires `checkAllStrings: true` (opt-in).

**Bare colors** (flagged by default) — `{prefix}-white`, `{prefix}-black`:

| Example | Use instead |
| ------- | ----------- |
| `bg-white` | `bg-background` |
| `text-black` | `text-foreground` |

> `transparent` is **not** flagged — it's a CSS reset, not a color choice.

**Arbitrary color values** — `{prefix}-[color]`:

| Example | Why flagged |
| ------- | ----------- |
| `text-[#ff0000]` | Hardcoded hex color |
| `bg-[red]` | Named CSS color |
| `border-[rgb(255,0,0)]` | Color function |
| `text-[hsl(0,100%,50%)]` | Color function |

CSS variable references like `text-[var(--color)]` are **not** flagged. Non-color arbitrary values like `text-[14px]` or `w-[100px]` are also **not** flagged.

#### What it ignores

- Semantic tokens: `text-destructive`, `bg-success`, `border-warning`
- Non-color utilities: `rounded-lg`, `p-4`, `flex`, `text-sm`
- CSS inheritance keywords: `text-inherit`, `text-current`
- Transparent: `bg-transparent`, `border-transparent`, etc.
- Tailwind modifiers are stripped before matching: `hover:`, `dark:`, `focus:`, `[&>svg]:`, etc.
- `!important` prefix: `!text-red-500` is still detected

#### Supported prefixes

`bg`, `text`, `border`, `ring`, `fill`, `stroke`, `shadow`, `outline`, `decoration`, `accent`, `caret`, `divide`, `from`, `via`, `to`, `placeholder`

#### Supported palette colors

`red`, `green`, `blue`, `amber`, `yellow`, `orange`, `emerald`, `gray`, `slate`, `violet`, `cyan`, `pink`, `purple`, `teal`, `lime`, `indigo`, `fuchsia`, `rose`, `sky`, `zinc`, `neutral`, `stone`

#### Configuration

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `allowedColors` | `string[]` | `[]` | Specific classes to allow (exact match) |
| `allowedFiles` | `string[]` | `[]` | Glob patterns for files to skip entirely |
| `allowBareColors` | `boolean` | `false` | When `true`, allows `bg-white`, `text-black`, etc. |
| `checkAllStrings` | `boolean` | `false` | When `true`, scans all string literals (not just `className` and utility calls). May be noisy in test files. |

---

### `no-inline-color-styles`

Flags inline `style` attributes that set color CSS properties with literal values, and SVG presentation attributes (`fill`, `stroke`, etc.) with hardcoded colors.

#### What it detects

```jsx
// Inline styles — all flagged:
<div style={{ color: "red" }} />
<div style={{ backgroundColor: "#ff0000" }} />
<div style={{ borderColor: "rgb(255, 0, 0)" }} />
<div style={{ color: isError ? "red" : "green" }} />

// SVG attributes — all flagged:
<svg fill="red" />
<circle stroke="#000" />
<path fill="#ff0000" />
<stop stopColor="rgb(255, 0, 0)" />
```

#### What it allows

```jsx
// Inline styles — all pass:
<div style={{ color: "var(--text-primary)" }} />   // CSS variables
<div style={{ color: "inherit" }} />                // CSS global keywords
<div style={{ color: "currentColor" }} />           // currentColor
<div style={{ color: myColor }} />                  // Dynamic expressions
<div style={{ display: "flex" }} />                 // Non-color properties

// SVG attributes — all pass:
<svg fill="none" />                                 // none (common for stroked icons)
<svg fill="currentColor" />                         // currentColor
<svg fill="url(#gradient)" />                       // Gradient/pattern references
<svg fill="var(--icon-color)" />                    // CSS variables
<svg fill={iconColor} />                            // Dynamic expressions
```

> **Note:** This rule uses a deny-by-default approach for inline style values. Any string literal that isn't a CSS variable (`var(--...)`), global keyword (`inherit`, `currentColor`, etc.), or explicitly allowed via `allowedValues` will be flagged — including `"transparent"`. Use `allowedValues: ["transparent"]` to allow it. For SVG attributes, `none`, `transparent`, and `url()` references are allowed by default.

<details>
<summary>Monitored CSS properties (inline styles)</summary>

`color`, `backgroundColor`, `borderColor`, `borderTopColor`, `borderRightColor`, `borderBottomColor`, `borderLeftColor`, `borderBlockColor`, `borderBlockStartColor`, `borderBlockEndColor`, `borderInlineColor`, `borderInlineStartColor`, `borderInlineEndColor`, `outlineColor`, `textDecorationColor`, `fill`, `stroke`, `caretColor`, `accentColor`, `columnRuleColor`, `floodColor`, `lightingColor`, `stopColor`

</details>

<details>
<summary>Monitored SVG attributes</summary>

`fill`, `stroke`, `color`, `stopColor`, `stop-color`, `floodColor`, `flood-color`, `lightingColor`, `lighting-color`

</details>

#### Configuration

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `allowedProperties` | `string[]` | `[]` | CSS properties or SVG attributes to skip (e.g. `["fill"]`) |
| `allowedValues` | `string[]` | `[]` | Values to allow (e.g. `["transparent"]`) |
| `allowedFiles` | `string[]` | `[]` | Glob patterns for files to skip entirely |

## Configs

| Config | Rules |
| ------ | ----- |
| `recommended` | `no-palette-colors: warn` |
| `strict` | `no-palette-colors: warn` + `no-inline-color-styles: warn` |

## License

MIT
