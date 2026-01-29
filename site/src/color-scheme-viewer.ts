import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  generateScheme,
  generateVariantPreviews,
  generateTonalPalettes,
  isValidHex,
  hexToHCT,
  hctToHex,
  generateHueGradient,
  SCHEME_VARIANTS,
  VARIANT_LABELS,
  COLOR_FORMATS,
  TONE_STEPS,
  PALETTE_KEYS,
  PALETTE_LABELS,
  type SchemeColors,
  type SchemeVariant,
  type VariantPreview,
  type ColorFormat,
  type PaletteSet,
} from "./theme-generator.js";

/**
 * <color-scheme-viewer>
 *
 * Visual configurator for the design-tokens CLI.
 * Self-themed: the entire UI uses the generated M3 tokens.
 */
@customElement("color-scheme-viewer")
export class ColorSchemeViewer extends LitElement {
  @property({ type: String }) seed = "#769CDF";

  @state() private _variant: SchemeVariant = "tonal-spot";
  @state() private _isDark = false;
  @state() private _colors: SchemeColors | null = null;
  @state() private _hexInput = "#769CDF";
  @state() private _format: ColorFormat = "oklch";
  @state() private _outputDir = "./tokens";
  @state() private _variantPreviews: VariantPreview[] = [];
  @state() private _copiedCommand = false;
  @state() private _copiedSwatch = "";

  // Tonal palettes — derived from seed + variant
  @state() private _palettes: PaletteSet | null = null;

  // HCT state — derived from seed, drives the hue slider
  @state() private _hue = 0;
  @state() private _chroma = 0;
  @state() private _tone = 0;
  @state() private _hueGradient = "";

  // ────────────────────────────────────────────
  //  Styles — self-themed via CSS custom properties
  // ────────────────────────────────────────────

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      line-height: 1.5;
      color: var(--on-surface, #1d1b20);
      --transition-color: background-color 0.2s ease, color 0.2s ease,
        border-color 0.2s ease, box-shadow 0.2s ease;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    /* ─── Two-column layout ─── */
    .layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 32px;
      align-items: start;
    }

    /* ─── Left: Swatch preview ─── */
    .preview {
      min-width: 0;
    }

    .preview-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .preview-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: var(--on-surface, #1d1b20);
    }

    .mode-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.3px;
      background: var(--secondary-container, #e0e0e0);
      color: var(--on-secondary-container, #333);
      transition: var(--transition-color);
    }

    /* ─── Swatch grid ─── */
    .scheme-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2px;
      border-radius: 16px;
      overflow: hidden;
    }

    .swatch {
      padding: 12px 14px;
      min-height: 72px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      position: relative;
      transition: var(--transition-color);
    }

    .swatch:hover {
      opacity: 0.92;
    }

    .swatch.large {
      min-height: 96px;
    }

    .swatch .token-name {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    .swatch .hex-value {
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
      font-size: 11px;
      opacity: 0.75;
    }

    .swatch .copied-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      pointer-events: none;
      animation: fade-out 1s ease forwards;
    }

    @keyframes fade-out {
      0% {
        opacity: 1;
      }
      70% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }

    /* Surface section spans full width */
    .section-label {
      grid-column: 1 / -1;
      padding: 20px 14px 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      background: var(--surface, #fafafa);
      color: var(--on-surface-variant, #666);
      transition: var(--transition-color);
    }

    .span-full {
      grid-column: 1 / -1;
    }

    .surface-row {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
    }

    .surface-row.five {
      grid-template-columns: repeat(5, 1fr);
    }

    .surface-row.four {
      grid-template-columns: repeat(4, 1fr);
    }

    .surface-row.two {
      grid-template-columns: repeat(2, 1fr);
    }

    /* ─── Right: Sidebar configurator ─── */
    .sidebar {
      position: sticky;
      top: 24px;
      display: flex;
      flex-direction: column;
      gap: 0;
      background: var(--surface-container, #f0f0f0);
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid var(--outline-variant, #ddd);
      transition: var(--transition-color);
    }

    .sidebar-section {
      padding: 20px;
      border-bottom: 1px solid var(--outline-variant, #ddd);
      transition: var(--transition-color);
    }

    .sidebar-section:last-child {
      border-bottom: none;
    }

    .sidebar-section h3 {
      margin: 0 0 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--on-surface-variant, #666);
      transition: var(--transition-color);
    }

    /* ─── Hex seed input ─── */
    .seed-input-group {
      display: flex;
      align-items: stretch;
      gap: 0;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid var(--outline-variant, #ddd);
      transition: var(--transition-color);
    }

    .seed-input-group:focus-within {
      border-color: var(--primary, #6750a4);
    }

    .seed-swatch {
      width: 52px;
      flex-shrink: 0;
      transition: background-color 0.2s ease;
    }

    .seed-input {
      flex: 1;
      border: none;
      padding: 12px 14px;
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.5px;
      background: var(--surface-container-high, #e8e8e8);
      color: var(--on-surface, #1d1b20);
      outline: none;
      transition: var(--transition-color);
    }

    .seed-input::placeholder {
      color: var(--on-surface-variant, #666);
      opacity: 0.5;
    }

    .seed-error {
      font-size: 12px;
      color: var(--error, #b3261e);
      margin-top: 6px;
      min-height: 18px;
    }

    /* ─── Hue slider ─── */
    .hue-slider-group {
      margin-top: 4px;
    }

    .hue-slider-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }

    .hue-slider-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--on-surface-variant, #666);
      transition: var(--transition-color);
    }

    .hue-slider-value {
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
      font-size: 12px;
      color: var(--on-surface-variant, #666);
      transition: var(--transition-color);
    }

    .hue-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 16px;
      border-radius: 8px;
      outline: none;
      cursor: pointer;
      border: 2px solid var(--outline-variant, #ddd);
      transition: border-color 0.2s ease;
    }

    .hue-slider:focus {
      border-color: var(--primary, #6750a4);
    }

    /* Webkit thumb */
    .hue-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: white;
      border: 3px solid var(--on-surface, #1d1b20);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .hue-slider::-webkit-slider-thumb:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    /* Firefox thumb */
    .hue-slider::-moz-range-thumb {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: white;
      border: 3px solid var(--on-surface, #1d1b20);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      cursor: pointer;
    }

    .hue-slider::-moz-range-track {
      height: 12px;
      border-radius: 6px;
    }

    /* ─── Mode toggle (light/dark) ─── */
    .mode-toggle {
      display: flex;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid var(--outline-variant, #ddd);
      transition: var(--transition-color);
    }

    .mode-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      transition: var(--transition-color);
    }

    .mode-btn .icon {
      font-size: 16px;
      line-height: 1;
    }

    .mode-btn.active {
      background: var(--primary, #6750a4);
      color: var(--on-primary, #fff);
    }

    .mode-btn:not(.active) {
      background: var(--surface-container-high, #e8e8e8);
      color: var(--on-surface-variant, #666);
    }

    .mode-btn:not(.active):hover {
      background: var(--surface-container-highest, #e0e0e0);
    }

    /* ─── Variant selector cards ─── */
    .variant-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .variant-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 10px 4px 8px;
      border-radius: 12px;
      border: 2px solid transparent;
      cursor: pointer;
      background: var(--surface-container-high, #e8e8e8);
      transition: var(--transition-color);
    }

    .variant-card:hover {
      background: var(--surface-container-highest, #e0e0e0);
    }

    .variant-card.active {
      border-color: var(--primary, #6750a4);
      background: var(--primary-container, #eaddff);
    }

    .variant-card .dots {
      display: flex;
      gap: 3px;
    }

    .variant-card .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    }

    .variant-card .name {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      color: var(--on-surface-variant, #666);
      text-align: center;
      line-height: 1.2;
      transition: var(--transition-color);
    }

    .variant-card.active .name {
      color: var(--on-primary-container, #333);
    }

    /* ─── Format segmented control ─── */
    .segmented {
      display: flex;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid var(--outline-variant, #ddd);
      transition: var(--transition-color);
    }

    .seg-btn {
      flex: 1;
      padding: 8px 4px;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
      letter-spacing: 0.3px;
      transition: var(--transition-color);
    }

    .seg-btn.active {
      background: var(--primary, #6750a4);
      color: var(--on-primary, #fff);
    }

    .seg-btn:not(.active) {
      background: var(--surface-container-high, #e8e8e8);
      color: var(--on-surface-variant, #666);
    }

    .seg-btn:not(.active):hover {
      background: var(--surface-container-highest, #e0e0e0);
    }

    /* ─── Output dir input ─── */
    .dir-input {
      width: 100%;
      border: 2px solid var(--outline-variant, #ddd);
      border-radius: 12px;
      padding: 10px 14px;
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
      font-size: 13px;
      background: var(--surface-container-high, #e8e8e8);
      color: var(--on-surface, #1d1b20);
      outline: none;
      transition: var(--transition-color);
    }

    .dir-input:focus {
      border-color: var(--primary, #6750a4);
    }

    /* ─── CLI command block ─── */
    .command-block {
      position: relative;
      background: var(--surface-container-highest, #e0e0e0);
      border-radius: 12px;
      overflow: hidden;
      transition: var(--transition-color);
    }

    .command-code {
      display: block;
      padding: 14px 16px;
      padding-right: 48px;
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
      font-size: 12px;
      line-height: 1.6;
      color: var(--on-surface, #1d1b20);
      white-space: pre-wrap;
      word-break: break-all;
      transition: var(--transition-color);
    }

    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-container, #eaddff);
      color: var(--on-primary-container, #333);
      font-size: 14px;
      transition: var(--transition-color);
    }

    .copy-btn:hover {
      background: var(--primary, #6750a4);
      color: var(--on-primary, #fff);
    }

    .copy-btn.copied {
      background: var(--tertiary-container, #e0e0e0);
      color: var(--on-tertiary-container, #333);
    }

    /* ─── File tree ─── */
    .file-tree {
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
      font-size: 12px;
      line-height: 1.7;
      color: var(--on-surface-variant, #666);
      padding: 4px 0;
      transition: var(--transition-color);
    }

    .file-tree .dir {
      color: var(--primary, #6750a4);
      font-weight: 600;
      transition: var(--transition-color);
    }

    .file-tree .file {
      color: var(--on-surface, #1d1b20);
      transition: var(--transition-color);
    }

    /* ─── Tonal Palettes ─── */
    .palettes-section {
      margin-top: 40px;
    }

    .palettes-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .palettes-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: var(--on-surface, #1d1b20);
    }

    .palette-row {
      margin-bottom: 24px;
    }

    .palette-row:last-child {
      margin-bottom: 0;
    }

    .palette-label {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
      color: var(--on-surface-variant, #666);
      margin-bottom: 8px;
      transition: var(--transition-color);
    }

    .palette-strip {
      display: grid;
      grid-template-columns: repeat(18, 1fr);
      border-radius: 12px;
      overflow: hidden;
    }

    .tone-swatch {
      aspect-ratio: 1 / 1.4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      position: relative;
      transition: opacity 0.1s ease;
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
    }

    .tone-swatch:hover {
      opacity: 0.88;
    }

    .tone-swatch .copied-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
      pointer-events: none;
      white-space: nowrap;
      animation: fade-out 1s ease forwards;
    }

    /* ─── Responsive ─── */
    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        order: -1;
      }

      .scheme-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .surface-row.five {
        grid-template-columns: repeat(3, 1fr);
      }

      .palette-strip {
        grid-template-columns: repeat(9, 1fr);
      }

      .tone-swatch {
        aspect-ratio: 1 / 1;
      }
    }

    @media (max-width: 600px) {
      .scheme-grid {
        grid-template-columns: 1fr;
      }

      .surface-row,
      .surface-row.five,
      .surface-row.four,
      .surface-row.two {
        grid-template-columns: 1fr;
      }

      .variant-grid {
        grid-template-columns: repeat(4, 1fr);
      }

      .palette-strip {
        grid-template-columns: repeat(6, 1fr);
      }

      .tone-swatch {
        aspect-ratio: 1 / 1;
        font-size: 9px;
      }
    }
  `;

  // ────────────────────────────────────────────
  //  Lifecycle
  // ────────────────────────────────────────────

  connectedCallback() {
    super.connectedCallback();
    this._hexInput = this.seed;
    this._regenerate();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("seed")) {
      this._hexInput = this.seed;
      this._regenerate();
    }
  }

  // ────────────────────────────────────────────
  //  Core logic
  // ────────────────────────────────────────────

  private _regenerate() {
    if (!isValidHex(this._hexInput)) return;

    const hex = this._hexInput.startsWith("#")
      ? this._hexInput.toUpperCase()
      : `#${this._hexInput.toUpperCase()}`;

    this._colors = generateScheme(hex, this._variant, this._isDark);
    this._variantPreviews = generateVariantPreviews(hex, this._isDark);
    this._palettes = generateTonalPalettes(hex, this._variant);

    // Decompose seed into HCT for the hue slider
    const hct = hexToHCT(hex);
    this._hue = hct.hue;
    this._chroma = hct.chroma;
    this._tone = hct.tone;
    this._updateHueGradient();

    this._applyTokens();
    this._syncDarkAttribute();
  }

  // ────────────────────────────────────────────
  //  Event handlers
  // ────────────────────────────────────────────

  private _onHexInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    this._hexInput = raw;
    if (isValidHex(raw)) {
      this.seed = raw.startsWith("#")
        ? raw.toUpperCase()
        : `#${raw.toUpperCase()}`;
      this._regenerate();
    }
  }

  private _onHexBlur() {
    // Normalize on blur: ensure # prefix and uppercase
    if (isValidHex(this._hexInput)) {
      this._hexInput = this._hexInput.startsWith("#")
        ? this._hexInput.toUpperCase()
        : `#${this._hexInput.toUpperCase()}`;
    }
  }

  private _onHueInput(e: Event) {
    const hue = parseFloat((e.target as HTMLInputElement).value);
    this._hue = hue;
    // Reconstruct hex from new hue + existing chroma/tone
    const newHex = hctToHex(hue, this._chroma, this._tone);
    this._hexInput = newHex;
    this.seed = newHex;
    // Regenerate scheme but skip re-decomposing HCT (we already have correct values)
    this._colors = generateScheme(newHex, this._variant, this._isDark);
    this._variantPreviews = generateVariantPreviews(newHex, this._isDark);
    this._palettes = generateTonalPalettes(newHex, this._variant);
    this._applyTokens();
    this._syncDarkAttribute();
  }

  /** Compute the hue gradient CSS using the primary's fixed chroma + tone */
  private _updateHueGradient() {
    const stops = generateHueGradient(this._chroma, this._tone, 36);
    this._hueGradient = `linear-gradient(to right, ${stops.join(", ")})`;
  }

  /** Apply M3 tokens as CSS custom properties on the host */
  private _applyTokens() {
    if (!this._colors) return;
    const c = this._colors;
    const props: Record<string, string> = {
      "--primary": c.primary,
      "--on-primary": c.onPrimary,
      "--primary-container": c.primaryContainer,
      "--on-primary-container": c.onPrimaryContainer,
      "--secondary": c.secondary,
      "--on-secondary": c.onSecondary,
      "--secondary-container": c.secondaryContainer,
      "--on-secondary-container": c.onSecondaryContainer,
      "--tertiary": c.tertiary,
      "--on-tertiary": c.onTertiary,
      "--tertiary-container": c.tertiaryContainer,
      "--on-tertiary-container": c.onTertiaryContainer,
      "--error": c.error,
      "--on-error": c.onError,
      "--error-container": c.errorContainer,
      "--on-error-container": c.onErrorContainer,
      "--surface": c.surface,
      "--on-surface": c.onSurface,
      "--surface-variant": c.surfaceVariant,
      "--on-surface-variant": c.onSurfaceVariant,
      "--surface-dim": c.surfaceDim,
      "--surface-bright": c.surfaceBright,
      "--surface-container-lowest": c.surfaceContainerLowest,
      "--surface-container-low": c.surfaceContainerLow,
      "--surface-container": c.surfaceContainer,
      "--surface-container-high": c.surfaceContainerHigh,
      "--surface-container-highest": c.surfaceContainerHighest,
      "--outline": c.outline,
      "--outline-variant": c.outlineVariant,
      "--inverse-surface": c.inverseSurface,
      "--inverse-on-surface": c.inverseOnSurface,
      "--inverse-primary": c.inversePrimary,
      "--shadow": c.shadow,
      "--scrim": c.scrim,
    };
    for (const [name, value] of Object.entries(props)) {
      this.style.setProperty(name, value);
    }
  }

  /** Sync the dark attribute for external body styling */
  private _syncDarkAttribute() {
    if (this._isDark) {
      this.setAttribute("dark", "");
    } else {
      this.removeAttribute("dark");
    }
  }

  private _selectVariant(v: SchemeVariant) {
    this._variant = v;
    this._regenerate();
  }

  private _setMode(dark: boolean) {
    this._isDark = dark;
    this._regenerate();
  }

  private _selectFormat(f: ColorFormat) {
    this._format = f;
  }

  private _onDirInput(e: Event) {
    this._outputDir = (e.target as HTMLInputElement).value || "./tokens";
  }

  private async _copyCommand() {
    try {
      await navigator.clipboard.writeText(this._buildCommand());
      this._copiedCommand = true;
      setTimeout(() => (this._copiedCommand = false), 1500);
    } catch {
      // fallback: select text
    }
  }

  private async _copySwatchHex(key: string, hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      this._copiedSwatch = key;
      setTimeout(() => (this._copiedSwatch = ""), 1000);
    } catch {
      // ignore
    }
  }

  // ────────────────────────────────────────────
  //  Derived values
  // ────────────────────────────────────────────

  private _buildCommand(): string {
    const parts = [`bun src/index.ts -s "${this.seed}"`];
    if (this._format !== "oklch") parts.push(`-f ${this._format}`);
    if (this._variant !== "tonal-spot") parts.push(`--scheme ${this._variant}`);
    if (this._outputDir !== "./tokens") parts.push(`-o ${this._outputDir}`);
    return parts.join(" ");
  }

  // ────────────────────────────────────────────
  //  Swatch helpers
  // ────────────────────────────────────────────

  private _swatch(
    name: string,
    bgKey: keyof SchemeColors,
    fgKey: keyof SchemeColors,
    large = false
  ) {
    if (!this._colors) return nothing;
    const bg = this._colors[bgKey];
    const fg = this._colors[fgKey];
    const isCopied = this._copiedSwatch === bgKey;
    return html`
      <div
        class="swatch ${large ? "large" : ""}"
        style="background:${bg};color:${fg}"
        @click=${() => this._copySwatchHex(bgKey, bg)}
        title="Click to copy ${bg}"
      >
        <span class="token-name">${name}</span>
        <span class="hex-value">${bg}</span>
        ${isCopied
          ? html`<span class="copied-indicator">Copied</span>`
          : nothing}
      </div>
    `;
  }

  private _surfaceSwatch(name: string, bgKey: keyof SchemeColors) {
    if (!this._colors) return nothing;
    const bg = this._colors[bgKey];
    const fg = this._colors.onSurface;
    const isCopied = this._copiedSwatch === bgKey;
    return html`
      <div
        class="swatch"
        style="background:${bg};color:${fg}"
        @click=${() => this._copySwatchHex(bgKey, bg)}
        title="Click to copy ${bg}"
      >
        <span class="token-name">${name}</span>
        <span class="hex-value">${bg}</span>
        ${isCopied
          ? html`<span class="copied-indicator">Copied</span>`
          : nothing}
      </div>
    `;
  }

  // ────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────

  render() {
    if (!this._colors) return html`<p>Loading...</p>`;
    const c = this._colors;

    return html`
      <div class="layout">
        <!-- ═══ LEFT: Color scheme preview ═══ -->
        <div class="preview">
          <div class="preview-header">
            <h2>Color Scheme</h2>
            <span class="mode-badge">
              ${this._isDark ? "\u{263E}" : "\u{2600}"}
              ${this._isDark ? "Dark" : "Light"}
            </span>
          </div>

          <div class="scheme-grid">
            <!-- Primary family -->
            <div class="section-label">Primary</div>
            ${this._swatch("Primary", "primary", "onPrimary", true)}
            ${this._swatch("On Primary", "onPrimary", "primary")}
            ${this._swatch(
              "Primary Container",
              "primaryContainer",
              "onPrimaryContainer",
              true
            )}
            ${this._swatch(
              "On Primary Container",
              "onPrimaryContainer",
              "primaryContainer"
            )}

            <!-- Secondary family -->
            <div class="section-label">Secondary</div>
            ${this._swatch("Secondary", "secondary", "onSecondary", true)}
            ${this._swatch("On Secondary", "onSecondary", "secondary")}
            ${this._swatch(
              "Secondary Container",
              "secondaryContainer",
              "onSecondaryContainer",
              true
            )}
            ${this._swatch(
              "On Secondary Container",
              "onSecondaryContainer",
              "secondaryContainer"
            )}

            <!-- Tertiary family -->
            <div class="section-label">Tertiary</div>
            ${this._swatch("Tertiary", "tertiary", "onTertiary", true)}
            ${this._swatch("On Tertiary", "onTertiary", "tertiary")}
            ${this._swatch(
              "Tertiary Container",
              "tertiaryContainer",
              "onTertiaryContainer",
              true
            )}
            ${this._swatch(
              "On Tertiary Container",
              "onTertiaryContainer",
              "tertiaryContainer"
            )}

            <!-- Error family -->
            <div class="section-label">Error</div>
            ${this._swatch("Error", "error", "onError", true)}
            ${this._swatch("On Error", "onError", "error")}
            ${this._swatch(
              "Error Container",
              "errorContainer",
              "onErrorContainer",
              true
            )}
            ${this._swatch(
              "On Error Container",
              "onErrorContainer",
              "errorContainer"
            )}

            <!-- Surface hierarchy -->
            <div class="section-label">Surface</div>
            <div class="surface-row">
              ${this._surfaceSwatch("Surface Dim", "surfaceDim")}
              ${this._surfaceSwatch("Surface", "surface")}
              ${this._surfaceSwatch("Surface Bright", "surfaceBright")}
            </div>

            <div class="surface-row five">
              ${this._surfaceSwatch("Container Lowest", "surfaceContainerLowest")}
              ${this._surfaceSwatch("Container Low", "surfaceContainerLow")}
              ${this._surfaceSwatch("Container", "surfaceContainer")}
              ${this._surfaceSwatch("Container High", "surfaceContainerHigh")}
              ${this._surfaceSwatch(
                "Container Highest",
                "surfaceContainerHighest"
              )}
            </div>

            <!-- On Surface / Outline -->
            <div class="section-label">On Surface & Outline</div>
            <div class="surface-row four">
              <div
                class="swatch"
                style="background:${c.onSurface};color:${c.surface}"
                @click=${() => this._copySwatchHex("onSurface", c.onSurface)}
                title="Click to copy ${c.onSurface}"
              >
                <span class="token-name">On Surface</span>
                <span class="hex-value">${c.onSurface}</span>
                ${this._copiedSwatch === "onSurface"
                  ? html`<span class="copied-indicator">Copied</span>`
                  : nothing}
              </div>
              <div
                class="swatch"
                style="background:${c.onSurfaceVariant};color:${c.surface}"
                @click=${() =>
                  this._copySwatchHex("onSurfaceVariant", c.onSurfaceVariant)}
                title="Click to copy ${c.onSurfaceVariant}"
              >
                <span class="token-name">On Surface Variant</span>
                <span class="hex-value">${c.onSurfaceVariant}</span>
                ${this._copiedSwatch === "onSurfaceVariant"
                  ? html`<span class="copied-indicator">Copied</span>`
                  : nothing}
              </div>
              <div
                class="swatch"
                style="background:${c.outline};color:${c.surface}"
                @click=${() => this._copySwatchHex("outline", c.outline)}
                title="Click to copy ${c.outline}"
              >
                <span class="token-name">Outline</span>
                <span class="hex-value">${c.outline}</span>
                ${this._copiedSwatch === "outline"
                  ? html`<span class="copied-indicator">Copied</span>`
                  : nothing}
              </div>
              <div
                class="swatch"
                style="background:${c.outlineVariant};color:${c.onSurfaceVariant}"
                @click=${() =>
                  this._copySwatchHex("outlineVariant", c.outlineVariant)}
                title="Click to copy ${c.outlineVariant}"
              >
                <span class="token-name">Outline Variant</span>
                <span class="hex-value">${c.outlineVariant}</span>
                ${this._copiedSwatch === "outlineVariant"
                  ? html`<span class="copied-indicator">Copied</span>`
                  : nothing}
              </div>
            </div>

            <!-- Inverse + Utility -->
            <div class="section-label">Inverse & Utility</div>
            <div
              class="swatch"
              style="background:${c.inverseSurface};color:${c.inverseOnSurface}"
              @click=${() =>
                this._copySwatchHex("inverseSurface", c.inverseSurface)}
              title="Click to copy ${c.inverseSurface}"
            >
              <span class="token-name">Inverse Surface</span>
              <span class="hex-value">${c.inverseSurface}</span>
              ${this._copiedSwatch === "inverseSurface"
                ? html`<span class="copied-indicator">Copied</span>`
                : nothing}
            </div>
            <div
              class="swatch"
              style="background:${c.inverseOnSurface};color:${c.inverseSurface}"
              @click=${() =>
                this._copySwatchHex("inverseOnSurface", c.inverseOnSurface)}
              title="Click to copy ${c.inverseOnSurface}"
            >
              <span class="token-name">Inverse On Surface</span>
              <span class="hex-value">${c.inverseOnSurface}</span>
              ${this._copiedSwatch === "inverseOnSurface"
                ? html`<span class="copied-indicator">Copied</span>`
                : nothing}
            </div>
            <div
              class="swatch"
              style="background:${c.inversePrimary};color:${c.primary}"
              @click=${() =>
                this._copySwatchHex("inversePrimary", c.inversePrimary)}
              title="Click to copy ${c.inversePrimary}"
            >
              <span class="token-name">Inverse Primary</span>
              <span class="hex-value">${c.inversePrimary}</span>
              ${this._copiedSwatch === "inversePrimary"
                ? html`<span class="copied-indicator">Copied</span>`
                : nothing}
            </div>
            <div class="surface-row two">
              <div
                class="swatch"
                style="background:${c.scrim};color:white"
                @click=${() => this._copySwatchHex("scrim", c.scrim)}
                title="Click to copy ${c.scrim}"
              >
                <span class="token-name">Scrim</span>
                <span class="hex-value">${c.scrim}</span>
                ${this._copiedSwatch === "scrim"
                  ? html`<span class="copied-indicator">Copied</span>`
                  : nothing}
              </div>
              <div
                class="swatch"
                style="background:${c.shadow};color:white"
                @click=${() => this._copySwatchHex("shadow", c.shadow)}
                title="Click to copy ${c.shadow}"
              >
                <span class="token-name">Shadow</span>
                <span class="hex-value">${c.shadow}</span>
                ${this._copiedSwatch === "shadow"
                  ? html`<span class="copied-indicator">Copied</span>`
                  : nothing}
              </div>
            </div>
          </div>

          <!-- ═══ Tonal Palettes ═══ -->
          ${this._palettes
            ? html`
                <div class="palettes-section">
                  <div class="palettes-header">
                    <h2>Tonal Palettes</h2>
                  </div>
                  ${PALETTE_KEYS.map(
                    (key) => html`
                      <div class="palette-row">
                        <div class="palette-label">
                          ${PALETTE_LABELS[key]}
                        </div>
                        <div class="palette-strip">
                          ${TONE_STEPS.map((tone) => {
                            const hex =
                              this._palettes![
                                key as keyof PaletteSet
                              ][String(tone)];
                            const isLight = tone >= 50;
                            const textColor = isLight
                              ? "rgba(0,0,0,0.6)"
                              : "rgba(255,255,255,0.8)";
                            const copyKey = `${key}-${tone}`;
                            return html`
                              <div
                                class="tone-swatch"
                                style="background:${hex};color:${textColor}"
                                @click=${() =>
                                  this._copySwatchHex(copyKey, hex)}
                                title="${PALETTE_LABELS[key]} ${tone} — ${hex}"
                              >
                                ${tone}
                                ${this._copiedSwatch === copyKey
                                  ? html`<span class="copied-indicator"
                                      >Copied</span
                                    >`
                                  : nothing}
                              </div>
                            `;
                          })}
                        </div>
                      </div>
                    `
                  )}
                </div>
              `
            : nothing}
        </div>

        <!-- ═══ RIGHT: Configurator sidebar ═══ -->
        <div class="sidebar">
          <!-- Seed color -->
          <div class="sidebar-section">
            <h3>Brand Color</h3>
            <div class="seed-input-group">
              <div
                class="seed-swatch"
                style="background:${isValidHex(this._hexInput)
                  ? (this._hexInput.startsWith("#")
                      ? this._hexInput
                      : `#${this._hexInput}`)
                  : "#ccc"}"
              ></div>
              <input
                class="seed-input"
                type="text"
                .value=${this._hexInput}
                @input=${this._onHexInput}
                @blur=${this._onHexBlur}
                placeholder="#769CDF"
                spellcheck="false"
                autocomplete="off"
              />
            </div>
            <div class="seed-error">
              ${!isValidHex(this._hexInput) && this._hexInput.length > 1
                ? "Enter a valid hex color"
                : ""}
            </div>

            <!-- Hue slider -->
            <div class="hue-slider-group">
              <div class="hue-slider-header">
                <span class="hue-slider-label">Hue</span>
                <span class="hue-slider-value">${Math.round(this._hue)}\u00B0</span>
              </div>
              <input
                class="hue-slider"
                type="range"
                min="0"
                max="360"
                step="1"
                .value=${String(Math.round(this._hue))}
                @input=${this._onHueInput}
                style="background:${this._hueGradient}"
              />
            </div>
          </div>

          <!-- Mode toggle -->
          <div class="sidebar-section">
            <h3>Appearance</h3>
            <div class="mode-toggle">
              <button
                class="mode-btn ${!this._isDark ? "active" : ""}"
                @click=${() => this._setMode(false)}
              >
                <span class="icon">\u{2600}\u{FE0F}</span> Light
              </button>
              <button
                class="mode-btn ${this._isDark ? "active" : ""}"
                @click=${() => this._setMode(true)}
              >
                <span class="icon">\u{263E}</span> Dark
              </button>
            </div>
          </div>

          <!-- Variant selector -->
          <div class="sidebar-section">
            <h3>Scheme Variant</h3>
            <div class="variant-grid">
              ${this._variantPreviews.map(
                (p) => html`
                  <div
                    class="variant-card ${p.variant === this._variant
                      ? "active"
                      : ""}"
                    @click=${() => this._selectVariant(p.variant)}
                    title="${VARIANT_LABELS[p.variant]}"
                  >
                    <div class="dots">
                      <div class="dot" style="background:${p.primary}"></div>
                      <div class="dot" style="background:${p.secondary}"></div>
                      <div class="dot" style="background:${p.tertiary}"></div>
                    </div>
                    <span class="name"
                      >${VARIANT_LABELS[p.variant]}</span
                    >
                  </div>
                `
              )}
            </div>
          </div>

          <!-- Color format -->
          <div class="sidebar-section">
            <h3>Color Format</h3>
            <div class="segmented">
              ${COLOR_FORMATS.map(
                (f) => html`
                  <button
                    class="seg-btn ${f === this._format ? "active" : ""}"
                    @click=${() => this._selectFormat(f)}
                  >
                    ${f}
                  </button>
                `
              )}
            </div>
          </div>

          <!-- Output directory -->
          <div class="sidebar-section">
            <h3>Output Directory</h3>
            <input
              class="dir-input"
              type="text"
              .value=${this._outputDir}
              @input=${this._onDirInput}
              placeholder="./tokens"
              spellcheck="false"
            />
          </div>

          <!-- CLI command -->
          <div class="sidebar-section">
            <h3>CLI Command</h3>
            <div class="command-block">
              <code class="command-code">${this._buildCommand()}</code>
              <button
                class="copy-btn ${this._copiedCommand ? "copied" : ""}"
                @click=${this._copyCommand}
                title="Copy command"
              >
                ${this._copiedCommand ? "\u{2713}" : "\u{2398}"}
              </button>
            </div>
          </div>

          <!-- File tree -->
          <div class="sidebar-section">
            <h3>Output Structure</h3>
            <div class="file-tree">${this._renderFileTree()}</div>
          </div>
        </div>
      </div>
    `;
  }

  private _renderFileTree() {
    const dir = this._outputDir.replace(/\/$/, "");
    const lines = [
      { text: `${dir}/`, isDir: true, indent: 0 },
      { text: "index.css", isDir: false, indent: 1 },
      { text: "semantic.css", isDir: false, indent: 1 },
      { text: "app.css", isDir: false, indent: 1 },
      { text: "material/", isDir: true, indent: 1 },
      { text: "palettes.css", isDir: false, indent: 2 },
      { text: "open-props/", isDir: true, indent: 1 },
      { text: "borders.css", isDir: false, indent: 2 },
      { text: "easings.css", isDir: false, indent: 2 },
      { text: "fonts.css", isDir: false, indent: 2 },
      { text: "shadows.css", isDir: false, indent: 2 },
      { text: "sizes.css", isDir: false, indent: 2 },
    ];

    // Build tree connector chars
    const getPrefix = (indent: number, idx: number) => {
      if (indent === 0) return "";
      // Look ahead to see if this is the last child at this indent level
      const siblings = lines.filter(
        (l, i) => i > idx && l.indent === indent && lines.slice(idx + 1, i).every((s) => s.indent >= indent)
      );
      // Check if any following lines are still children or siblings
      let isLast = true;
      for (let i = idx + 1; i < lines.length; i++) {
        if (lines[i].indent < indent) break;
        if (lines[i].indent === indent) {
          isLast = false;
          break;
        }
      }
      const connector = isLast ? "\u{2514}\u{2500}\u{2500} " : "\u{251C}\u{2500}\u{2500} ";
      const padding = "    ".repeat(indent - 1);
      return padding + connector;
    };

    return html`${lines.map(
      (line, idx) => html`
        <div>
          <span style="opacity:0.4">${getPrefix(line.indent, idx)}</span
          ><span class="${line.isDir ? "dir" : "file"}">${line.text}</span>
        </div>
      `
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "color-scheme-viewer": ColorSchemeViewer;
  }
}
