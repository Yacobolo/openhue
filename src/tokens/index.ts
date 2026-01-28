/**
 * Token Generator - Main Orchestrator
 * Coordinates the generation of all CSS token files
 */

import { mkdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { generateTheme } from "../generator";
import type { SchemeVariant } from "../types";
import type { ColorFormat, TokenConfig } from "./config";
import { DEFAULT_CONFIG, mergeConfig } from "./config";
import { getHue } from "./colors";
import { generatePalettesCSS } from "./palettes";
import { fetchAllOpenProps } from "./openprops";
import { generateSemanticCSS } from "./semantic";
import { generateIndexCSS, generateAppCSS } from "./css";

/** Options for token generation */
export interface TokenGeneratorOptions {
  seed: string;
  output?: string;
  format?: ColorFormat;
  scheme?: SchemeVariant;
  config?: Partial<TokenConfig>;
}

/**
 * Generate all design token CSS files from a seed color
 */
export async function generateTokens(options: TokenGeneratorOptions): Promise<void> {
  const {
    seed,
    output,
    format = "oklch",
    scheme = "tonal-spot",
    config: userConfig = {},
  } = options;

  // Merge user config with defaults
  const config = mergeConfig({
    ...userConfig,
    format,
    output: {
      ...userConfig.output,
      dir: output || userConfig.output?.dir || DEFAULT_CONFIG.output.dir,
    },
  });

  const outputDir = config.output.dir;
  const materialDir = join(outputDir, config.output.paletteSubdir);
  const openPropsDir = join(outputDir, config.output.openpropsSubdir);

  console.log(`Generating design tokens to ${outputDir}/`);

  // Create output directories
  await mkdir(outputDir, { recursive: true });
  await mkdir(materialDir, { recursive: true });
  await mkdir(openPropsDir, { recursive: true });

  // Generate Material theme from seed
  console.log(`  Seed color: ${seed} (scheme: ${scheme})`);
  const theme = generateTheme(seed, scheme);

  // Get seed hue for shadow colors
  const seedHue = getHue(seed);
  console.log(`  Seed hue: ${Math.round(seedHue)}°`);

  // Generate material/palettes.css
  console.log("  Generating material/palettes.css...");
  const palettesCSS = generatePalettesCSS(
    theme.palettes,
    seed,
    config.prefixes,
    config.format
  );
  await writeFile(join(materialDir, "palettes.css"), palettesCSS);
  console.log("  Generated material/palettes.css");

  // Fetch and generate Open Props files
  console.log(`  Fetching ${config.openprops.files.length} Open Props files...`);
  const openPropsFiles = await fetchAllOpenProps(
    config.openprops.baseUrl,
    config.openprops.files,
    config.prefixes.primitives,
    seedHue
  );
  
  for (const [name, css] of openPropsFiles) {
    await writeFile(join(openPropsDir, `${name}.css`), css);
    console.log(`  Generated open-props/${name}.css`);
  }

  // Generate semantic.css
  console.log("  Generating semantic.css...");
  const semanticCSS = generateSemanticCSS(
    theme.schemes.light,
    theme.schemes.dark,
    config.semantic,
    config.prefixes,
    config.format,
    seedHue
  );
  await writeFile(join(outputDir, "semantic.css"), semanticCSS);
  console.log("  Generated semantic.css");

  // Generate index.css
  console.log("  Generating index.css...");
  const indexCSS = generateIndexCSS(
    config.openprops.files,
    config.prefixes,
    config.output.paletteSubdir,
    config.output.openpropsSubdir
  );
  await writeFile(join(outputDir, "index.css"), indexCSS);
  console.log("  Generated index.css");

  // Generate app.css only if it doesn't exist
  const appPath = join(outputDir, "app.css");
  const appExists = await fileExists(appPath);
  
  if (!appExists) {
    console.log("  Creating app.css template...");
    const appCSS = generateAppCSS();
    await writeFile(appPath, appCSS);
    console.log("  Created app.css");
  } else {
    console.log("  Skipping app.css (already exists)");
  }

  console.log("\nDone! Generated design tokens.");
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// Re-export types for external use
export type { ColorFormat, TokenConfig } from "./config";
export { DEFAULT_CONFIG } from "./config";
