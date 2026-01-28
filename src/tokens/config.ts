/**
 * Token Generator Configuration
 * Opinionated defaults with minimal configuration options
 */

/** Supported color output formats */
export type ColorFormat = "oklch" | "hex" | "hsl" | "rgb";

/** CSS variable prefixes */
export interface Prefixes {
  primitives: string; // Open Props: --op-*
  palette: string; // Material palettes: --md-*
  semantic: string; // Semantic tokens: --ui-*
}

/** Output directory structure */
export interface OutputConfig {
  dir: string;
  paletteSubdir: string;
  openpropsSubdir: string;
}

/** Open Props configuration */
export interface OpenPropsConfig {
  baseUrl: string;
  files: string[];
}

/** Semantic token mappings */
export interface SemanticConfig {
  space: Record<string, string>;
  radius: Record<string, string>;
  shadow: Record<string, string>;
  weight: Record<string, string>;
  leading: Record<string, string>;
  duration: Record<string, string>;
  ease: Record<string, string>;
  layer: Record<string, string>;
}

/** Complete configuration */
export interface TokenConfig {
  format: ColorFormat;
  prefixes: Prefixes;
  output: OutputConfig;
  openprops: OpenPropsConfig;
  semantic: SemanticConfig;
}

/** Open Props file name to source path mapping */
export const OPENPROPS_FILES: Record<string, string> = {
  fonts: "props.fonts.css",
  sizes: "props.sizes.css",
  shadows: "props.shadows.css",
  borders: "props.borders.css",
  easings: "props.easing.css",
};

/** Default configuration - opinionated, ready to use */
export const DEFAULT_CONFIG: TokenConfig = {
  format: "oklch",

  prefixes: {
    primitives: "op",
    palette: "md",
    semantic: "ui",
  },

  output: {
    dir: "./tokens",
    paletteSubdir: "material",
    openpropsSubdir: "open-props",
  },

  openprops: {
    baseUrl:
      "https://raw.githubusercontent.com/argyleink/open-props/main/src",
    files: ["fonts", "sizes", "shadows", "borders", "easings"],
  },

  semantic: {
    space: {
      xs: "size-2",
      sm: "size-3",
      md: "size-4",
      lg: "size-5",
      xl: "size-6",
      "2xl": "size-7",
    },

    radius: {
      none: "0",
      sm: "radius-2",
      md: "radius-3",
      lg: "radius-4",
      full: "radius-round",
    },

    shadow: {
      sm: "shadow-2",
      md: "shadow-3",
      lg: "shadow-4",
      xl: "shadow-5",
    },

    weight: {
      light: "font-weight-3",
      normal: "font-weight-4",
      medium: "font-weight-5",
      semibold: "font-weight-6",
      bold: "font-weight-7",
    },

    leading: {
      none: "1",
      tight: "font-lineheight-1",
      snug: "font-lineheight-2",
      normal: "font-lineheight-3",
      relaxed: "font-lineheight-4",
      loose: "font-lineheight-5",
    },

    duration: {
      instant: "0ms",
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },

    ease: {
      linear: "ease-1",
      default: "ease-2",
      in: "ease-in-2",
      out: "ease-out-2",
      "in-out": "ease-in-out-2",
    },

    layer: {
      base: "1",
      raised: "10",
      dropdown: "100",
      sticky: "500",
      modal: "1000",
      toast: "2000",
    },
  },
};

/**
 * Merge user config with defaults
 */
export function mergeConfig(
  userConfig: Partial<TokenConfig>
): TokenConfig {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    prefixes: { ...DEFAULT_CONFIG.prefixes, ...userConfig.prefixes },
    output: { ...DEFAULT_CONFIG.output, ...userConfig.output },
    openprops: { ...DEFAULT_CONFIG.openprops, ...userConfig.openprops },
    semantic: { ...DEFAULT_CONFIG.semantic, ...userConfig.semantic },
  };
}
