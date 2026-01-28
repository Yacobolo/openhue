/**
 * CSS File Generation Utilities
 * Headers, index.css, and app.css generation
 */

import type { Prefixes } from "./config";

/**
 * Generate a standard CSS file header
 */
export function generateHeader(
  title: string,
  source?: string,
  description?: string
): string {
  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").slice(0, 19);

  const lines: string[] = [];
  lines.push("/**");
  lines.push(` * ${title}`);
  
  if (source) {
    lines.push(` * Source: ${source}`);
  }
  
  lines.push(` * Generated: ${timestamp}`);

  if (description) {
    lines.push(" *");
    for (const line of description.split("\n")) {
      lines.push(` * ${line}`);
    }
  }

  lines.push(" *");
  lines.push(" * DO NOT EDIT - Regenerate with: bun src/index.ts tokens");
  lines.push(" */");
  lines.push("");

  return lines.join("\n");
}

/**
 * Generate index.css with imports
 */
export function generateIndexCSS(
  openPropsFiles: string[],
  prefixes: Prefixes,
  paletteSubdir: string,
  openpropsSubdir: string
): string {
  const sortedFiles = [...openPropsFiles].sort();

  const header = generateHeader(
    "Tokens Layer - Main Entry Point",
    undefined,
    `Prefix Legend:
  --${prefixes.palette}-palette-* = Material Design palettes (raw color steps)
  --${prefixes.primitives}-*      = Open Props primitives (raw values)
  --${prefixes.semantic}-*        = Application tokens (USE THESE!)

Tier 1: Warehouses (Primitives)
Tier 2: Showroom (Semantic)
Tier 3: App-Specific (manual)`
  );

  const lines: string[] = [];
  lines.push(header);

  // Tier 1: Warehouses
  lines.push("/* === Tier 1: Warehouses (Primitives) === */");
  lines.push(`@import "./${paletteSubdir}/palettes.css";`);
  
  for (const name of sortedFiles) {
    lines.push(`@import "./${openpropsSubdir}/${name}.css";`);
  }

  // Tier 2: Showroom
  lines.push("");
  lines.push("/* === Tier 2: Showroom (Semantic) === */");
  lines.push('@import "./semantic.css";');

  // Tier 3: App-specific
  lines.push("");
  lines.push("/* === Tier 3: App-Specific === */");
  lines.push('@import "./app.css";');
  lines.push("");

  return lines.join("\n");
}

/**
 * Generate app.css template
 */
export function generateAppCSS(): string {
  return `/**
 * App-Specific Tokens
 *
 * This file is NOT generated. Add custom tokens here.
 * These tokens are specific to your application.
 */

:root {
  /* Layout */
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 64px;
  --header-height: 56px;

  /* Container Widths */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
}
`;
}
