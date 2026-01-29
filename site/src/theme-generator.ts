/**
 * Browser-side Material Design 3 theme generation.
 * Takes a hex seed color and produces scheme colors for light/dark modes.
 */
import {
  Hct,
  SchemeTonalSpot,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeVibrant,
  argbFromHex,
  hexFromArgb,
  TonalPalette,
} from "@material/material-color-utilities";

export type SchemeVariant =
  | "tonal-spot"
  | "content"
  | "expressive"
  | "fidelity"
  | "monochrome"
  | "neutral"
  | "vibrant";

export const SCHEME_VARIANTS: SchemeVariant[] = [
  "tonal-spot",
  "content",
  "expressive",
  "fidelity",
  "monochrome",
  "neutral",
  "vibrant",
];

/** Human-readable labels for each variant */
export const VARIANT_LABELS: Record<SchemeVariant, string> = {
  "tonal-spot": "Tonal Spot",
  content: "Content",
  expressive: "Expressive",
  fidelity: "Fidelity",
  monochrome: "Monochrome",
  neutral: "Neutral",
  vibrant: "Vibrant",
};

/** All color tokens we extract from a scheme */
export interface SchemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  shadow: string;
  scrim: string;
}

/** Subset of colors used for variant preview cards */
export interface VariantPreview {
  variant: SchemeVariant;
  primary: string;
  secondary: string;
  tertiary: string;
  surface: string;
  onSurface: string;
}

// Map variant names to their constructor classes
const SCHEME_CONSTRUCTORS: Record<
  SchemeVariant,
  new (hct: Hct, isDark: boolean, contrast: number) => any
> = {
  "tonal-spot": SchemeTonalSpot as any,
  content: SchemeContent as any,
  expressive: SchemeExpressive as any,
  fidelity: SchemeFidelity as any,
  monochrome: SchemeMonochrome as any,
  neutral: SchemeNeutral as any,
  vibrant: SchemeVibrant as any,
};

/** Extract all named color tokens from a scheme instance */
function extractSchemeColors(scheme: any): SchemeColors {
  const hex = (argb: number) => hexFromArgb(argb).toUpperCase();
  return {
    primary: hex(scheme.primary),
    onPrimary: hex(scheme.onPrimary),
    primaryContainer: hex(scheme.primaryContainer),
    onPrimaryContainer: hex(scheme.onPrimaryContainer),
    secondary: hex(scheme.secondary),
    onSecondary: hex(scheme.onSecondary),
    secondaryContainer: hex(scheme.secondaryContainer),
    onSecondaryContainer: hex(scheme.onSecondaryContainer),
    tertiary: hex(scheme.tertiary),
    onTertiary: hex(scheme.onTertiary),
    tertiaryContainer: hex(scheme.tertiaryContainer),
    onTertiaryContainer: hex(scheme.onTertiaryContainer),
    error: hex(scheme.error),
    onError: hex(scheme.onError),
    errorContainer: hex(scheme.errorContainer),
    onErrorContainer: hex(scheme.onErrorContainer),
    surface: hex(scheme.surface),
    onSurface: hex(scheme.onSurface),
    surfaceVariant: hex(scheme.surfaceVariant),
    onSurfaceVariant: hex(scheme.onSurfaceVariant),
    surfaceDim: hex(scheme.surfaceDim),
    surfaceBright: hex(scheme.surfaceBright),
    surfaceContainerLowest: hex(scheme.surfaceContainerLowest),
    surfaceContainerLow: hex(scheme.surfaceContainerLow),
    surfaceContainer: hex(scheme.surfaceContainer),
    surfaceContainerHigh: hex(scheme.surfaceContainerHigh),
    surfaceContainerHighest: hex(scheme.surfaceContainerHighest),
    outline: hex(scheme.outline),
    outlineVariant: hex(scheme.outlineVariant),
    inverseSurface: hex(scheme.inverseSurface),
    inverseOnSurface: hex(scheme.inverseOnSurface),
    inversePrimary: hex(scheme.inversePrimary),
    shadow: hex(scheme.shadow),
    scrim: hex(scheme.scrim),
  };
}

/**
 * Generate Material Design 3 scheme colors from a hex seed.
 */
export function generateScheme(
  seedHex: string,
  variant: SchemeVariant = "tonal-spot",
  isDark: boolean = false,
  contrastLevel: number = 0.0
): SchemeColors {
  const normalized = seedHex.startsWith("#") ? seedHex : `#${seedHex}`;
  const argb = argbFromHex(normalized);
  const hct = Hct.fromInt(argb);
  const Constructor = SCHEME_CONSTRUCTORS[variant];
  const scheme = new Constructor(hct, isDark, contrastLevel);
  return extractSchemeColors(scheme);
}

/**
 * Generate lightweight preview colors for all variants (used by variant selector cards).
 * Returns primary/secondary/tertiary/surface for each variant.
 */
export function generateVariantPreviews(
  seedHex: string,
  isDark: boolean = false
): VariantPreview[] {
  const normalized = seedHex.startsWith("#") ? seedHex : `#${seedHex}`;
  const argb = argbFromHex(normalized);
  const hct = Hct.fromInt(argb);
  const hex = (val: number) => hexFromArgb(val).toUpperCase();

  return SCHEME_VARIANTS.map((variant) => {
    const Constructor = SCHEME_CONSTRUCTORS[variant];
    const scheme = new Constructor(hct, isDark, 0.0);
    return {
      variant,
      primary: hex(scheme.primary),
      secondary: hex(scheme.secondary),
      tertiary: hex(scheme.tertiary),
      surface: hex(scheme.surfaceContainer),
      onSurface: hex(scheme.onSurface),
    };
  });
}

/**
 * Convert SchemeColors to a flat map of CSS custom property name -> value.
 * Uses camelCase-to-kebab conversion: primaryContainer -> --primary-container
 */
export function schemeToCSSProperties(colors: SchemeColors): Record<string, string> {
  const props: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    const cssName = `--${camelToKebab(key)}`;
    props[cssName] = value;
  }
  return props;
}

/** Apply scheme colors as CSS custom properties on an element */
export function applySchemeToElement(el: HTMLElement, colors: SchemeColors): void {
  const props = schemeToCSSProperties(colors);
  for (const [name, value] of Object.entries(props)) {
    el.style.setProperty(name, value);
  }
}

/** Convert camelCase to kebab-case */
function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/** Validate a hex color string */
export function isValidHex(hex: string): boolean {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

/** Supported color formats for CLI output */
export type ColorFormat = "oklch" | "hex" | "hsl" | "rgb";

export const COLOR_FORMATS: ColorFormat[] = ["oklch", "hex", "hsl", "rgb"];

// ────────────────────────────────────────────
//  HCT utilities
// ────────────────────────────────────────────

/** HCT decomposition of a color */
export interface HCTValues {
  hue: number;    // [0, 360)
  chroma: number; // [0, ~150] — depends on hue+tone
  tone: number;   // [0, 100]
}

/** Decompose a hex color into HCT components */
export function hexToHCT(hex: string): HCTValues {
  const normalized = hex.startsWith("#") ? hex : `#${hex}`;
  const argb = argbFromHex(normalized);
  const hct = Hct.fromInt(argb);
  return { hue: hct.hue, chroma: hct.chroma, tone: hct.tone };
}

/** Construct a hex color from HCT components */
export function hctToHex(hue: number, chroma: number, tone: number): string {
  const hct = Hct.from(hue, chroma, tone);
  return hexFromArgb(hct.toInt()).toUpperCase();
}

/**
 * Generate a hue gradient as an array of hex color stops.
 * Keeps chroma and tone fixed (from the primary color) while sweeping hue 0-360.
 * This shows the user what the primary would look like at every hue.
 */
export function generateHueGradient(
  chroma: number,
  tone: number,
  steps: number = 36
): string[] {
  const colors: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const hue = (i / steps) * 360;
    const hct = Hct.from(hue, chroma, tone);
    colors.push(hexFromArgb(hct.toInt()).toUpperCase());
  }
  return colors;
}

// ────────────────────────────────────────────
//  Tonal Palette generation
// ────────────────────────────────────────────

/** Tone steps in display order (light → dark, matching Material Theme Builder) */
export const TONE_STEPS = [
  100, 99, 98, 95, 90, 80, 70, 60, 50, 40, 35, 30, 25, 20, 15, 10, 5, 0,
] as const;

export type ToneStep = (typeof TONE_STEPS)[number];

/** A single tonal palette: tone step → hex color */
export type TonalPaletteData = Record<string, string>;

/** All 6 tonal palettes derived from a seed + variant */
export interface PaletteSet {
  primary: TonalPaletteData;
  secondary: TonalPaletteData;
  tertiary: TonalPaletteData;
  neutral: TonalPaletteData;
  neutralVariant: TonalPaletteData;
  error: TonalPaletteData;
}

/** Human-readable labels for each palette */
export const PALETTE_LABELS: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
  neutral: "Neutral",
  neutralVariant: "Neutral Variant",
  error: "Error",
};

/** The palette keys in display order */
export const PALETTE_KEYS = [
  "primary",
  "secondary",
  "tertiary",
  "neutral",
  "neutralVariant",
  "error",
] as const;

/** Extract a TonalPaletteData from a MCU TonalPalette */
function extractPaletteData(palette: TonalPalette): TonalPaletteData {
  const data: TonalPaletteData = {};
  for (const tone of TONE_STEPS) {
    data[String(tone)] = hexFromArgb(palette.tone(tone)).toUpperCase();
  }
  return data;
}

/**
 * Generate all 6 tonal palettes from a hex seed and scheme variant.
 * Uses the scheme's palette accessors (primaryPalette, secondaryPalette, etc.)
 * so the palettes reflect the variant's hue/chroma mappings.
 */
export function generateTonalPalettes(
  seedHex: string,
  variant: SchemeVariant = "tonal-spot"
): PaletteSet {
  const normalized = seedHex.startsWith("#") ? seedHex : `#${seedHex}`;
  const argb = argbFromHex(normalized);
  const hct = Hct.fromInt(argb);
  const Constructor = SCHEME_CONSTRUCTORS[variant];
  // Palettes are the same regardless of dark/light, use light + standard contrast
  const scheme = new Constructor(hct, false, 0.0) as any;

  return {
    primary: extractPaletteData(scheme.primaryPalette),
    secondary: extractPaletteData(scheme.secondaryPalette),
    tertiary: extractPaletteData(scheme.tertiaryPalette),
    neutral: extractPaletteData(scheme.neutralPalette),
    neutralVariant: extractPaletteData(scheme.neutralVariantPalette),
    error: extractPaletteData(scheme.errorPalette),
  };
}
