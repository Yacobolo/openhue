/**
 * Material Theme CLI - Type Definitions
 * Matches the output format of Material Theme Builder
 */

/** Color tokens for a single scheme (light, dark, or contrast variants) */
export interface SchemeColors {
  // Core colors
  primary: string;
  surfaceTint: string;
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

  // Surface colors
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;

  // Utility colors
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  // Fixed colors
  primaryFixed: string;
  onPrimaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixedVariant: string;
  secondaryFixed: string;
  onSecondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixedVariant: string;
  tertiaryFixed: string;
  onTertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixedVariant: string;

  // Surface container hierarchy
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
}

/** Tonal palette with colors at specific tone values (0-100) */
export interface TonalPaletteColors {
  "0": string;
  "5": string;
  "10": string;
  "15": string;
  "20": string;
  "25": string;
  "30": string;
  "35": string;
  "40": string;
  "50": string;
  "60": string;
  "70": string;
  "80": string;
  "90": string;
  "95": string;
  "98": string;
  "99": string;
  "100": string;
}

/** All scheme variants */
export interface Schemes {
  light: SchemeColors;
  "light-medium-contrast": SchemeColors;
  "light-high-contrast": SchemeColors;
  dark: SchemeColors;
  "dark-medium-contrast": SchemeColors;
  "dark-high-contrast": SchemeColors;
}

/** All tonal palettes */
export interface Palettes {
  primary: TonalPaletteColors;
  secondary: TonalPaletteColors;
  tertiary: TonalPaletteColors;
  neutral: TonalPaletteColors;
  "neutral-variant": TonalPaletteColors;
}

/** Core colors extracted from the seed */
export interface CoreColors {
  primary: string;
}

/** Complete Material Theme structure */
export interface MaterialTheme {
  description: string;
  seed: string;
  coreColors: CoreColors;
  extendedColors: unknown[];
  schemes: Schemes;
  palettes: Palettes;
}

/** Supported scheme variants */
export type SchemeVariant =
  | "tonal-spot"
  | "content"
  | "expressive"
  | "fidelity"
  | "monochrome"
  | "neutral"
  | "vibrant";

/** CLI options for the generate command */
export interface GenerateOptions {
  seed: string;
  output?: string;
  scheme: SchemeVariant;
}

/** Tone values used in tonal palettes */
export const TONE_VALUES = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100,
] as const;

export type ToneValue = (typeof TONE_VALUES)[number];
