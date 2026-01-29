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
 * Returns colors for both light and dark modes.
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

/** Validate a hex color string */
export function isValidHex(hex: string): boolean {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}
