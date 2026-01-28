/**
 * Material Theme Generator
 * Generates Material Design 3 color themes from a seed color
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
  hexFromArgb as hexFromArgbLower,
  TonalPalette,
} from "@material/material-color-utilities";

/**
 * Converts ARGB integer to uppercase hex string
 */
function hexFromArgb(argb: number): string {
  return hexFromArgbLower(argb).toUpperCase();
}

import {
  MaterialTheme,
  SchemeColors,
  TonalPaletteColors,
  Palettes,
  Schemes,
  SchemeVariant,
  TONE_VALUES,
} from "./types.js";

/** Contrast levels for different scheme variants */
const CONTRAST_LEVELS = {
  standard: 0.0,
  medium: 0.5,
  high: 1.0,
} as const;

// Type for scheme instances that have all the properties we need
interface SchemeInstance {
  primary: number;
  surfaceTint: number;
  onPrimary: number;
  primaryContainer: number;
  onPrimaryContainer: number;
  secondary: number;
  onSecondary: number;
  secondaryContainer: number;
  onSecondaryContainer: number;
  tertiary: number;
  onTertiary: number;
  tertiaryContainer: number;
  onTertiaryContainer: number;
  error: number;
  onError: number;
  errorContainer: number;
  onErrorContainer: number;
  background: number;
  onBackground: number;
  surface: number;
  onSurface: number;
  surfaceVariant: number;
  onSurfaceVariant: number;
  outline: number;
  outlineVariant: number;
  shadow: number;
  scrim: number;
  inverseSurface: number;
  inverseOnSurface: number;
  inversePrimary: number;
  primaryFixed: number;
  onPrimaryFixed: number;
  primaryFixedDim: number;
  onPrimaryFixedVariant: number;
  secondaryFixed: number;
  onSecondaryFixed: number;
  secondaryFixedDim: number;
  onSecondaryFixedVariant: number;
  tertiaryFixed: number;
  onTertiaryFixed: number;
  tertiaryFixedDim: number;
  onTertiaryFixedVariant: number;
  surfaceDim: number;
  surfaceBright: number;
  surfaceContainerLowest: number;
  surfaceContainerLow: number;
  surfaceContainer: number;
  surfaceContainerHigh: number;
  surfaceContainerHighest: number;
  primaryPalette: TonalPalette;
  secondaryPalette: TonalPalette;
  tertiaryPalette: TonalPalette;
  neutralPalette: TonalPalette;
  neutralVariantPalette: TonalPalette;
}

/** Map of scheme variant names to their constructors */
const SCHEME_CONSTRUCTORS: Record<
  SchemeVariant,
  new (hct: Hct, isDark: boolean, contrast: number) => SchemeInstance
> = {
  "tonal-spot": SchemeTonalSpot as unknown as new (
    hct: Hct,
    isDark: boolean,
    contrast: number
  ) => SchemeInstance,
  content: SchemeContent as unknown as new (
    hct: Hct,
    isDark: boolean,
    contrast: number
  ) => SchemeInstance,
  expressive: SchemeExpressive as unknown as new (
    hct: Hct,
    isDark: boolean,
    contrast: number
  ) => SchemeInstance,
  fidelity: SchemeFidelity as unknown as new (
    hct: Hct,
    isDark: boolean,
    contrast: number
  ) => SchemeInstance,
  monochrome: SchemeMonochrome as unknown as new (
    hct: Hct,
    isDark: boolean,
    contrast: number
  ) => SchemeInstance,
  neutral: SchemeNeutral as unknown as new (
    hct: Hct,
    isDark: boolean,
    contrast: number
  ) => SchemeInstance,
  vibrant: SchemeVibrant as unknown as new (
    hct: Hct,
    isDark: boolean,
    contrast: number
  ) => SchemeInstance,
};

/**
 * Creates a DynamicScheme instance for the given parameters
 */
function createScheme(
  sourceHct: Hct,
  isDark: boolean,
  contrastLevel: number,
  variant: SchemeVariant
): SchemeInstance {
  const SchemeClass = SCHEME_CONSTRUCTORS[variant];
  return new SchemeClass(sourceHct, isDark, contrastLevel);
}

/**
 * Extracts all color tokens from a DynamicScheme and returns them as hex strings
 */
function extractSchemeColors(scheme: SchemeInstance): SchemeColors {
  return {
    // Core colors
    primary: hexFromArgb(scheme.primary),
    surfaceTint: hexFromArgb(scheme.surfaceTint),
    onPrimary: hexFromArgb(scheme.onPrimary),
    primaryContainer: hexFromArgb(scheme.primaryContainer),
    onPrimaryContainer: hexFromArgb(scheme.onPrimaryContainer),
    secondary: hexFromArgb(scheme.secondary),
    onSecondary: hexFromArgb(scheme.onSecondary),
    secondaryContainer: hexFromArgb(scheme.secondaryContainer),
    onSecondaryContainer: hexFromArgb(scheme.onSecondaryContainer),
    tertiary: hexFromArgb(scheme.tertiary),
    onTertiary: hexFromArgb(scheme.onTertiary),
    tertiaryContainer: hexFromArgb(scheme.tertiaryContainer),
    onTertiaryContainer: hexFromArgb(scheme.onTertiaryContainer),
    error: hexFromArgb(scheme.error),
    onError: hexFromArgb(scheme.onError),
    errorContainer: hexFromArgb(scheme.errorContainer),
    onErrorContainer: hexFromArgb(scheme.onErrorContainer),

    // Surface colors
    background: hexFromArgb(scheme.background),
    onBackground: hexFromArgb(scheme.onBackground),
    surface: hexFromArgb(scheme.surface),
    onSurface: hexFromArgb(scheme.onSurface),
    surfaceVariant: hexFromArgb(scheme.surfaceVariant),
    onSurfaceVariant: hexFromArgb(scheme.onSurfaceVariant),
    outline: hexFromArgb(scheme.outline),
    outlineVariant: hexFromArgb(scheme.outlineVariant),

    // Utility colors
    shadow: hexFromArgb(scheme.shadow),
    scrim: hexFromArgb(scheme.scrim),
    inverseSurface: hexFromArgb(scheme.inverseSurface),
    inverseOnSurface: hexFromArgb(scheme.inverseOnSurface),
    inversePrimary: hexFromArgb(scheme.inversePrimary),

    // Fixed colors
    primaryFixed: hexFromArgb(scheme.primaryFixed),
    onPrimaryFixed: hexFromArgb(scheme.onPrimaryFixed),
    primaryFixedDim: hexFromArgb(scheme.primaryFixedDim),
    onPrimaryFixedVariant: hexFromArgb(scheme.onPrimaryFixedVariant),
    secondaryFixed: hexFromArgb(scheme.secondaryFixed),
    onSecondaryFixed: hexFromArgb(scheme.onSecondaryFixed),
    secondaryFixedDim: hexFromArgb(scheme.secondaryFixedDim),
    onSecondaryFixedVariant: hexFromArgb(scheme.onSecondaryFixedVariant),
    tertiaryFixed: hexFromArgb(scheme.tertiaryFixed),
    onTertiaryFixed: hexFromArgb(scheme.onTertiaryFixed),
    tertiaryFixedDim: hexFromArgb(scheme.tertiaryFixedDim),
    onTertiaryFixedVariant: hexFromArgb(scheme.onTertiaryFixedVariant),

    // Surface container hierarchy
    surfaceDim: hexFromArgb(scheme.surfaceDim),
    surfaceBright: hexFromArgb(scheme.surfaceBright),
    surfaceContainerLowest: hexFromArgb(scheme.surfaceContainerLowest),
    surfaceContainerLow: hexFromArgb(scheme.surfaceContainerLow),
    surfaceContainer: hexFromArgb(scheme.surfaceContainer),
    surfaceContainerHigh: hexFromArgb(scheme.surfaceContainerHigh),
    surfaceContainerHighest: hexFromArgb(scheme.surfaceContainerHighest),
  };
}

/**
 * Generates a tonal palette from a TonalPalette
 */
function extractTonalPalette(palette: TonalPalette): TonalPaletteColors {
  const result: Record<string, string> = {};
  for (const tone of TONE_VALUES) {
    result[tone.toString()] = hexFromArgb(palette.tone(tone));
  }
  return result as unknown as TonalPaletteColors;
}

/**
 * Generates all 6 scheme variants (light/dark x 3 contrast levels)
 */
function generateSchemes(sourceHct: Hct, variant: SchemeVariant): Schemes {
  return {
    light: extractSchemeColors(
      createScheme(sourceHct, false, CONTRAST_LEVELS.standard, variant)
    ),
    "light-medium-contrast": extractSchemeColors(
      createScheme(sourceHct, false, CONTRAST_LEVELS.medium, variant)
    ),
    "light-high-contrast": extractSchemeColors(
      createScheme(sourceHct, false, CONTRAST_LEVELS.high, variant)
    ),
    dark: extractSchemeColors(
      createScheme(sourceHct, true, CONTRAST_LEVELS.standard, variant)
    ),
    "dark-medium-contrast": extractSchemeColors(
      createScheme(sourceHct, true, CONTRAST_LEVELS.medium, variant)
    ),
    "dark-high-contrast": extractSchemeColors(
      createScheme(sourceHct, true, CONTRAST_LEVELS.high, variant)
    ),
  };
}

/**
 * Generates all 5 tonal palettes from the seed color
 */
function generatePalettes(sourceHct: Hct, variant: SchemeVariant): Palettes {
  // Create a scheme to get the palettes (we use light/standard, palettes are the same across modes)
  const scheme = createScheme(
    sourceHct,
    false,
    CONTRAST_LEVELS.standard,
    variant
  );

  return {
    primary: extractTonalPalette(scheme.primaryPalette),
    secondary: extractTonalPalette(scheme.secondaryPalette),
    tertiary: extractTonalPalette(scheme.tertiaryPalette),
    neutral: extractTonalPalette(scheme.neutralPalette),
    "neutral-variant": extractTonalPalette(scheme.neutralVariantPalette),
  };
}

/**
 * Generates a complete Material Theme from a seed color
 *
 * @param seedHex - The seed color as a hex string (e.g., "#769CDF")
 * @param variant - The scheme variant to use (default: "tonal-spot")
 * @returns A complete MaterialTheme object
 */
export function generateTheme(
  seedHex: string,
  variant: SchemeVariant = "tonal-spot"
): MaterialTheme {
  // Normalize the seed hex (ensure it has # prefix and is uppercase)
  const normalizedSeed = seedHex.startsWith("#")
    ? seedHex.toUpperCase()
    : `#${seedHex.toUpperCase()}`;

  // Convert hex to ARGB, then to HCT
  const argb = argbFromHex(normalizedSeed);
  const sourceHct = Hct.fromInt(argb);

  // Generate the theme
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  return {
    description: `TYPE: CUSTOM\nMaterial Theme Builder export ${timestamp}`,
    seed: normalizedSeed,
    coreColors: {
      primary: normalizedSeed,
    },
    extendedColors: [],
    schemes: generateSchemes(sourceHct, variant),
    palettes: generatePalettes(sourceHct, variant),
  };
}

/**
 * Validates that a string is a valid hex color
 */
export function isValidHexColor(hex: string): boolean {
  const hexPattern = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(hex);
}
