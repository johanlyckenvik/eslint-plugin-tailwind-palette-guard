import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import rule from "../../src/rules/no-inline-color-styles.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

describe("no-inline-color-styles", () => {
  it("passes RuleTester", () => {
    ruleTester.run("no-inline-color-styles", rule, {
      valid: [
        // No style attribute
        { code: '<div className="text-red-500" />' },

        // Non-color CSS properties
        { code: '<div style={{ display: "flex" }} />' },
        { code: '<div style={{ padding: "10px" }} />' },
        { code: '<div style={{ fontSize: "14px" }} />' },

        // Shorthand properties without embedded color — should pass
        { code: '<div style={{ border: "none" }} />' },
        { code: '<div style={{ border: "1px solid" }} />' },
        { code: '<div style={{ borderTop: "0" }} />' },
        { code: '<div style={{ background: "var(--bg)" }} />' },
        { code: '<div style={{ boxShadow: "0 0 10px var(--shadow)" }} />' },

        // CSS variable references — allowed
        { code: '<div style={{ color: "var(--text-primary)" }} />' },
        { code: '<div style={{ backgroundColor: "var(--bg-card)" }} />' },
        { code: '<div style={{ borderColor: "var(--border)" }} />' },

        // CSS global keywords — allowed
        { code: '<div style={{ color: "inherit" }} />' },
        { code: '<div style={{ backgroundColor: "initial" }} />' },
        { code: '<div style={{ color: "unset" }} />' },
        { code: '<div style={{ color: "revert" }} />' },
        { code: '<div style={{ color: "currentColor" }} />' },
        { code: '<div style={{ color: "currentcolor" }} />' },

        // Non-literal values (expressions) — can't statically analyze, skip
        { code: "<div style={{ color: myColor }} />" },
        { code: "<div style={{ color: getColor() }} />" },
        { code: "<div style={{ backgroundColor: theme.primary }} />" },

        // Template literal with expressions — can't statically analyze, skip
        { code: "<div style={{ color: `${baseColor}` }} />" },

        // Empty style
        { code: "<div style={{}} />" },

        // allowedProperties option
        {
          code: '<div style={{ fill: "red" }} />',
          options: [{ allowedProperties: ["fill"] }],
        },

        // allowedValues option
        {
          code: '<div style={{ color: "transparent" }} />',
          options: [{ allowedValues: ["transparent"] }],
        },

        // allowedFiles option
        {
          code: '<div style={{ color: "red" }} />',
          options: [{ allowedFiles: ["**/icons/**"] }],
          filename: "/project/src/icons/Arrow.tsx",
        },

        // SVG attributes — allowed values
        { code: '<svg fill="none" />' },
        { code: '<svg fill="currentColor" />' },
        { code: '<svg fill="currentcolor" />' },
        { code: '<svg fill="inherit" />' },
        { code: '<svg fill="transparent" />' },
        { code: '<svg fill="initial" />' },
        { code: '<svg fill="unset" />' },
        { code: '<svg fill="url(#gradient)" />' },
        { code: '<svg fill="var(--icon-color)" />' },
        { code: '<svg fill="context-fill" />' },
        { code: '<circle stroke="none" />' },
        { code: '<circle stroke="currentColor" />' },

        // SVG non-color attributes — should pass
        { code: '<svg viewBox="0 0 24 24" />' },
        { code: '<rect width="100" height="100" />' },
        { code: '<path d="M0 0L10 10" />' },

        // SVG with dynamic expressions — can't statically analyze, skip
        { code: "<svg fill={iconColor} />" },
        { code: "<svg fill={getColor()} />" },

        // SVG allowedProperties
        {
          code: '<svg fill="red" />',
          options: [{ allowedProperties: ["fill"] }],
        },

        // SVG allowedValues
        {
          code: '<svg fill="red" />',
          options: [{ allowedValues: ["red"] }],
        },

        // SVG allowedFiles
        {
          code: '<svg fill="red" />',
          options: [{ allowedFiles: ["**/icons/**"] }],
          filename: "/project/src/icons/Arrow.tsx",
        },
      ],

      invalid: [
        // Named CSS colors
        {
          code: '<div style={{ color: "red" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "color", value: "red" } },
          ],
        },
        {
          code: '<div style={{ color: "blue" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "color", value: "blue" } },
          ],
        },

        // Hex colors
        {
          code: '<div style={{ color: "#ff0000" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "color", value: "#ff0000" } },
          ],
        },
        {
          code: '<div style={{ color: "#fff" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "color", value: "#fff" } },
          ],
        },

        // RGB/RGBA
        {
          code: '<div style={{ color: "rgb(255, 0, 0)" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "color", value: "rgb(255, 0, 0)" },
            },
          ],
        },
        {
          code: '<div style={{ color: "rgba(255, 0, 0, 0.5)" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "color", value: "rgba(255, 0, 0, 0.5)" },
            },
          ],
        },

        // HSL
        {
          code: '<div style={{ color: "hsl(0, 100%, 50%)" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "color", value: "hsl(0, 100%, 50%)" },
            },
          ],
        },

        // transparent — flagged by default (no special treatment)
        {
          code: '<div style={{ color: "transparent" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "color", value: "transparent" },
            },
          ],
        },

        // backgroundColor
        {
          code: '<div style={{ backgroundColor: "#f0f0f0" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "backgroundColor", value: "#f0f0f0" },
            },
          ],
        },

        // borderColor
        {
          code: '<div style={{ borderColor: "gray" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "borderColor", value: "gray" },
            },
          ],
        },

        // Multiple color properties
        {
          code: '<div style={{ color: "red", backgroundColor: "blue" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "color", value: "red" } },
            {
              messageId: "inlineColor",
              data: { property: "backgroundColor", value: "blue" },
            },
          ],
        },

        // Various color properties
        {
          code: '<div style={{ outlineColor: "red" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "outlineColor", value: "red" },
            },
          ],
        },
        {
          code: '<div style={{ textDecorationColor: "red" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "textDecorationColor", value: "red" },
            },
          ],
        },
        {
          code: '<div style={{ fill: "red" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "fill", value: "red" } },
          ],
        },
        {
          code: '<div style={{ stroke: "red" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "stroke", value: "red" } },
          ],
        },
        {
          code: '<div style={{ caretColor: "red" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "caretColor", value: "red" } },
          ],
        },
        {
          code: '<div style={{ accentColor: "blue" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "accentColor", value: "blue" },
            },
          ],
        },

        // Ternary expression — flags both branches
        {
          code: '<div style={{ color: isError ? "red" : "green" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "color", value: "red" } },
            { messageId: "inlineColor", data: { property: "color", value: "green" } },
          ],
        },

        // Static template literal (no expressions)
        {
          code: '<div style={{ color: `red` }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "color", value: "red" } },
          ],
        },

        // String literal property key
        {
          code: '<div style={{ "backgroundColor": "red" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "backgroundColor", value: "red" },
            },
          ],
        },

        // borderTopColor and friends
        {
          code: '<div style={{ borderTopColor: "red" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "borderTopColor", value: "red" },
            },
          ],
        },

        // allowedFiles — file NOT matching still flagged
        {
          code: '<div style={{ color: "red" }} />',
          options: [{ allowedFiles: ["**/icons/**"] }],
          filename: "/project/src/components/Alert.tsx",
          errors: [
            { messageId: "inlineColor", data: { property: "color", value: "red" } },
          ],
        },

        // allowedProperties — other properties still flagged
        {
          code: '<div style={{ fill: "red", color: "blue" }} />',
          options: [{ allowedProperties: ["fill"] }],
          errors: [
            { messageId: "inlineColor", data: { property: "color", value: "blue" } },
          ],
        },

        // allowedValues — other values still flagged
        {
          code: '<div style={{ color: "transparent", backgroundColor: "red" }} />',
          options: [{ allowedValues: ["transparent"] }],
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "backgroundColor", value: "red" },
            },
          ],
        },

        // Bug fix: shorthand CSS properties with embedded color tokens
        {
          code: '<div style={{ borderTop: "1px solid #e0e0e0" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "borderTop", value: "1px solid #e0e0e0" },
            },
          ],
        },
        {
          code: '<div style={{ border: "1px solid red" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "border", value: "1px solid red" } },
          ],
        },
        {
          code: '<div style={{ background: "#f0f0f0" }} />',
          errors: [
            { messageId: "inlineColor", data: { property: "background", value: "#f0f0f0" } },
          ],
        },
        {
          code: '<div style={{ boxShadow: "0 0 10px rgba(0,0,0,0.5)" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "boxShadow", value: "0 0 10px rgba(0,0,0,0.5)" },
            },
          ],
        },
        {
          code: '<div style={{ outline: "2px solid rgb(255, 0, 0)" }} />',
          errors: [
            {
              messageId: "inlineColor",
              data: { property: "outline", value: "2px solid rgb(255, 0, 0)" },
            },
          ],
        },

        // SVG color attributes
        {
          code: '<svg fill="red" />',
          errors: [
            { messageId: "svgColor", data: { attribute: "fill", value: "red" } },
          ],
        },
        {
          code: '<circle stroke="#000" />',
          errors: [
            { messageId: "svgColor", data: { attribute: "stroke", value: "#000" } },
          ],
        },
        {
          code: '<path fill="#ff0000" />',
          errors: [
            { messageId: "svgColor", data: { attribute: "fill", value: "#ff0000" } },
          ],
        },
        {
          code: '<rect fill="rgb(255, 0, 0)" />',
          errors: [
            {
              messageId: "svgColor",
              data: { attribute: "fill", value: "rgb(255, 0, 0)" },
            },
          ],
        },

        // SVG color via expression
        {
          code: '<svg fill={"red"} />',
          errors: [
            { messageId: "svgColor", data: { attribute: "fill", value: "red" } },
          ],
        },

        // SVG ternary
        {
          code: '<svg fill={active ? "red" : "blue"} />',
          errors: [
            { messageId: "svgColor", data: { attribute: "fill", value: "red" } },
            { messageId: "svgColor", data: { attribute: "fill", value: "blue" } },
          ],
        },

        // SVG stopColor
        {
          code: '<stop stopColor="#ff0000" />',
          errors: [
            {
              messageId: "svgColor",
              data: { attribute: "stopColor", value: "#ff0000" },
            },
          ],
        },

        // SVG allowedProperties — fill allowed, stroke still flagged
        {
          code: '<svg fill="red" stroke="blue" />',
          options: [{ allowedProperties: ["fill"] }],
          errors: [
            { messageId: "svgColor", data: { attribute: "stroke", value: "blue" } },
          ],
        },

        // SVG allowedValues — specific value allowed
        {
          code: '<svg fill="red" stroke="blue" />',
          options: [{ allowedValues: ["red"] }],
          errors: [
            { messageId: "svgColor", data: { attribute: "stroke", value: "blue" } },
          ],
        },
      ],
    });
  });
});
