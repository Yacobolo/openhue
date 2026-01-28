/**
 * Material Palettes CSS Generator
 * Generates material/palettes.css from Material Theme palettes
 */

import type { Palettes } from "../types";
import type { ColorFormat, Prefixes } from "./config";
import { formatColor, hexToOklch } from "./colors";
import { generateHeader } from "./css";

/** Palette names in output order */
const PALETTE_ORDER = [
  "primary",
  "secondary",
  "tertiary",
  "error",
  "neutral",
  "neutral-variant",
] as const;

/** Tone steps in output order (matching Go implementation) */
const TONE_STEPS = [
  "0", "5", "10", "15", "20", "25", "30", "35", "40",
  "50", "60", "70", "80", "90", "95", "98", "99", "100",
] as const;

/** Display names for palette comments */
const PALETTE_DISPLAY_NAMES: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
  error: "Error",
  neutral: "Neutral",
  "neutral-variant": "Neutral Variant",
};

/**
 * Generate material/palettes.css content
 */
export function generatePalettesCSS(
  palettes: Palettes,
  seed: string,
  prefixes: Prefixes,
  format: ColorFormat
): string {
  const seedFormatted = hexToOklch(seed);
  
  const header = generateHeader(
    "Material Design Palettes (Tier 1 Primitives)",
    "Material Theme Builder",
    `Seed: ${seed} (${seedFormatted})\nFormat: ${format.toUpperCase()}\nPrefix: --${prefixes.palette}-palette-*`
  );

  const lines: string[] = [];
  lines.push(header);
  lines.push(":root {");

  let first = true;
  for (const paletteName of PALETTE_ORDER) {
    const palette = palettes[paletteName as keyof Palettes];
    if (!palette) continue;

    if (!first) {
      lines.push("");
    }
    first = false;

    const displayName = PALETTE_DISPLAY_NAMES[paletteName] || paletteName;
    lines.push(`  /* ${displayName} palette */`);

    for (const step of TONE_STEPS) {
      const hexValue = palette[step as keyof typeof palette];
      if (!hexValue) continue;

      const cssName = `--${prefixes.palette}-palette-${paletteName}-${step}`;
      const cssValue = formatColor(hexValue, format);
      lines.push(`  ${cssName}: ${cssValue};`);
    }
  }

  lines.push("}");
  lines.push("");

  return lines.join("\n");
}
