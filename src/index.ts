#!/usr/bin/env bun
/**
 * Design Token Generator CLI
 * Generates CSS design tokens from a Material Design 3 seed color
 */

import { Command } from "commander";
import { isValidHexColor } from "./generator";
import { generateTokens, type ColorFormat } from "./tokens";
import type { SchemeVariant, ContrastLevel } from "./types";

const SCHEME_VARIANTS: SchemeVariant[] = [
  "tonal-spot",
  "content",
  "expressive",
  "fidelity",
  "monochrome",
  "neutral",
  "vibrant",
];

const COLOR_FORMATS: ColorFormat[] = ["oklch", "hex", "hsl", "rgb"];

const CONTRAST_LEVELS: ContrastLevel[] = ["standard", "medium", "high"];

const program = new Command();

program
  .name("design-tokens")
  .description(
    "Generate CSS design tokens from a Material Design 3 seed color"
  )
  .version("1.0.0")
  .requiredOption("-s, --seed <color>", "Seed color as hex (e.g., #769CDF)")
  .option("-o, --output <dir>", "Output directory (default: ./tokens)")
  .option(
    "-f, --format <format>",
    `Color format: ${COLOR_FORMATS.join(", ")}`,
    "oklch"
  )
  .option(
    "--scheme <variant>",
    `Scheme variant: ${SCHEME_VARIANTS.join(", ")}`,
    "tonal-spot"
  )
  .option(
    "--contrast <level>",
    `Contrast level: ${CONTRAST_LEVELS.join(", ")}`,
    "standard"
  )
  .action(async (options) => {
    const { seed, output, format, scheme, contrast } = options;

    // Validate seed color
    if (!isValidHexColor(seed)) {
      console.error(
        `Error: Invalid hex color "${seed}". Use format like #769CDF or 769CDF.`
      );
      process.exit(1);
    }

    // Validate color format
    if (!COLOR_FORMATS.includes(format)) {
      console.error(
        `Error: Invalid color format "${format}". Valid options: ${COLOR_FORMATS.join(", ")}`
      );
      process.exit(1);
    }

    // Validate scheme variant
    if (!SCHEME_VARIANTS.includes(scheme)) {
      console.error(
        `Error: Invalid scheme variant "${scheme}". Valid options: ${SCHEME_VARIANTS.join(", ")}`
      );
      process.exit(1);
    }

    // Validate contrast level
    if (!CONTRAST_LEVELS.includes(contrast)) {
      console.error(
        `Error: Invalid contrast level "${contrast}". Valid options: ${CONTRAST_LEVELS.join(", ")}`
      );
      process.exit(1);
    }

    try {
      await generateTokens({
        seed,
        output,
        format: format as ColorFormat,
        scheme: scheme as SchemeVariant,
        contrast: contrast as ContrastLevel,
      });
    } catch (error) {
      console.error(
        `Error generating tokens: ${error instanceof Error ? error.message : error}`
      );
      process.exit(1);
    }
  });

program.parse();
