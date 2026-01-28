#!/usr/bin/env node
/**
 * Material Theme CLI
 * Generates Material Design 3 color themes from a seed color
 */

import { Command } from "commander";
import { writeFileSync } from "fs";
import { generateTheme, isValidHexColor } from "./generator.js";
import { formatThemeJson } from "./formatter.js";
import type { SchemeVariant } from "./types.js";

const SCHEME_VARIANTS: SchemeVariant[] = [
  "tonal-spot",
  "content",
  "expressive",
  "fidelity",
  "monochrome",
  "neutral",
  "vibrant",
];

const program = new Command();

program
  .name("material-theme-cli")
  .description(
    "CLI tool that generates Material Design 3 color themes from a seed color"
  )
  .version("1.0.0");

program
  .command("generate")
  .description("Generate a Material Design 3 theme from a seed color")
  .requiredOption("-s, --seed <color>", "Seed color as hex (e.g., #769CDF)")
  .option("-o, --output <file>", "Output file path (defaults to stdout)")
  .option(
    "--scheme <variant>",
    `Scheme variant: ${SCHEME_VARIANTS.join(", ")}`,
    "tonal-spot"
  )
  .action((options) => {
    const { seed, output, scheme } = options;

    // Validate seed color
    if (!isValidHexColor(seed)) {
      console.error(
        `Error: Invalid hex color "${seed}". Use format like #769CDF or 769CDF.`
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

    try {
      // Generate theme
      const theme = generateTheme(seed, scheme as SchemeVariant);
      const json = formatThemeJson(theme);

      // Output to file or stdout
      if (output) {
        writeFileSync(output, json, "utf-8");
        console.log(`Theme generated successfully: ${output}`);
      } else {
        console.log(json);
      }
    } catch (error) {
      console.error(
        `Error generating theme: ${error instanceof Error ? error.message : error}`
      );
      process.exit(1);
    }
  });

program.parse();
