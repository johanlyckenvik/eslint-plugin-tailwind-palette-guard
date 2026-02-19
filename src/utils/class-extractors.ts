import type { Rule } from "eslint";

export interface ExtractedString {
  value: string;
  node: Rule.Node;
}

const CLASS_UTILITY_NAMES = new Set(["cn", "clsx", "classnames", "cx", "twMerge", "twJoin"]);

/**
 * Checks if a CallExpression is a class utility call (cn, clsx, classnames, cx, twMerge, twJoin).
 */
export function isClassUtility(node: Rule.Node): boolean {
  if (node.type !== "CallExpression") return false;

  const callee = node.callee;

  // Direct call: cn(...)
  if (callee.type === "Identifier") {
    return CLASS_UTILITY_NAMES.has(callee.name);
  }

  // Member call: something.cn(...) — unlikely but handle
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
    return CLASS_UTILITY_NAMES.has(callee.property.name);
  }

  return false;
}

/**
 * Checks if a CallExpression is a cva() call.
 */
export function isCvaCall(node: Rule.Node): boolean {
  if (node.type !== "CallExpression") return false;
  const callee = node.callee;
  return callee.type === "Identifier" && callee.name === "cva";
}

/**
 * Recursively extracts string values from AST nodes.
 * Handles: Literal, TemplateLiteral, ConditionalExpression, LogicalExpression,
 * ObjectExpression (keys), ArrayExpression, CallExpression (arguments).
 */
export function* extractStringNodes(node: Rule.Node | null | undefined): Generator<ExtractedString> {
  if (!node) return;

  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") {
        yield { value: node.value, node };
      }
      break;

    case "TemplateLiteral":
      for (const quasi of node.quasis) {
        if (quasi.value.raw) {
          yield { value: quasi.value.raw, node: quasi as unknown as Rule.Node };
        }
      }
      break;

    case "ConditionalExpression":
      yield* extractStringNodes(node.consequent as Rule.Node);
      yield* extractStringNodes(node.alternate as Rule.Node);
      break;

    case "LogicalExpression":
      yield* extractStringNodes(node.left as Rule.Node);
      yield* extractStringNodes(node.right as Rule.Node);
      break;

    case "ObjectExpression":
      for (const prop of node.properties) {
        if (prop.type === "Property") {
          yield* extractStringNodes(prop.key as Rule.Node);
        }
      }
      break;

    case "ArrayExpression":
      for (const element of node.elements) {
        if (element) {
          yield* extractStringNodes(element as Rule.Node);
        }
      }
      break;

    case "CallExpression":
      for (const arg of node.arguments) {
        yield* extractStringNodes(arg as Rule.Node);
      }
      break;
  }
}

/**
 * Extracts all string nodes from a cva() call, including base classes,
 * variant values, and compound variants.
 */
export function* extractCvaStrings(node: Rule.Node): Generator<ExtractedString> {
  if (node.type !== "CallExpression") return;

  const [baseArg, configArg] = node.arguments;

  // Base classes (first argument)
  if (baseArg) {
    yield* extractStringNodes(baseArg as Rule.Node);
  }

  // Config object (second argument)
  if (configArg && configArg.type === "ObjectExpression") {
    for (const prop of configArg.properties) {
      if (prop.type !== "Property" || prop.key.type !== "Identifier") continue;

      if (prop.key.name === "variants" && prop.value.type === "ObjectExpression") {
        // variants: { variant: { danger: "text-red-500", ... } }
        for (const variantGroup of prop.value.properties) {
          if (variantGroup.type === "Property" && variantGroup.value.type === "ObjectExpression") {
            for (const variantOption of variantGroup.value.properties) {
              if (variantOption.type === "Property") {
                yield* extractStringNodes(variantOption.value as Rule.Node);
              }
            }
          }
        }
      } else if (
        prop.key.name === "compoundVariants" &&
        prop.value.type === "ArrayExpression"
      ) {
        // compoundVariants: [{ variant: "x", class: "text-red-500" }]
        for (const element of prop.value.elements) {
          if (element && element.type === "ObjectExpression") {
            for (const cvProp of element.properties) {
              if (
                cvProp.type === "Property" &&
                cvProp.key.type === "Identifier" &&
                (cvProp.key.name === "class" || cvProp.key.name === "className")
              ) {
                yield* extractStringNodes(cvProp.value as Rule.Node);
              }
            }
          }
        }
      }
    }
  }
}
