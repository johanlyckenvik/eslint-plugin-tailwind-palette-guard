import type { ESLint } from "eslint";
import noInlineColorStyles from "./rules/no-inline-color-styles.js";
import noPaletteColors from "./rules/no-palette-colors.js";

const plugin: ESLint.Plugin = {
  meta: {
    name: "eslint-plugin-tailwind-palette-guard",
    version: "0.1.0",
  },
  rules: {
    "no-palette-colors": noPaletteColors,
    "no-inline-color-styles": noInlineColorStyles,
  },
  configs: {},
};

// Self-referencing configs for flat config compatibility
Object.assign(plugin.configs!, {
  recommended: {
    plugins: {
      "tailwind-palette-guard": plugin,
    },
    rules: {
      "tailwind-palette-guard/no-palette-colors": "warn",
    },
  },
  strict: {
    plugins: {
      "tailwind-palette-guard": plugin,
    },
    rules: {
      "tailwind-palette-guard/no-palette-colors": "warn",
      "tailwind-palette-guard/no-inline-color-styles": "warn",
    },
  },
});

export default plugin;
