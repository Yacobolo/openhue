/**
 * Material Theme Formatter
 * Formats the MaterialTheme object to JSON matching Material Theme Builder output
 */

import { MaterialTheme } from "./types";

/**
 * Formats a MaterialTheme object to a JSON string
 * Uses 4-space indentation to match Material Theme Builder output
 *
 * @param theme - The MaterialTheme object to format
 * @returns A formatted JSON string
 */
export function formatThemeJson(theme: MaterialTheme): string {
  return JSON.stringify(theme, null, 4);
}

/**
 * Parses a JSON string to a MaterialTheme object
 *
 * @param json - The JSON string to parse
 * @returns A MaterialTheme object
 * @throws Error if the JSON is invalid or doesn't match the expected structure
 */
export function parseThemeJson(json: string): MaterialTheme {
  const parsed = JSON.parse(json);

  // Basic validation
  if (!parsed.seed || !parsed.schemes || !parsed.palettes) {
    throw new Error("Invalid theme JSON: missing required fields");
  }

  return parsed as MaterialTheme;
}
