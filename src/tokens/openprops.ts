/**
 * Open Props Fetcher and Transformer
 * Fetches CSS from Open Props GitHub and transforms for our use
 */

import type { Prefixes } from "./config";
import { generateHeader } from "./css";

/** Open Props file name to source path mapping */
const OPENPROPS_SOURCE_FILES: Record<string, string> = {
  fonts: "props.fonts.css",
  sizes: "props.sizes.css",
  shadows: "props.shadows.css",
  borders: "props.borders.css",
  easings: "props.easing.css",
  animations: "props.animations.css",
  aspects: "props.aspects.css",
  zindex: "props.zindex.css",
};

/**
 * Fetch CSS content from Open Props GitHub
 */
export async function fetchOpenProps(
  baseUrl: string,
  fileName: string
): Promise<string> {
  const sourcePath = OPENPROPS_SOURCE_FILES[fileName];
  if (!sourcePath) {
    throw new Error(`Unknown Open Props file: ${fileName}`);
  }

  const url = `${baseUrl}/${sourcePath}`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Transform Open Props CSS:
 * - Remove @import statements
 * - Convert :where(html) to :root
 * - Convert @media (--OSdark) to prefers-color-scheme
 */
export function transformOpenPropsCSS(
  css: string,
  fileName: string,
  seedHue: number
): string {
  // Remove @import statements
  css = css.replace(/@import\s+['"][^'"]+['"]\s*;?\s*\n?/g, "");

  // Convert :where(html) to :root
  css = css.replace(/:where\(html\)/g, ":root");

  // Convert @media (--OSdark) to proper media query
  css = css.replace(/@media\s*\(--OSdark\)\s*\{/g, "@media (prefers-color-scheme: dark) {");

  // Special handling for shadows - inject theme-aware shadow color
  if (fileName === "shadows") {
    css = injectShadowColor(css, seedHue);
  }

  return css.trim();
}

/**
 * Inject theme-aware shadow colors derived from seed hue
 */
function injectShadowColor(css: string, seedHue: number): string {
  const hue = Math.round(seedHue);

  // Light mode shadow color: low saturation, dark
  const lightShadowColor = `${hue} 10% 15%`;
  // Dark mode shadow color: more saturation, very dark
  const darkShadowColor = `${hue} 30% 5%`;

  // Replace the default shadow-color in :root
  css = css.replace(
    /(--shadow-color:\s*)[\d\s%]+;/g,
    `$1${lightShadowColor};`
  );

  // Find and update dark mode section
  const darkSectionMatch = css.match(
    /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:(?:root|where\(html\))\s*\{([^}]+)\}\s*\}/
  );

  if (darkSectionMatch) {
    let darkContent = darkSectionMatch[1];
    
    // Update shadow-color in dark content
    darkContent = darkContent.replace(
      /(--shadow-color:\s*)[\d\s%]+;/g,
      `$1${darkShadowColor};`
    );

    // Build replacement with data-theme support
    const replacement = `[data-theme="dark"] {${darkContent}}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {${darkContent}}
}`;

    // Replace the original @media block
    css = css.replace(
      /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:(?:root|where\(html\))\s*\{[^}]+\}\s*\}/,
      replacement
    );
  }

  return css;
}

/**
 * Prefix all CSS custom properties with the given prefix
 * --size-3 becomes --op-size-3
 */
export function prefixOpenPropsCSS(css: string, prefix: string): string {
  // Match CSS custom property definitions
  // Be careful not to match var(--...) usage, only property definitions
  return css.replace(
    /(^|\s|;)(--)(([a-zA-Z][a-zA-Z0-9-]*))\s*:/gm,
    `$1--${prefix}-$3:`
  );
}

/**
 * Generate a complete Open Props CSS file with header
 */
export function generateOpenPropsCSS(
  name: string,
  content: string,
  prefix: string,
  seedHue: number
): string {
  // Transform and prefix the CSS
  const transformed = transformOpenPropsCSS(content, name, seedHue);
  const prefixed = prefixOpenPropsCSS(transformed, prefix);

  // Generate title (capitalize first letter)
  const title = name.charAt(0).toUpperCase() + name.slice(1) + " Tokens";

  const header = generateHeader(
    title,
    "Open Props (https://open-props.style)"
  );

  return header + prefixed + "\n";
}

/**
 * Fetch and generate all Open Props files
 */
export async function fetchAllOpenProps(
  baseUrl: string,
  fileNames: string[],
  prefix: string,
  seedHue: number
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Fetch all files in parallel
  const fetchPromises = fileNames.map(async (name) => {
    const content = await fetchOpenProps(baseUrl, name);
    const css = generateOpenPropsCSS(name, content, prefix, seedHue);
    return { name, css };
  });

  const fetched = await Promise.all(fetchPromises);

  for (const { name, css } of fetched) {
    results.set(name, css);
  }

  return results;
}
