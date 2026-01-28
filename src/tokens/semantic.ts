/**
 * Semantic CSS Generator
 * Generates semantic.css with --ui-* tokens using light-dark()
 */

import type { SchemeColors } from "../types";
import type { ColorFormat, Prefixes, SemanticConfig } from "./config";
import { formatColor } from "./colors";
import { generateHeader } from "./css";

/**
 * Color role mapping from Material camelCase to semantic kebab-case
 * Order defines output order in the CSS file
 */
const COLOR_ROLE_MAP: Array<{ schemeKey: keyof SchemeColors; semanticName: string; group: string }> = [
  // Primary
  { schemeKey: "primary", semanticName: "primary", group: "Primary" },
  { schemeKey: "onPrimary", semanticName: "primary-on", group: "Primary" },
  { schemeKey: "primaryContainer", semanticName: "primary-container", group: "Primary" },
  { schemeKey: "onPrimaryContainer", semanticName: "primary-container-on", group: "Primary" },
  
  // Secondary
  { schemeKey: "secondary", semanticName: "secondary", group: "Secondary" },
  { schemeKey: "onSecondary", semanticName: "secondary-on", group: "Secondary" },
  { schemeKey: "secondaryContainer", semanticName: "secondary-container", group: "Secondary" },
  { schemeKey: "onSecondaryContainer", semanticName: "secondary-container-on", group: "Secondary" },
  
  // Tertiary
  { schemeKey: "tertiary", semanticName: "tertiary", group: "Tertiary" },
  { schemeKey: "onTertiary", semanticName: "tertiary-on", group: "Tertiary" },
  { schemeKey: "tertiaryContainer", semanticName: "tertiary-container", group: "Tertiary" },
  { schemeKey: "onTertiaryContainer", semanticName: "tertiary-container-on", group: "Tertiary" },
  
  // Surface
  { schemeKey: "surface", semanticName: "surface", group: "Surface" },
  { schemeKey: "onSurface", semanticName: "surface-on", group: "Surface" },
  { schemeKey: "surfaceVariant", semanticName: "surface-variant", group: "Surface" },
  { schemeKey: "onSurfaceVariant", semanticName: "surface-variant-on", group: "Surface" },
  { schemeKey: "surfaceContainer", semanticName: "surface-container", group: "Surface" },
  { schemeKey: "surfaceContainerLow", semanticName: "surface-container-low", group: "Surface" },
  { schemeKey: "surfaceContainerLowest", semanticName: "surface-container-lowest", group: "Surface" },
  { schemeKey: "surfaceContainerHigh", semanticName: "surface-container-high", group: "Surface" },
  { schemeKey: "surfaceContainerHighest", semanticName: "surface-container-highest", group: "Surface" },
  { schemeKey: "surfaceDim", semanticName: "surface-dim", group: "Surface" },
  { schemeKey: "surfaceBright", semanticName: "surface-bright", group: "Surface" },
  
  // Background
  { schemeKey: "background", semanticName: "background", group: "Background" },
  { schemeKey: "onBackground", semanticName: "background-on", group: "Background" },
  
  // Error
  { schemeKey: "error", semanticName: "error", group: "Error" },
  { schemeKey: "onError", semanticName: "error-on", group: "Error" },
  { schemeKey: "errorContainer", semanticName: "error-container", group: "Error" },
  { schemeKey: "onErrorContainer", semanticName: "error-container-on", group: "Error" },
  
  // Outline
  { schemeKey: "outline", semanticName: "outline", group: "Outline" },
  { schemeKey: "outlineVariant", semanticName: "outline-variant", group: "Outline" },
  
  // Inverse
  { schemeKey: "inverseSurface", semanticName: "inverse-surface", group: "Inverse" },
  { schemeKey: "inverseOnSurface", semanticName: "inverse-surface-on", group: "Inverse" },
  { schemeKey: "inversePrimary", semanticName: "inverse-primary", group: "Inverse" },
  
  // Utility
  { schemeKey: "scrim", semanticName: "scrim", group: "Utility" },
  { schemeKey: "shadow", semanticName: "shadow-color", group: "Utility" },
  { schemeKey: "surfaceTint", semanticName: "surface-tint", group: "Utility" },
];

/** Semantic category display names and output order */
const SEMANTIC_CATEGORIES: Array<{ key: keyof SemanticConfig; displayName: string }> = [
  { key: "space", displayName: "Spacing Scale" },
  { key: "radius", displayName: "Border Radii" },
  { key: "shadow", displayName: "Shadows" },
  { key: "weight", displayName: "Font Weights" },
  { key: "leading", displayName: "Line Heights" },
  { key: "duration", displayName: "Durations" },
  { key: "ease", displayName: "Easings" },
  { key: "layer", displayName: "Z-Index Layers" },
];

/**
 * Format a semantic value for CSS output
 * - "0" -> 0
 * - "none" -> none
 * - "150ms" -> 150ms (numeric with unit)
 * - "size-3" -> var(--op-size-3) (token reference)
 */
function formatSemanticValue(value: string, primitivesPrefix: string): string {
  // Raw values
  if (value === "0" || value === "none") {
    return value;
  }

  // Numeric values starting with a digit (e.g., "150ms", "1.5")
  if (/^\d/.test(value)) {
    return value;
  }

  // Token reference - wrap with var()
  return `var(--${primitivesPrefix}-${value})`;
}

/**
 * Generate semantic.css content with light-dark() for colors
 */
export function generateSemanticCSS(
  lightScheme: SchemeColors,
  darkScheme: SchemeColors,
  semantic: SemanticConfig,
  prefixes: Prefixes,
  format: ColorFormat,
  seedHue: number
): string {
  const header = generateHeader(
    "Semantic Tokens (Tier 2) - THE APPLICATION API",
    "Generated from seed color",
    `Naming: --${prefixes.semantic}-[category]-[role]

This is the ONLY file developers should reference.
All tokens start with --${prefixes.semantic}-

Uses CSS light-dark() for reactive theming.`
  );

  const lines: string[] = [];
  lines.push(header);

  // Start CSS layer
  lines.push("@layer ui.theme {");
  lines.push("  :root {");
  lines.push("    color-scheme: light dark;");
  lines.push("");

  // Generate color tokens with light-dark()
  let currentGroup = "";
  for (const role of COLOR_ROLE_MAP) {
    const lightValue = lightScheme[role.schemeKey];
    const darkValue = darkScheme[role.schemeKey];

    if (!lightValue || !darkValue) continue;

    // Add group comment when group changes
    if (role.group !== currentGroup) {
      if (currentGroup !== "") {
        lines.push("");
      }
      lines.push(`    /* ${role.group} */`);
      currentGroup = role.group;
    }

    const lightFormatted = formatColor(lightValue, format);
    const darkFormatted = formatColor(darkValue, format);
    const cssVar = `--${prefixes.semantic}-color-${role.semanticName}`;
    
    lines.push(`    ${cssVar}: light-dark(${lightFormatted}, ${darkFormatted});`);
  }

  // Shadow color token (for atomic shadows)
  lines.push("");
  lines.push("    /* Shadow Color (for atomic shadows) */");
  lines.push(`    --${prefixes.semantic}-color-shadow: light-dark(oklch(0 0 0 / 0.1), oklch(0 0 0 / 0.6));`);

  // Shadow hue derived from seed
  lines.push("");
  lines.push("    /* Shadow Hue (derived from seed color) */");
  lines.push(`    --${prefixes.semantic}-shadow-hue: ${Math.round(seedHue)};`);

  // Generate non-color semantic tokens
  for (const category of SEMANTIC_CATEGORIES) {
    const tokens = semantic[category.key];
    if (!tokens || Object.keys(tokens).length === 0) continue;

    lines.push("");
    lines.push(`    /* ${category.displayName} */`);

    // Sort keys for consistent output
    const sortedKeys = Object.keys(tokens).sort((a, b) => {
      // Custom sort order for common patterns
      const order = ["none", "xs", "sm", "md", "base", "lg", "xl", "2xl", "3xl", "full"];
      const aIdx = order.indexOf(a);
      const bIdx = order.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

    for (const key of sortedKeys) {
      const value = tokens[key];
      const cssVar = `--${prefixes.semantic}-${category.key}-${key}`;
      const cssValue = formatSemanticValue(value, prefixes.primitives);
      lines.push(`    ${cssVar}: ${cssValue};`);
    }
  }

  lines.push("  }");
  lines.push("");

  // Theme toggle selectors
  lines.push("  /* Theme Toggles */");
  lines.push('  :root[data-theme="light"] { color-scheme: light; }');
  lines.push('  :root[data-theme="dark"] { color-scheme: dark; }');

  // Close layer
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}
