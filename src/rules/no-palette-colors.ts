import type { Rule } from "eslint";
import { minimatch } from "minimatch";
import type { RuleOptions } from "../types.js";
import {
  extractCvaStrings,
  extractStringNodes,
  isClassUtility,
  isCvaCall,
} from "../utils/class-extractors.js";
import { scanForPaletteColors } from "../utils/string-scanner.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hardcoded Tailwind palette colors; use semantic design tokens instead",
    },
    messages: {
      paletteColor:
        "Avoid hardcoded palette color '{{className}}'. Use a semantic design token instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedColors: {
            type: "array",
            items: { type: "string" },
          },
          allowedFiles: {
            type: "array",
            items: { type: "string" },
          },
          allowBareColors: {
            type: "boolean",
          },
          checkAllStrings: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options: RuleOptions = context.options[0] ?? {};
    const allowedColors = new Set(options.allowedColors ?? []);
    const allowedFiles = options.allowedFiles ?? [];
    const allowBareColors = options.allowBareColors ?? false;
    const checkAllStrings = options.checkAllStrings ?? false;

    // Check if this file should be skipped
    if (
      allowedFiles.length > 0 &&
      allowedFiles.some((pattern) => minimatch(context.filename, pattern, { dot: true }))
    ) {
      return {};
    }

    const scanOptions = { allowedColors, allowBareColors };

    // Track nodes already reported by specific visitors to avoid double-reporting
    const handledNodes = new WeakSet<object>();

    function reportViolations(node: Rule.Node, classString: string) {
      for (const className of scanForPaletteColors(classString, scanOptions)) {
        context.report({
          node,
          messageId: "paletteColor",
          data: { className },
        });
      }
    }

    function processNode(node: Rule.Node) {
      for (const extracted of extractStringNodes(node)) {
        if (handledNodes.has(extracted.node)) continue;
        handledNodes.add(extracted.node);
        reportViolations(extracted.node, extracted.value);
      }
    }

    return {
      // className="..." / className={`...`} / className={cond ? "..." : "..."}
      'JSXAttribute[name.name="className"]'(node: Rule.Node) {
        const attr = node as unknown as {
          value:
            | { type: "Literal"; value: string }
            | { type: "JSXExpressionContainer"; expression: Rule.Node }
            | null;
        };
        if (!attr.value) return;

        if (attr.value.type === "Literal" && typeof attr.value.value === "string") {
          const literalNode = attr.value as unknown as Rule.Node;
          if (!handledNodes.has(literalNode)) {
            handledNodes.add(literalNode);
            reportViolations(literalNode, attr.value.value);
          }
        } else if (attr.value.type === "JSXExpressionContainer") {
          processNode(attr.value.expression);
        }
      },

      // cn(...), clsx(...), classnames(...), cva(...)
      CallExpression(node: Rule.Node) {
        if (node.type !== "CallExpression") return;

        if (isCvaCall(node)) {
          for (const extracted of extractCvaStrings(node)) {
            if (handledNodes.has(extracted.node)) continue;
            handledNodes.add(extracted.node);
            reportViolations(extracted.node, extracted.value);
          }
        } else if (isClassUtility(node)) {
          for (const arg of node.arguments) {
            processNode(arg as Rule.Node);
          }
        }
      },

      // Catch-all: any string literal not already handled by specific visitors
      // Only enabled when checkAllStrings is true (opt-in)
      ...(checkAllStrings
        ? {
            Literal(node: Rule.Node) {
              if (handledNodes.has(node)) return;
              if (node.type !== "Literal") return;
              if (typeof node.value !== "string") return;
              reportViolations(node, node.value);
            },

            TemplateLiteral(node: Rule.Node) {
              if (handledNodes.has(node)) return;
              if (node.type !== "TemplateLiteral") return;
              for (const quasi of node.quasis) {
                if (handledNodes.has(quasi)) continue;
                if (quasi.value.raw) {
                  reportViolations(quasi as unknown as Rule.Node, quasi.value.raw);
                }
              }
            },
          }
        : {}),
    };
  },
};

export default rule;
