import type { Rule } from "eslint";
import { minimatch } from "minimatch";
import type { InlineColorRuleOptions } from "../types.js";
import {
  COLOR_PROPERTIES,
  CSS_GLOBAL_VALUES,
  SVG_ALLOWED_VALUES,
  SVG_COLOR_ATTRIBUTES,
} from "../utils/css-colors.js";

function isColorProperty(name: string, allowedProperties: Set<string>): boolean {
  if (allowedProperties.has(name)) return false;
  return COLOR_PROPERTIES.has(name);
}

function isDisallowedValue(value: string, allowedValues: Set<string>): boolean {
  const trimmed = value.trim();
  if (allowedValues.has(trimmed)) return false;
  if (CSS_GLOBAL_VALUES.has(trimmed)) return false;
  // Allow CSS variable references
  if (trimmed.startsWith("var(")) return false;
  return true;
}

function isSvgColorAttribute(name: string, allowedProperties: Set<string>): boolean {
  if (allowedProperties.has(name)) return false;
  return SVG_COLOR_ATTRIBUTES.has(name);
}

function isDisallowedSvgValue(value: string, allowedValues: Set<string>): boolean {
  const trimmed = value.trim();
  if (allowedValues.has(trimmed)) return false;
  if (SVG_ALLOWED_VALUES.has(trimmed)) return false;
  // Allow CSS variable references
  if (trimmed.startsWith("var(")) return false;
  // Allow url() references (gradients, patterns)
  if (trimmed.startsWith("url(")) return false;
  return true;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow inline style color properties and SVG color attributes; use Tailwind classes or design tokens instead",
    },
    messages: {
      inlineColor:
        "Avoid inline color style '{{property}}: {{value}}'. Use a Tailwind class or design token instead.",
      svgColor:
        "Avoid hardcoded SVG color '{{attribute}}=\"{{value}}\"'. Use a design token (e.g. currentColor or a CSS variable) instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedProperties: {
            type: "array",
            items: { type: "string" },
          },
          allowedValues: {
            type: "array",
            items: { type: "string" },
          },
          allowedFiles: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options: InlineColorRuleOptions = context.options[0] ?? {};
    const allowedProperties = new Set(options.allowedProperties ?? []);
    const allowedValues = new Set(options.allowedValues ?? []);
    const allowedFiles = options.allowedFiles ?? [];

    if (
      allowedFiles.length > 0 &&
      allowedFiles.some((pattern) => minimatch(context.filename, pattern, { dot: true }))
    ) {
      return {};
    }

    function checkStyleValue(node: Rule.Node, property: string, value: Rule.Node) {
      switch (value.type) {
        case "Literal":
          if (typeof value.value === "string") {
            if (isDisallowedValue(value.value, allowedValues)) {
              context.report({
                node: value,
                messageId: "inlineColor",
                data: { property, value: value.value },
              });
            }
          }
          break;
        case "TemplateLiteral":
          if (value.expressions.length === 0 && value.quasis.length === 1) {
            const raw = value.quasis[0].value.raw;
            if (isDisallowedValue(raw, allowedValues)) {
              context.report({
                node: value,
                messageId: "inlineColor",
                data: { property, value: raw },
              });
            }
          }
          break;
        case "ConditionalExpression":
          checkStyleValue(node, property, value.consequent as Rule.Node);
          checkStyleValue(node, property, value.alternate as Rule.Node);
          break;
      }
    }

    return {
      // Inline style={{ color: "red" }}
      'JSXAttribute[name.name="style"]'(node: Rule.Node) {
        const attr = node as unknown as {
          value: { type: string; expression?: Rule.Node } | null;
        };
        if (!attr.value) return;
        if (attr.value.type !== "JSXExpressionContainer") return;

        const expr = attr.value.expression;
        if (!expr || (expr as { type: string }).type !== "ObjectExpression") return;

        const obj = expr as unknown as {
          properties: Array<{
            type: string;
            key: { type: string; name?: string; value?: string };
            value: Rule.Node;
          }>;
        };

        for (const prop of obj.properties) {
          if (prop.type !== "Property") continue;

          let propertyName: string | undefined;
          if (prop.key.type === "Identifier") {
            propertyName = prop.key.name;
          } else if (prop.key.type === "Literal" && typeof prop.key.value === "string") {
            propertyName = prop.key.value;
          }

          if (!propertyName) continue;
          if (!isColorProperty(propertyName, allowedProperties)) continue;

          checkStyleValue(node, propertyName, prop.value);
        }
      },

      // SVG color attributes: <svg fill="red">, <circle stroke="#000">
      JSXAttribute(node: Rule.Node) {
        const attr = node as unknown as {
          name: { type: string; name?: string };
          value: { type: string; value?: string; expression?: Rule.Node } | null;
        };

        // Skip non-identifier attribute names (JSXNamespacedName etc.)
        if (attr.name.type !== "JSXIdentifier") return;
        const attrName = attr.name.name!;

        // Skip style (handled above) and className (handled by no-palette-colors)
        if (attrName === "style" || attrName === "className") return;

        if (!isSvgColorAttribute(attrName, allowedProperties)) return;

        if (!attr.value) return;

        if (attr.value.type === "Literal" && typeof attr.value.value === "string") {
          if (isDisallowedSvgValue(attr.value.value, allowedValues)) {
            context.report({
              node: attr.value as unknown as Rule.Node,
              messageId: "svgColor",
              data: { attribute: attrName, value: attr.value.value },
            });
          }
        } else if (attr.value.type === "JSXExpressionContainer" && attr.value.expression) {
          const expr = attr.value.expression;
          if (expr.type === "Literal" && typeof expr.value === "string") {
            if (isDisallowedSvgValue(expr.value, allowedValues)) {
              context.report({
                node: expr,
                messageId: "svgColor",
                data: { attribute: attrName, value: expr.value },
              });
            }
          } else if (expr.type === "ConditionalExpression") {
            for (const branch of [expr.consequent, expr.alternate] as Rule.Node[]) {
              if (branch.type === "Literal" && typeof branch.value === "string") {
                if (isDisallowedSvgValue(branch.value, allowedValues)) {
                  context.report({
                    node: branch,
                    messageId: "svgColor",
                    data: { attribute: attrName, value: branch.value },
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};

export default rule;
