# Material Theme CLI - Implementation Plan

## Overview

Build a CLI tool that generates Material Design 3 color themes from a seed color, matching the exact output format of the [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/).

## Goals

- Generate full theme JSON from a single hex color seed
- Match Material Theme Builder output format exactly
- Support all scheme variants (light, dark, contrast levels)
- Generate complete tonal palettes (primary, secondary, tertiary, neutral, neutral-variant)
- Zero reliance on the web tool

## Technical Approach

Use Google's official `@material/material-color-utilities` npm package which provides:
- **HCT Color Space**: Hue-Chroma-Tone based on CAM16 + L*
- **DynamicScheme**: Generates all color tokens with contrast level support
- **TonalPalette**: Creates tone scales from 0-100
- **SchemeTonalSpot**: Default Material You algorithm (matches sample data)

## Architecture

```
material-theme-cli/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── generator.ts      # Theme generation logic
│   ├── formatter.ts      # JSON output formatting
│   └── types.ts          # TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md
```

## CLI Interface

```bash
# Basic usage
npx material-theme-cli generate --seed "#769CDF"

# Full options
npx material-theme-cli generate \
  --seed "#769CDF" \
  --output theme.json \
  --scheme tonal-spot
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--seed` | Hex color (required) | - |
| `--output` | Output file path | stdout |
| `--scheme` | Scheme variant | `tonal-spot` |

### Scheme Variants

- `tonal-spot` - Default Material You (Android 12+)
- `content` - High fidelity to source
- `expressive` - More colorful
- `fidelity` - Maximum source color fidelity
- `monochrome` - Grayscale
- `neutral` - Muted colors
- `vibrant` - High saturation

## Output Format

Match the Material Theme Builder JSON structure exactly:

```json
{
  "description": "TYPE: CUSTOM\nMaterial Theme Builder export ...",
  "seed": "#769CDF",
  "coreColors": {
    "primary": "#769CDF"
  },
  "extendedColors": [],
  "schemes": {
    "light": { ... },
    "light-medium-contrast": { ... },
    "light-high-contrast": { ... },
    "dark": { ... },
    "dark-medium-contrast": { ... },
    "dark-high-contrast": { ... }
  },
  "palettes": {
    "primary": { "0": "#000000", "5": "...", ... "100": "#FFFFFF" },
    "secondary": { ... },
    "tertiary": { ... },
    "neutral": { ... },
    "neutral-variant": { ... }
  }
}
```

## Scheme Color Tokens (per scheme)

Each scheme contains ~50+ color tokens:

### Core
- `primary`, `onPrimary`, `primaryContainer`, `onPrimaryContainer`
- `secondary`, `onSecondary`, `secondaryContainer`, `onSecondaryContainer`
- `tertiary`, `onTertiary`, `tertiaryContainer`, `onTertiaryContainer`
- `error`, `onError`, `errorContainer`, `onErrorContainer`

### Surface
- `background`, `onBackground`
- `surface`, `onSurface`, `surfaceTint`
- `surfaceVariant`, `onSurfaceVariant`
- `surfaceDim`, `surfaceBright`
- `surfaceContainerLowest`, `surfaceContainerLow`, `surfaceContainer`, `surfaceContainerHigh`, `surfaceContainerHighest`

### Utility
- `outline`, `outlineVariant`
- `shadow`, `scrim`
- `inverseSurface`, `inverseOnSurface`, `inversePrimary`

### Fixed Colors
- `primaryFixed`, `primaryFixedDim`, `onPrimaryFixed`, `onPrimaryFixedVariant`
- `secondaryFixed`, `secondaryFixedDim`, `onSecondaryFixed`, `onSecondaryFixedVariant`
- `tertiaryFixed`, `tertiaryFixedDim`, `onTertiaryFixed`, `onTertiaryFixedVariant`

## Tonal Palette Tones

Generate colors at these tone values: `0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100`

## Contrast Level Mapping

| Scheme Suffix | `contrastLevel` Parameter |
|---------------|---------------------------|
| (none) | `0.0` (standard) |
| `-medium-contrast` | `0.5` |
| `-high-contrast` | `1.0` |

## Implementation Tasks

### Phase 1: Project Setup
- [ ] Initialize npm project
- [ ] Configure TypeScript
- [ ] Add dependencies (`@material/material-color-utilities`, `commander`)

### Phase 2: Core Types
- [ ] Define `MaterialTheme` interface
- [ ] Define `SchemeColors` interface
- [ ] Define `TonalPalette` interface

### Phase 3: Theme Generator
- [ ] Implement `generateTheme(seed: string)` function
- [ ] Generate 6 scheme variants using `DynamicScheme`
- [ ] Generate 5 tonal palettes using `TonalPalette`
- [ ] Map all color tokens from `MaterialDynamicColors`

### Phase 4: Output Formatting
- [ ] Convert ARGB integers to hex strings
- [ ] Format JSON to match Material Theme Builder structure
- [ ] Add description metadata

### Phase 5: CLI
- [ ] Setup commander.js
- [ ] Implement `generate` command
- [ ] Add input validation for hex colors
- [ ] Support stdout and file output

### Phase 6: Testing
- [ ] Verify output against sample data files
- [ ] Test edge cases (black, white, saturated colors)

## Dependencies

```json
{
  "dependencies": {
    "@material/material-color-utilities": "^0.3.0",
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0"
  }
}
```

## Success Criteria

1. Running `npx material-theme-cli generate --seed "#769CDF"` produces JSON that matches `data/material-theme (2).json`
2. All color values match within acceptable tolerance (hex colors are identical or differ by at most 1 in any RGB channel due to rounding)
3. JSON structure is identical to Material Theme Builder export

## References

- [Material Color Utilities (GitHub)](https://github.com/material-foundation/material-color-utilities)
- [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/)
- [Material 3 Color System](https://m3.material.io/styles/color/overview)
