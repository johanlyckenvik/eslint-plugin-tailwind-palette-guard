import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import rule from "../../src/rules/no-palette-colors.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

describe("no-palette-colors", () => {
  it("passes RuleTester", () => {
    ruleTester.run("no-palette-colors", rule, {
      valid: [
        // Semantic tokens — should pass
        { code: '<div className="text-destructive" />' },
        { code: '<div className="bg-success" />' },
        { code: '<div className="border-warning" />' },
        { code: '<div className="text-primary bg-secondary" />' },
        { code: '<div className="bg-destructive/10" />' },

        // Non-color utilities — should pass
        { code: '<div className="rounded-lg p-4 flex gap-2" />' },
        { code: '<div className="mx-auto text-sm font-bold" />' },

        // Colors without shade — should pass (not a palette or bare color)
        { code: '<div className="bg-red" />' },

        // Transparent — should pass (not flagged)
        { code: '<div className="bg-transparent" />' },
        { code: '<div className="border-transparent" />' },
        { code: 'const x = cn("bg-transparent")' },

        // Non-className attributes — should pass (catch-all Literal only runs with checkAllStrings: true)
        { code: '<div data-color="some-value" />' },
        { code: '<div title="hello world" />' },

        // Empty className — should pass
        { code: '<div className="" />' },

        // cn/clsx with only semantic tokens
        { code: 'const x = cn("text-destructive", cond && "bg-success")' },
        { code: 'const x = clsx("text-primary", "bg-secondary")' },

        // cva with only semantic tokens
        {
          code: `const x = cva("text-destructive", {
            variants: {
              variant: {
                danger: "bg-destructive",
                success: "bg-success",
              }
            }
          })`,
        },

        // allowedColors option
        {
          code: '<div className="stroke-gray-100" />',
          options: [{ allowedColors: ["stroke-gray-100"] }],
        },
        {
          code: 'const x = cn("stroke-gray-100", "text-destructive")',
          options: [{ allowedColors: ["stroke-gray-100"] }],
        },

        // allowedFiles option
        {
          code: '<div className="text-red-500" />',
          options: [{ allowedFiles: ["**/icons/**"] }],
          filename: "/project/src/icons/Arrow.tsx",
        },

        // allowBareColors: true — bare colors pass
        {
          code: '<div className="bg-white text-black" />',
          options: [{ allowBareColors: true }],
        },
        {
          code: 'const x = cn("bg-white", "text-black")',
          options: [{ allowBareColors: true }],
        },

        // Standalone strings — NOT flagged by default (checkAllStrings is off)
        { code: 'const x = "hello world"' },
        { code: 'const x = "text-destructive"' },
        { code: 'console.log("some message")' },
        { code: "const x = 42" },
        { code: 'const color = "text-red-500"' },
        { code: 'someFunction("bg-blue-500")' },
        { code: '<div data-color="text-red-500" />' },

        // checkAllStrings explicitly false — standalone strings still pass
        {
          code: 'const color = "text-red-500"',
          options: [{ checkAllStrings: false }],
        },

        // Standalone strings with no palette colors — even with checkAllStrings
        {
          code: 'const x = "hello world"',
          options: [{ checkAllStrings: true }],
        },
        {
          code: 'const x = "text-destructive"',
          options: [{ checkAllStrings: true }],
        },

        // Arbitrary values — non-color values should pass
        { code: '<div className="text-[14px]" />' },
        { code: '<div className="w-[100px]" />' },
        { code: '<div className="bg-[url(/image.png)]" />' },
        { code: '<div className="grid-cols-[1fr_2fr]" />' },

        // Arbitrary values — CSS variables should pass
        { code: '<div className="text-[var(--color)]" />' },
        { code: '<div className="bg-[var(--bg-primary)]" />' },
      ],

      invalid: [
        // Pattern 1: Static className string
        {
          code: '<div className="text-red-500" />',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },
        {
          code: '<div className="bg-green-100" />',
          errors: [{ messageId: "paletteColor", data: { className: "bg-green-100" } }],
        },

        // Multiple violations in one string
        {
          code: '<div className="text-red-500 bg-green-100" />',
          errors: [
            { messageId: "paletteColor", data: { className: "text-red-500" } },
            { messageId: "paletteColor", data: { className: "bg-green-100" } },
          ],
        },

        // Mixed valid and invalid
        {
          code: '<div className="p-4 text-red-500 rounded" />',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Pattern 2: cn() call with string literals
        {
          code: 'const x = cn("text-red-500", cond && "bg-green-100")',
          errors: [
            { messageId: "paletteColor", data: { className: "text-red-500" } },
            { messageId: "paletteColor", data: { className: "bg-green-100" } },
          ],
        },

        // clsx call
        {
          code: 'const x = clsx("text-red-500")',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // cx call
        {
          code: 'const x = cx("text-red-500")',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Pattern 3: Object syntax in cn()
        {
          code: 'const x = cn({ "text-red-500": isError })',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Pattern 4: cva definitions
        {
          code: `const x = cva("base", {
            variants: {
              variant: {
                danger: "text-red-500",
              }
            }
          })`,
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // cva base class
        {
          code: 'const x = cva("text-red-500 rounded")',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // cva compound variants
        {
          code: `const x = cva("base", {
            variants: { v: { a: "ok" } },
            compoundVariants: [
              { v: "a", class: "text-red-500" },
            ]
          })`,
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Pattern 5: classnames() call
        {
          code: 'const x = classnames("foo", { "text-red-500": cond })',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Pattern 6: Template literal in className
        {
          code: '<div className={`px-4 text-red-500 ${x}`} />',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Pattern 7: Ternary expression
        {
          code: '<div className={isError ? "text-red-500" : "text-green-500"} />',
          errors: [
            { messageId: "paletteColor", data: { className: "text-red-500" } },
            { messageId: "paletteColor", data: { className: "text-green-500" } },
          ],
        },

        // Modifier prefixes — still flagged
        {
          code: '<div className="hover:text-red-500" />',
          errors: [{ messageId: "paletteColor", data: { className: "hover:text-red-500" } }],
        },
        {
          code: '<div className="dark:hover:bg-blue-500" />',
          errors: [
            { messageId: "paletteColor", data: { className: "dark:hover:bg-blue-500" } },
          ],
        },
        {
          code: '<div className="[&>svg]:fill-red-500" />',
          errors: [
            { messageId: "paletteColor", data: { className: "[&>svg]:fill-red-500" } },
          ],
        },

        // Opacity suffix
        {
          code: '<div className="bg-red-500/50" />',
          errors: [{ messageId: "paletteColor", data: { className: "bg-red-500/50" } }],
        },

        // Various prefixes
        {
          code: '<div className="ring-amber-400" />',
          errors: [{ messageId: "paletteColor", data: { className: "ring-amber-400" } }],
        },
        {
          code: '<div className="divide-zinc-200" />',
          errors: [{ messageId: "paletteColor", data: { className: "divide-zinc-200" } }],
        },
        {
          code: '<div className="from-rose-500 via-sky-300 to-indigo-700" />',
          errors: [
            { messageId: "paletteColor", data: { className: "from-rose-500" } },
            { messageId: "paletteColor", data: { className: "via-sky-300" } },
            { messageId: "paletteColor", data: { className: "to-indigo-700" } },
          ],
        },
        {
          code: '<div className="placeholder-neutral-400" />',
          errors: [
            { messageId: "paletteColor", data: { className: "placeholder-neutral-400" } },
          ],
        },
        {
          code: '<div className="outline-violet-500" />',
          errors: [
            { messageId: "paletteColor", data: { className: "outline-violet-500" } },
          ],
        },
        {
          code: '<div className="caret-teal-500" />',
          errors: [{ messageId: "paletteColor", data: { className: "caret-teal-500" } }],
        },
        {
          code: '<div className="accent-purple-400" />',
          errors: [
            { messageId: "paletteColor", data: { className: "accent-purple-400" } },
          ],
        },

        // Various colors
        {
          code: '<div className="text-fuchsia-500 bg-lime-200 border-stone-300" />',
          errors: [
            { messageId: "paletteColor", data: { className: "text-fuchsia-500" } },
            { messageId: "paletteColor", data: { className: "bg-lime-200" } },
            { messageId: "paletteColor", data: { className: "border-stone-300" } },
          ],
        },

        // allowedFiles — file NOT matching pattern should still be flagged
        {
          code: '<div className="text-red-500" />',
          options: [{ allowedFiles: ["**/icons/**"] }],
          filename: "/project/src/components/Alert.tsx",
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // allowedColors — other colors should still be flagged
        {
          code: '<div className="stroke-gray-100 text-red-500" />',
          options: [{ allowedColors: ["stroke-gray-100"] }],
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Bare colors — flagged by default (white + black only, NOT transparent)
        {
          code: '<div className="bg-white" />',
          errors: [{ messageId: "paletteColor", data: { className: "bg-white" } }],
        },
        {
          code: '<div className="text-black" />',
          errors: [{ messageId: "paletteColor", data: { className: "text-black" } }],
        },
        {
          code: '<div className="bg-white text-black" />',
          errors: [
            { messageId: "paletteColor", data: { className: "bg-white" } },
            { messageId: "paletteColor", data: { className: "text-black" } },
          ],
        },

        // Bare colors with modifiers
        {
          code: '<div className="hover:bg-white dark:text-black" />',
          errors: [
            { messageId: "paletteColor", data: { className: "hover:bg-white" } },
            { messageId: "paletteColor", data: { className: "dark:text-black" } },
          ],
        },

        // Bare colors with opacity
        {
          code: '<div className="bg-white/50" />',
          errors: [{ messageId: "paletteColor", data: { className: "bg-white/50" } }],
        },

        // Bare colors in cn() calls
        {
          code: 'const x = cn("bg-white", cond && "text-black")',
          errors: [
            { messageId: "paletteColor", data: { className: "bg-white" } },
            { messageId: "paletteColor", data: { className: "text-black" } },
          ],
        },

        // Mixed palette + bare
        {
          code: '<div className="text-red-500 bg-white" />',
          errors: [
            { messageId: "paletteColor", data: { className: "text-red-500" } },
            { messageId: "paletteColor", data: { className: "bg-white" } },
          ],
        },

        // allowBareColors: true still flags palette colors
        {
          code: '<div className="text-red-500 bg-white" />',
          options: [{ allowBareColors: true }],
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Standalone string literals (catch-all Literal visitor — requires checkAllStrings)
        {
          code: 'const color = "text-red-500"',
          options: [{ checkAllStrings: true }],
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },
        {
          code: 'const classes = "text-red-500 bg-green-100"',
          options: [{ checkAllStrings: true }],
          errors: [
            { messageId: "paletteColor", data: { className: "text-red-500" } },
            { messageId: "paletteColor", data: { className: "bg-green-100" } },
          ],
        },
        {
          code: 'someFunction("text-red-500")',
          options: [{ checkAllStrings: true }],
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },
        {
          code: 'const obj = { key: "bg-blue-500" }',
          options: [{ checkAllStrings: true }],
          errors: [{ messageId: "paletteColor", data: { className: "bg-blue-500" } }],
        },
        {
          code: 'const arr = ["text-red-500", "bg-green-100"]',
          options: [{ checkAllStrings: true }],
          errors: [
            { messageId: "paletteColor", data: { className: "text-red-500" } },
            { messageId: "paletteColor", data: { className: "bg-green-100" } },
          ],
        },

        // Standalone template literal
        {
          code: 'const x = `text-red-500 ${y}`',
          options: [{ checkAllStrings: true }],
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Standalone bare color in variable
        {
          code: 'const bg = "bg-white"',
          options: [{ checkAllStrings: true }],
          errors: [{ messageId: "paletteColor", data: { className: "bg-white" } }],
        },

        // Non-className JSX attribute — caught by Literal visitor (requires checkAllStrings)
        {
          code: '<div data-color="text-red-500" />',
          options: [{ checkAllStrings: true }],
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // twMerge call
        {
          code: 'const x = twMerge("text-red-500")',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // twJoin call
        {
          code: 'const x = twJoin("text-red-500", "bg-green-100")',
          errors: [
            { messageId: "paletteColor", data: { className: "text-red-500" } },
            { messageId: "paletteColor", data: { className: "bg-green-100" } },
          ],
        },

        // Nested cn() call
        {
          code: 'const x = cn("p-4", cn("text-red-500"))',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // LogicalExpression — left side
        {
          code: 'const x = cn("text-red-500" || "fallback")',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // cva compound variants with className key (not just class)
        {
          code: `const x = cva("base", {
            variants: { v: { a: "ok" } },
            compoundVariants: [
              { v: "a", className: "text-red-500" },
            ]
          })`,
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Member expression utility call: utils.cn(...)
        {
          code: 'const x = utils.cn("text-red-500")',
          errors: [{ messageId: "paletteColor", data: { className: "text-red-500" } }],
        },

        // Bug fix: TemplateLiteral expressions (conditionals inside `${}`) are traversed
        {
          code: '<div className={`${cond ? "text-green-500" : "bg-blue-500"}`} />',
          errors: [
            { messageId: "paletteColor", data: { className: "text-green-500" } },
            { messageId: "paletteColor", data: { className: "bg-blue-500" } },
          ],
        },
        {
          code: '<div className={`base ${isError ? "text-red-500" : "text-green-500"}`} />',
          errors: [
            { messageId: "paletteColor", data: { className: "text-red-500" } },
            { messageId: "paletteColor", data: { className: "text-green-500" } },
          ],
        },

        // Bug fix: Tailwind v4 trailing `!` important modifier
        {
          code: '<div className="text-green-500!" />',
          errors: [{ messageId: "paletteColor", data: { className: "text-green-500!" } }],
        },
        {
          code: '<div className="hover:bg-blue-500!" />',
          errors: [{ messageId: "paletteColor", data: { className: "hover:bg-blue-500!" } }],
        },

        // Arbitrary color values
        {
          code: '<div className="text-[#ff0000]" />',
          errors: [{ messageId: "paletteColor", data: { className: "text-[#ff0000]" } }],
        },
        {
          code: '<div className="bg-[red]" />',
          errors: [{ messageId: "paletteColor", data: { className: "bg-[red]" } }],
        },
        {
          code: '<div className="border-[rgb(255,0,0)]" />',
          errors: [
            {
              messageId: "paletteColor",
              data: { className: "border-[rgb(255,0,0)]" },
            },
          ],
        },
        {
          code: 'const x = cn("text-[#ff0000]")',
          errors: [{ messageId: "paletteColor", data: { className: "text-[#ff0000]" } }],
        },
        {
          code: '<div className="hover:text-[#ff0000]" />',
          errors: [
            {
              messageId: "paletteColor",
              data: { className: "hover:text-[#ff0000]" },
            },
          ],
        },
      ],
    });
  });
});
