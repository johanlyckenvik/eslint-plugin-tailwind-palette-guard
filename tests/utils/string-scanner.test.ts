import { describe, expect, it } from "vitest";
import { scanForPaletteColors } from "../../src/utils/string-scanner.js";

describe("scanForPaletteColors", () => {
  it("finds a single palette color in a class string", () => {
    const result = scanForPaletteColors("text-red-500");
    expect(result).toEqual(["text-red-500"]);
  });

  it("finds multiple palette colors", () => {
    const result = scanForPaletteColors("px-4 text-red-500 bg-green-100 rounded");
    expect(result).toEqual([
      "text-red-500",
      "bg-green-100",
    ]);
  });

  it("returns empty array when no palette colors found", () => {
    const result = scanForPaletteColors("px-4 text-destructive rounded-lg");
    expect(result).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(scanForPaletteColors("")).toEqual([]);
  });

  it("respects allowedColors", () => {
    const result = scanForPaletteColors("stroke-gray-100 text-red-500", {
      allowedColors: new Set(["stroke-gray-100"]),
    });
    expect(result).toEqual(["text-red-500"]);
  });

  it("handles classes with modifiers", () => {
    const result = scanForPaletteColors("hover:text-red-500 dark:bg-green-100");
    expect(result).toEqual([
      "hover:text-red-500",
      "dark:bg-green-100",
    ]);
  });

  it("handles classes with opacity", () => {
    const result = scanForPaletteColors("bg-red-500/50");
    expect(result).toEqual(["bg-red-500/50"]);
  });

  it("handles mixed valid and invalid classes", () => {
    const result = scanForPaletteColors(
      "flex items-center text-red-500 gap-2 bg-destructive",
    );
    expect(result).toEqual(["text-red-500"]);
  });

  // Bare color tests
  describe("bare colors", () => {
    it("flags bare colors by default", () => {
      const result = scanForPaletteColors("bg-white text-black");
      expect(result).toEqual([
        "bg-white",
        "text-black",
      ]);
    });

    it("does not flag transparent", () => {
      const result = scanForPaletteColors("border-transparent bg-transparent");
      expect(result).toEqual([]);
    });

    it("skips bare colors when allowBareColors is true", () => {
      const result = scanForPaletteColors("bg-white text-red-500", {
        allowBareColors: true,
      });
      expect(result).toEqual(["text-red-500"]);
    });

    it("flags bare colors with modifiers", () => {
      const result = scanForPaletteColors("hover:bg-white dark:text-black");
      expect(result).toEqual([
        "hover:bg-white",
        "dark:text-black",
      ]);
    });

    it("flags bare colors with opacity", () => {
      const result = scanForPaletteColors("bg-white/50");
      expect(result).toEqual(["bg-white/50"]);
    });

    it("respects allowedColors for bare colors too", () => {
      const result = scanForPaletteColors("bg-white text-black", {
        allowedColors: new Set(["bg-white"]),
      });
      expect(result).toEqual(["text-black"]);
    });

    it("still flags palette colors when allowBareColors is true", () => {
      const result = scanForPaletteColors("bg-white text-red-500 bg-black", {
        allowBareColors: true,
      });
      expect(result).toEqual(["text-red-500"]);
    });
  });

  // Arbitrary color tests
  describe("arbitrary colors", () => {
    it("flags arbitrary hex colors", () => {
      const result = scanForPaletteColors("text-[#ff0000]");
      expect(result).toEqual(["text-[#ff0000]"]);
    });

    it("flags arbitrary named colors", () => {
      const result = scanForPaletteColors("bg-[red]");
      expect(result).toEqual(["bg-[red]"]);
    });

    it("flags arbitrary rgb colors", () => {
      const result = scanForPaletteColors("text-[rgb(255,0,0)]");
      expect(result).toEqual(["text-[rgb(255,0,0)]"]);
    });

    it("does not flag arbitrary CSS variables", () => {
      const result = scanForPaletteColors("text-[var(--color)]");
      expect(result).toEqual([]);
    });

    it("does not flag arbitrary non-color values", () => {
      const result = scanForPaletteColors("text-[14px] w-[100px]");
      expect(result).toEqual([]);
    });

    it("flags arbitrary colors mixed with other violations", () => {
      const result = scanForPaletteColors("text-[#ff0000] bg-red-500");
      expect(result).toEqual([
        "text-[#ff0000]",
        "bg-red-500",
      ]);
    });

    it("respects allowedColors for arbitrary colors", () => {
      const result = scanForPaletteColors("text-[#ff0000]", {
        allowedColors: new Set(["text-[#ff0000]"]),
      });
      expect(result).toEqual([]);
    });
  });
});
