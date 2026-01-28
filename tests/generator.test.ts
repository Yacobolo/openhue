import { describe, test, expect } from "bun:test";
import { generateTheme, isValidHexColor } from "../src/generator";
import type { MaterialTheme } from "../src/types";

// Load fixture files
const fixtures = {
  "769CDF": await Bun.file("tests/fixtures/seed-769CDF.json").json() as MaterialTheme,
  "B33B15": await Bun.file("tests/fixtures/seed-B33B15.json").json() as MaterialTheme,
  "FFDE3F": await Bun.file("tests/fixtures/seed-FFDE3F.json").json() as MaterialTheme,
};

describe("isValidHexColor", () => {
  test("accepts valid hex colors with #", () => {
    expect(isValidHexColor("#769CDF")).toBe(true);
    expect(isValidHexColor("#B33B15")).toBe(true);
    expect(isValidHexColor("#FFDE3F")).toBe(true);
    expect(isValidHexColor("#abc")).toBe(true);
  });

  test("accepts valid hex colors without #", () => {
    expect(isValidHexColor("769CDF")).toBe(true);
    expect(isValidHexColor("B33B15")).toBe(true);
    expect(isValidHexColor("abc")).toBe(true);
  });

  test("rejects invalid hex colors", () => {
    expect(isValidHexColor("")).toBe(false);
    expect(isValidHexColor("#GGG")).toBe(false);
    expect(isValidHexColor("#12345")).toBe(false);
    expect(isValidHexColor("not-a-color")).toBe(false);
  });
});

describe("generateTheme", () => {
  test("generates theme with correct seed", () => {
    const theme = generateTheme("#769CDF");
    expect(theme.seed).toBe("#769CDF");
    expect(theme.coreColors.primary).toBe("#769CDF");
  });

  test("generates all scheme variants", () => {
    const theme = generateTheme("#769CDF");
    expect(theme.schemes).toHaveProperty("light");
    expect(theme.schemes).toHaveProperty("light-medium-contrast");
    expect(theme.schemes).toHaveProperty("light-high-contrast");
    expect(theme.schemes).toHaveProperty("dark");
    expect(theme.schemes).toHaveProperty("dark-medium-contrast");
    expect(theme.schemes).toHaveProperty("dark-high-contrast");
  });

  test("generates all palettes", () => {
    const theme = generateTheme("#769CDF");
    expect(theme.palettes).toHaveProperty("primary");
    expect(theme.palettes).toHaveProperty("secondary");
    expect(theme.palettes).toHaveProperty("tertiary");
    expect(theme.palettes).toHaveProperty("neutral");
    expect(theme.palettes).toHaveProperty("neutral-variant");
  });

  test("palette has all tone values", () => {
    const theme = generateTheme("#769CDF");
    const tones = ["0", "5", "10", "15", "20", "25", "30", "35", "40", "50", "60", "70", "80", "90", "95", "98", "99", "100"];
    for (const tone of tones) {
      expect(theme.palettes.primary).toHaveProperty(tone);
    }
  });
});

describe("scheme color matching", () => {
  const testCases = [
    { seed: "#769CDF", fixture: fixtures["769CDF"] },
    { seed: "#B33B15", fixture: fixtures["B33B15"] },
    { seed: "#FFDE3F", fixture: fixtures["FFDE3F"] },
  ];

  for (const { seed, fixture } of testCases) {
    describe(`seed ${seed}`, () => {
      const theme = generateTheme(seed);

      test("light scheme matches fixture", () => {
        expect(theme.schemes.light).toEqual(fixture.schemes.light);
      });

      test("light-medium-contrast scheme matches fixture", () => {
        expect(theme.schemes["light-medium-contrast"]).toEqual(fixture.schemes["light-medium-contrast"]);
      });

      test("light-high-contrast scheme matches fixture", () => {
        expect(theme.schemes["light-high-contrast"]).toEqual(fixture.schemes["light-high-contrast"]);
      });

      test("dark scheme matches fixture", () => {
        expect(theme.schemes.dark).toEqual(fixture.schemes.dark);
      });

      test("dark-medium-contrast scheme matches fixture", () => {
        expect(theme.schemes["dark-medium-contrast"]).toEqual(fixture.schemes["dark-medium-contrast"]);
      });

      test("dark-high-contrast scheme matches fixture", () => {
        expect(theme.schemes["dark-high-contrast"]).toEqual(fixture.schemes["dark-high-contrast"]);
      });
    });
  }
});
