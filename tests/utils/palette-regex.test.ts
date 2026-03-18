import { describe, expect, it } from "vitest";
import { isArbitraryColor, isBareColor, isPaletteColor, stripModifiers } from "../../src/utils/palette-regex.js";

describe("stripModifiers", () => {
  it("returns the class unchanged when there are no modifiers", () => {
    expect(stripModifiers("text-red-500")).toBe("text-red-500");
  });

  it("strips a single modifier", () => {
    expect(stripModifiers("hover:text-red-500")).toBe("text-red-500");
  });

  it("strips multiple modifiers", () => {
    expect(stripModifiers("dark:hover:text-red-500")).toBe("text-red-500");
  });

  it("strips arbitrary variant modifiers", () => {
    expect(stripModifiers("[&>svg]:text-red-500")).toBe("text-red-500");
  });

  it("strips complex modifier chains", () => {
    expect(stripModifiers("group-hover:dark:focus:text-red-500")).toBe("text-red-500");
  });
});

describe("isPaletteColor", () => {
  // Should match
  it.each([
    "text-red-500",
    "bg-green-100",
    "border-blue-300",
    "ring-amber-400",
    "fill-cyan-600",
    "stroke-gray-100",
    "shadow-slate-200",
    "outline-violet-500",
    "decoration-pink-300",
    "accent-purple-400",
    "caret-teal-500",
    "divide-zinc-200",
    "from-rose-500",
    "via-sky-300",
    "to-indigo-700",
    "placeholder-neutral-400",
    "bg-emerald-50",
    "text-stone-950",
    "bg-fuchsia-100",
    "text-lime-600",
  ])("detects '%s' as a palette color", (cls) => {
    expect(isPaletteColor(cls)).toBe(true);
  });

  // With modifiers
  it.each([
    "hover:text-red-500",
    "dark:bg-green-100",
    "focus:border-blue-300",
    "dark:hover:text-red-500",
    "[&>svg]:fill-cyan-600",
  ])("detects '%s' (with modifier) as a palette color", (cls) => {
    expect(isPaletteColor(cls)).toBe(true);
  });

  // With opacity suffix
  it("detects palette color with opacity suffix", () => {
    expect(isPaletteColor("bg-red-500/50")).toBe(true);
    expect(isPaletteColor("text-blue-300/10")).toBe(true);
  });

  // With !important prefix (Tailwind v3: leading !)
  it("detects palette color with leading !important prefix", () => {
    expect(isPaletteColor("!text-red-500")).toBe(true);
    expect(isPaletteColor("!bg-green-100")).toBe(true);
  });

  // With !important suffix (Tailwind v4: trailing !)
  it("detects palette color with trailing !important suffix", () => {
    expect(isPaletteColor("text-green-500!")).toBe(true);
    expect(isPaletteColor("bg-blue-500!")).toBe(true);
    expect(isPaletteColor("hover:text-red-500!")).toBe(true);
  });

  // With arbitrary opacity (Tailwind v4: /[value])
  it("detects palette color with arbitrary opacity suffix", () => {
    expect(isPaletteColor("bg-red-500/[0.5]")).toBe(true);
    expect(isPaletteColor("text-green-600/[33%]")).toBe(true);
    expect(isPaletteColor("border-blue-300/[.25]")).toBe(true);
  });

  // Should NOT match
  it.each([
    "text-destructive",
    "bg-success",
    "bg-warning/10",
    "text-primary",
    "rounded-lg",
    "p-4",
    "flex",
    "grid",
    "mx-auto",
    "text-sm",
    "font-bold",
    "border",
    "shadow",
    "bg-transparent",
    "text-inherit",
    "text-current",
    "bg-white",
    "text-black",
  ])("does NOT flag '%s' as palette color", (cls) => {
    expect(isPaletteColor(cls)).toBe(false);
  });

  // Edge cases
  it("does not flag colors without shades", () => {
    expect(isPaletteColor("bg-red")).toBe(false);
  });

  it("does not flag shades without colors", () => {
    expect(isPaletteColor("bg-500")).toBe(false);
  });

  it("does not flag invalid shade numbers", () => {
    expect(isPaletteColor("text-red-999")).toBe(false);
    expect(isPaletteColor("text-red-0")).toBe(false);
  });
});

describe("isBareColor", () => {
  // Should match
  it.each([
    "bg-white",
    "text-white",
    "border-white",
    "bg-black",
    "text-black",
    "border-black",
    "fill-white",
    "stroke-black",
    "ring-white",
    "shadow-black",
    "divide-white",
    "outline-black",
    "from-white",
    "via-black",
    "placeholder-white",
  ])("detects '%s' as a bare color", (cls) => {
    expect(isBareColor(cls)).toBe(true);
  });

  // With modifiers
  it.each([
    "hover:bg-white",
    "dark:text-black",
    "[&>svg]:fill-white",
  ])("detects '%s' (with modifier) as a bare color", (cls) => {
    expect(isBareColor(cls)).toBe(true);
  });

  // With opacity suffix
  it("detects bare color with opacity suffix", () => {
    expect(isBareColor("bg-white/50")).toBe(true);
    expect(isBareColor("text-black/80")).toBe(true);
  });

  // With !important prefix
  it("detects bare color with !important prefix", () => {
    expect(isBareColor("!bg-white")).toBe(true);
    expect(isBareColor("!text-black")).toBe(true);
  });

  // Should NOT match
  it.each([
    "text-red-500",
    "bg-green-100",
    "text-destructive",
    "bg-primary",
    "bg-transparent",
    "text-transparent",
    "border-transparent",
    "rounded-lg",
    "p-4",
    "flex",
    "text-sm",
    "border",
    "shadow",
    "text-inherit",
    "text-current",
  ])("does NOT flag '%s' as a bare color", (cls) => {
    expect(isBareColor(cls)).toBe(false);
  });
});

describe("isArbitraryColor", () => {
  // Should match — hex colors
  it.each([
    "text-[#ff0000]",
    "bg-[#fff]",
    "border-[#aabbcc]",
    "text-[#ff000080]",
    "fill-[#123]",
  ])("detects '%s' as an arbitrary color", (cls) => {
    expect(isArbitraryColor(cls)).toBe(true);
  });

  // Should match — color functions
  it.each([
    "text-[rgb(255,0,0)]",
    "bg-[rgba(255,0,0,0.5)]",
    "text-[hsl(0,100%,50%)]",
    "bg-[hsla(0,100%,50%,0.5)]",
    "text-[oklch(0.5_0.2_240)]",
    "bg-[oklab(0.5_0.1_-0.1)]",
    "text-[color(display-p3_1_0_0)]",
  ])("detects '%s' as an arbitrary color", (cls) => {
    expect(isArbitraryColor(cls)).toBe(true);
  });

  // Should match — named CSS colors
  it.each([
    "text-[red]",
    "bg-[blue]",
    "border-[coral]",
    "text-[dodgerblue]",
    "bg-[rebeccapurple]",
    "fill-[tomato]",
  ])("detects '%s' as an arbitrary color", (cls) => {
    expect(isArbitraryColor(cls)).toBe(true);
  });

  // With modifiers
  it.each([
    "hover:text-[#ff0000]",
    "dark:bg-[red]",
    "[&>svg]:fill-[#000]",
  ])("detects '%s' (with modifier) as an arbitrary color", (cls) => {
    expect(isArbitraryColor(cls)).toBe(true);
  });

  // With !important
  it("detects arbitrary color with !important prefix", () => {
    expect(isArbitraryColor("!text-[#ff0000]")).toBe(true);
  });

  // Should NOT match — CSS variables
  it.each([
    "text-[var(--color)]",
    "bg-[var(--bg-primary)]",
  ])("does NOT flag '%s' (CSS variable)", (cls) => {
    expect(isArbitraryColor(cls)).toBe(false);
  });

  // Should NOT match — non-color arbitrary values
  it.each([
    "text-[14px]",
    "text-[1.5rem]",
    "p-[20px]",
    "w-[calc(100%-20px)]",
    "bg-[url(/image.png)]",
    "grid-cols-[1fr_2fr]",
    "text-[clamp(1rem,2vw,2rem)]",
    "max-w-[600px]",
  ])("does NOT flag '%s' (non-color value)", (cls) => {
    expect(isArbitraryColor(cls)).toBe(false);
  });

  // Should NOT match — non-arbitrary classes
  it.each([
    "text-red-500",
    "bg-white",
    "rounded-lg",
    "flex",
  ])("does NOT flag '%s' (not arbitrary)", (cls) => {
    expect(isArbitraryColor(cls)).toBe(false);
  });
});
