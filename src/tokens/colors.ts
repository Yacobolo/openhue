/**
 * Color Format Conversion
 * Converts hex colors to various CSS color formats
 */

import { parse, formatHex, formatHsl, formatRgb, oklch, type Oklch } from "culori";
import type { ColorFormat } from "./config";

/**
 * Convert hex color to OKLCH CSS string
 * Format: oklch(L C H) where L is 0-1, C is chroma, H is hue in degrees
 */
export function hexToOklch(hex: string): string {
  const color = parse(hex);
  if (!color) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const oklchColor = oklch(color) as Oklch;
  const l = oklchColor.l ?? 0;
  const c = oklchColor.c ?? 0;
  const h = oklchColor.h ?? 0;

  // Format: L with 2 decimals, C with 3 decimals, H as integer
  // For achromatic colors (very low chroma), use 0 for both c and h
  if (c < 0.001) {
    return `oklch(${l.toFixed(2)} 0 0)`;
  }

  return `oklch(${l.toFixed(2)} ${c.toFixed(3)} ${Math.round(h)})`;
}

/**
 * Convert hex color to HSL CSS string
 * Format: hsl(H S% L%)
 */
export function hexToHsl(hex: string): string {
  const formatted = formatHsl(hex);
  if (!formatted) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return formatted;
}

/**
 * Convert hex color to RGB CSS string
 * Format: rgb(R G B)
 */
export function hexToRgb(hex: string): string {
  const formatted = formatRgb(hex);
  if (!formatted) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return formatted;
}

/**
 * Normalize hex color to uppercase with # prefix
 */
export function normalizeHex(hex: string): string {
  const formatted = formatHex(hex);
  if (!formatted) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return formatted.toUpperCase();
}

/**
 * Convert hex color to the specified format
 */
export function formatColor(hex: string, format: ColorFormat): string {
  switch (format) {
    case "oklch":
      return hexToOklch(hex);
    case "hsl":
      return hexToHsl(hex);
    case "rgb":
      return hexToRgb(hex);
    case "hex":
      return normalizeHex(hex);
    default:
      return hexToOklch(hex);
  }
}

/**
 * Get the hue (in degrees) from a hex color
 * Used for shadow color generation
 */
export function getHue(hex: string): number {
  const color = parse(hex);
  if (!color) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const oklchColor = oklch(color) as Oklch;
  return oklchColor.h ?? 0;
}
