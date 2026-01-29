<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo.svg">
    <source media="(prefers-color-scheme: light)" srcset="logo-light.svg">
    <img src="logo-light.svg" alt="BaseToken" width="36" valign="middle">
  </picture>
  BaseToken
</h1>

Generate Material Design 3 color tokens from a seed color using the HCT color space.

Outputs CSS custom properties for light, dark, and contrast-adjusted schemes — ready to drop into any project.

**[Live Demo](https://yacobolo.github.io/basetoken)**

## Features

- Full Material Design 3 color system from a single hex seed
- HCT (Hue, Chroma, Tone) color space for perceptually uniform palettes
- 7 scheme variants: tonal-spot, content, expressive, fidelity, monochrome, neutral, vibrant
- 3 contrast levels: standard, medium (AA+), high (AAA)
- Output as `oklch`, `hex`, `hsl`, or `rgb`
- Semantic tokens, tonal palettes, and surface roles
- Open Props–style CSS custom properties

## Quick Start

```bash
npx basetoken --seed "#6750A4"
```

This generates a full set of CSS design tokens in `./tokens/`:

```
tokens/
  index.css              # Aggregated imports for all token files
  semantic.css           # Semantic tokens (light/dark via prefers-color-scheme)
  app.css                # App-level CSS template (created once, not overwritten)
  material/
    palettes.css         # Tonal palettes (primary, secondary, tertiary, neutral, neutral-variant)
  open-props/
    fonts.css            # Font families, sizes, weights, line-heights
    sizes.css            # Spacing and sizing scale
    shadows.css          # Shadow definitions
    borders.css          # Border sizes and radii
    easings.css          # Easing and animation curves
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --seed <hex>` | Seed color as hex (e.g. `#769CDF`) | **required** |
| `-o, --output <dir>` | Output directory | `./tokens` |
| `-f, --format <fmt>` | Color format: `oklch`, `hex`, `hsl`, `rgb` | `oklch` |
| `--scheme <variant>` | Scheme variant (see below) | `tonal-spot` |
| `--contrast <level>` | Contrast level: `standard`, `medium`, `high` | `standard` |

### Scheme Variants

| Variant | Description |
|---------|-------------|
| `tonal-spot` | Balanced, versatile — the M3 default |
| `content` | Colors derived from the seed, muted and harmonious |
| `expressive` | Vivid, high-chroma palettes |
| `fidelity` | Stays close to the exact seed hue and chroma |
| `monochrome` | Grayscale, zero chroma |
| `neutral` | Subtle, low-chroma palette |
| `vibrant` | Bold, saturated colors |

## Examples

```bash
# Expressive scheme in hex format
npx basetoken --seed "#E8175D" --scheme expressive --format hex

# High contrast, custom output directory
npx basetoken --seed "#1A73E8" --contrast high --output ./design-system/tokens

# Monochrome scheme
npx basetoken --seed "#333333" --scheme monochrome
```

## Interactive Configurator

The [live demo site](https://yacobolo.github.io/basetoken) lets you:

- Pick a seed color and see the generated scheme in real time
- Compare all 7 scheme variants side by side
- Toggle between light and dark modes
- Adjust contrast levels
- Copy the CLI command or individual color values

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 18+

### CLI

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Run the built CLI
node dist/index.js --seed "#769CDF"

# Run during development (no build step)
npm run dev -- --seed "#769CDF"

# Run tests
npm test
```

### Site (Configurator)

```bash
cd site

# Install dependencies
npm install

# Dev server
npm run dev

# Production build
npm run build
```

## Tech Stack

**CLI:** TypeScript, Node.js, Commander.js, `@material/material-color-utilities`, Culori, tsup

**Site:** Lit 3 (Web Components), Vite 6, TypeScript — no UI framework, all CSS in Shadow DOM

## License

ISC
