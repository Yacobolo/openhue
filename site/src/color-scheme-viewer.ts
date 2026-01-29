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

/** Fire callback on Enter or Space keydown (standard button activation keys) */
function onActivate(callback: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };
}

/** Simple debounce: delays fn execution until after `ms` ms of inactivity */
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/**
 * <color-scheme-viewer>
 *
 * Visual configurator for the design-tokens CLI.
 * Self-themed: the entire UI uses the generated M3 tokens.
 */
type ThemePreference = "light" | "dark";

@customElement("color-scheme-viewer")
export class ColorSchemeViewer extends LitElement {
  @property({ type: String }) seed = "#769CDF";

  @state() private _variant: SchemeVariant = "tonal-spot";
  @state() private _contrastLevel: number = 0.0;
  @state() private _themePreference: ThemePreference = "light";
  @state() private _lightColors: SchemeColors | null = null;
  @state() private _darkColors: SchemeColors | null = null;
  @state() private _hexInput = "#769CDF";
  @state() private _format: ColorFormat = "oklch";
  @state() private _outputDir = "./tokens";
  @state() private _variantPreviews: VariantPreview[] = [];
  @state() private _copiedCommand = false;
  @state() private _copiedSwatch = "";

  // Tonal palettes — derived from seed + variant (cached, mode-independent)
  @state() private _palettes: PaletteSet | null = null;
  private _palettesCacheKey = "";

  // HCT state — derived from seed, drives the hue slider
  @state() private _hue = 0;
  @state() private _chroma = 0;
  @state() private _tone = 0;
  @state() private _hueGradient = "";

  // Debounced regeneration for continuous input (slider, typing)
  private _debouncedRegenerate = debounce(() => this._regenerate(), 16);

  // System prefers-color-scheme media query (used only for initial default)
  private _darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  /** Resolved dark state for the page chrome (sidebar, background) */
  private get _resolvedDark(): boolean {
    return this._themePreference === "dark";
  }

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

    /* Focus outline for keyboard navigation */
    [role="button"]:focus-visible,
    [role="radio"]:focus-visible {
      outline: 2px solid var(--primary, #6750a4);
      outline-offset: 2px;
    }

    /* ─── Two-column layout: sidebar LEFT, preview RIGHT ─── */
    .layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 32px;
      align-items: start;
    }

    /* ─── Right: Dual scheme preview ─── */
    .preview {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* ─── Scheme containers (light / dark) ─── */
    .scheme-container {
      border-radius: 20px;
      padding: 24px;
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }

    .scheme-container--light {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
    }

    .scheme-container--dark {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.06);
    }

    .scheme-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .scheme-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    .scheme-header-icon {
      display: flex;
      align-items: center;
      opacity: 0.6;
    }

    /* Ensure the condensed grid fills the container */
    .scheme-container .scheme-main {
    }

    /* ─── Condensed scheme card layout ─── */
    .scheme-main {
      display: grid;
      grid-template-columns: repeat(3, 1fr) 220px;
      gap: 16px;
    }

    /* Vertical color family stacks */
    .color-stack {
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
    }

    .swatch {
      padding: 16px;
      height: 60px;
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      position: relative;
      transition: var(--transition-color);
      box-sizing: border-box;
    }

    .swatch:hover {
      opacity: 0.92;
    }

    .swatch.large {
      height: 100px;
    }

    .swatch .token-name {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
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

    /* Left content area spanning first 3 columns */
    .left-content {
      grid-column: span 3;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Surface / utility rows inside left-content */
    .surface-row {
      display: flex;
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
    }

    .surface-row > div {
      flex: 1;
    }

    .surface-row.five > div {
      flex: 1;
    }

    .surface-row.four > div {
      flex: 1;
    }

    /* Right-bottom section (inverse + utility) */
    .right-bottom {
      display: flex;
      flex-direction: column;
    }

    .right-bottom .color-stack {
      flex: 1;
    }

    .utility-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }

    .utility-row .swatch {
      font-weight: bold;
      border-radius: 8px;
    }

    /* ─── Left: Sidebar configurator ─── */
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
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--outline-variant, #ddd) transparent;
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

    /* ─── Theme toggle (system / light / dark cycle) ─── */
    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 16px;
      border-radius: 12px;
      border: 2px solid var(--outline-variant, #ddd);
      background: var(--surface-container-high, #e8e8e8);
      color: var(--on-surface, #1d1b20);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      transition: var(--transition-color);
    }

    .theme-toggle:hover {
      background: var(--surface-container-highest, #e0e0e0);
      border-color: var(--outline, #bbb);
    }

    .theme-toggle:focus-visible {
      outline: 2px solid var(--primary, #6750a4);
      outline-offset: 2px;
    }

    .theme-toggle-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .theme-toggle-label {
      flex: 1;
      text-align: left;
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
    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: 300px 1fr;
        gap: 24px;
      }

      .scheme-container {
        padding: 20px;
      }
    }

    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        order: -1;
        max-height: none;
        overflow-y: visible;
      }

      .scheme-main {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .left-content {
        grid-column: span 2;
        gap: 12px;
      }

      .utility-row {
        gap: 12px;
        margin-top: 12px;
      }

      .palette-strip {
        grid-template-columns: repeat(9, 1fr);
      }

      .tone-swatch {
        aspect-ratio: 1 / 1;
      }
    }

    @media (max-width: 600px) {
      .scheme-container {
        padding: 16px;
        border-radius: 16px;
      }

      .scheme-main {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .left-content {
        grid-column: span 1;
        gap: 10px;
      }

      .utility-row {
        gap: 10px;
        margin-top: 10px;
      }

      .surface-row {
        flex-direction: column;
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
    // Use system preference only for initial default
    this._themePreference = this._darkMediaQuery.matches ? "dark" : "light";
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

    // Generate BOTH light and dark schemes with current contrast level
    this._lightColors = generateScheme(hex, this._variant, false, this._contrastLevel);
    this._darkColors = generateScheme(hex, this._variant, true, this._contrastLevel);

    // Variant previews — reactive to current light/dark preference and contrast
    this._variantPreviews = generateVariantPreviews(hex, this._resolvedDark, this._contrastLevel);

    // Only recompute tonal palettes when seed or variant actually changes
    const paletteCacheKey = `${hex}|${this._variant}`;
    if (this._palettesCacheKey !== paletteCacheKey) {
      this._palettes = generateTonalPalettes(hex, this._variant);
      this._palettesCacheKey = paletteCacheKey;
    }

    // Decompose seed into HCT for the hue slider
    const hct = hexToHCT(hex);
    this._hue = hct.hue;
    this._chroma = hct.chroma;
    this._tone = hct.tone;
    this._updateHueGradient();

    this._applyTokens();
    this._applyPageTheme();
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
      this._debouncedRegenerate();
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
    this._debouncedRegenerate();
  }

  /** Compute the hue gradient CSS using the primary's fixed chroma + tone */
  private _updateHueGradient() {
    const stops = generateHueGradient(this._chroma, this._tone, 36);
    this._hueGradient = `linear-gradient(to right, ${stops.join(", ")})`;
  }

  /**
   * Apply M3 tokens as CSS custom properties on the host.
   * Uses the resolved theme (system/light/dark) to style the sidebar chrome.
   */
  private _applyTokens() {
    const c = this._resolvedDark ? this._darkColors : this._lightColors;
    if (!c) return;
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

  /** Sync page body class, dark attribute, and page background based on resolved theme */
  private _applyPageTheme() {
    const dark = this._resolvedDark;
    if (dark) {
      this.setAttribute("dark", "");
    } else {
      this.removeAttribute("dark");
    }
    document.body.classList.toggle("dark", dark);

    // Set page background/text to the actual generated scheme tokens
    const c = dark ? this._darkColors : this._lightColors;
    if (c) {
      document.body.style.setProperty("--page-bg", c.surface);
      document.body.style.setProperty("--page-text", c.onSurface);
    }
  }

  private _selectVariant(v: SchemeVariant) {
    this._variant = v;
    this._regenerate();
  }

  private _cycleTheme() {
    this._themePreference = this._themePreference === "light" ? "dark" : "light";
    this._applyTokens();
    this._applyPageTheme();
    // Re-generate variant previews so dots reflect current light/dark state
    if (isValidHex(this._hexInput)) {
      const hex = this._hexInput.startsWith("#")
        ? this._hexInput.toUpperCase()
        : `#${this._hexInput.toUpperCase()}`;
      this._variantPreviews = generateVariantPreviews(hex, this._resolvedDark, this._contrastLevel);
    }
  }

  private _selectContrast(level: number) {
    this._contrastLevel = level;
    this._regenerate();
  }

  private _selectFormat(f: ColorFormat) {
    this._format = f;
  }

  private _onDirInput(e: Event) {
    this._outputDir = (e.target as HTMLInputElement).value || "./tokens";
  }

  private async _copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for insecure contexts or iframe restrictions:
      // use a temporary textarea to execute document.execCommand('copy')
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  private async _copyCommand() {
    const success = await this._copyToClipboard(this._buildCommand());
    if (success) {
      this._copiedCommand = true;
      setTimeout(() => (this._copiedCommand = false), 1500);
    }
  }

  private async _copySwatchHex(key: string, hex: string) {
    const success = await this._copyToClipboard(hex);
    if (success) {
      this._copiedSwatch = key;
      setTimeout(() => (this._copiedSwatch = ""), 1000);
    }
  }

  // ────────────────────────────────────────────
  //  Derived values
  // ────────────────────────────────────────────

  private _buildCommand(): string {
    const parts = [`bun src/index.ts -s "${this.seed}"`];
    if (this._format !== "oklch") parts.push(`-f ${this._format}`);
    if (this._variant !== "tonal-spot") parts.push(`--scheme ${this._variant}`);
    if (this._contrastLevel === 0.5) parts.push("--contrast medium");
    if (this._contrastLevel === 1.0) parts.push("--contrast high");
    if (this._outputDir !== "./tokens") parts.push(`-o ${this._outputDir}`);
    return parts.join(" ");
  }

  // ────────────────────────────────────────────
  //  Swatch helpers
  // ────────────────────────────────────────────

  private _swatch(
    colors: SchemeColors,
    prefix: string,
    name: string,
    bgKey: keyof SchemeColors,
    fgKey: keyof SchemeColors,
    large = false
  ) {
    const bg = colors[bgKey];
    const fg = colors[fgKey];
    const copyKey = `${prefix}-${bgKey}`;
    const isCopied = this._copiedSwatch === copyKey;
    return html`
      <div
        class="swatch ${large ? "large" : ""}"
        style="background:${bg};color:${fg}"
        role="button"
        tabindex="0"
        aria-label="${name}: ${bg}. Click to copy."
        @click=${() => this._copySwatchHex(copyKey, bg)}
        @keydown=${onActivate(() => this._copySwatchHex(copyKey, bg))}
        title="Click to copy ${bg}"
      >
        <span class="token-name">${name}</span>
        ${isCopied
          ? html`<span class="copied-indicator" aria-live="polite">Copied</span>`
          : nothing}
      </div>
    `;
  }

  private _surfaceSwatch(
    colors: SchemeColors,
    prefix: string,
    name: string,
    bgKey: keyof SchemeColors
  ) {
    const bg = colors[bgKey];
    const fg = colors.onSurface;
    const copyKey = `${prefix}-${bgKey}`;
    const isCopied = this._copiedSwatch === copyKey;
    return html`
      <div
        class="swatch"
        style="background:${bg};color:${fg}"
        role="button"
        tabindex="0"
        aria-label="${name}: ${bg}. Click to copy."
        @click=${() => this._copySwatchHex(copyKey, bg)}
        @keydown=${onActivate(() => this._copySwatchHex(copyKey, bg))}
        title="Click to copy ${bg}"
      >
        <span class="token-name">${name}</span>
        ${isCopied
          ? html`<span class="copied-indicator" aria-live="polite">Copied</span>`
          : nothing}
      </div>
    `;
  }

  /** Swatch with a fixed (non-token) foreground color, e.g. white on scrim/shadow */
  private _fixedFgSwatch(
    colors: SchemeColors,
    prefix: string,
    name: string,
    bgKey: keyof SchemeColors,
    fg: string
  ) {
    const bg = colors[bgKey];
    const copyKey = `${prefix}-${bgKey}`;
    const isCopied = this._copiedSwatch === copyKey;
    return html`
      <div
        class="swatch"
        role="button"
        tabindex="0"
        aria-label="${name}: ${bg}. Click to copy."
        style="background:${bg};color:${fg}"
        @click=${() => this._copySwatchHex(copyKey, bg)}
        @keydown=${onActivate(() => this._copySwatchHex(copyKey, bg))}
        title="Click to copy ${bg}"
      >
        <span class="token-name">${name}</span>
        ${isCopied
          ? html`<span class="copied-indicator" aria-live="polite">Copied</span>`
          : nothing}
      </div>
    `;
  }

  /** Inline swatch used in the On Surface & Outline / Inverse sections */
  private _inlineSwatch(
    colors: SchemeColors,
    prefix: string,
    name: string,
    bgKey: keyof SchemeColors,
    fgKey: keyof SchemeColors
  ) {
    const bg = colors[bgKey];
    const fg = colors[fgKey];
    const copyKey = `${prefix}-${bgKey}`;
    const isCopied = this._copiedSwatch === copyKey;
    return html`
      <div
        class="swatch"
        role="button"
        tabindex="0"
        aria-label="${name}: ${bg}. Click to copy."
        style="background:${bg};color:${fg}"
        @click=${() => this._copySwatchHex(copyKey, bg)}
        @keydown=${onActivate(() => this._copySwatchHex(copyKey, bg))}
        title="Click to copy ${bg}"
      >
        <span class="token-name">${name}</span>
        ${isCopied
          ? html`<span class="copied-indicator" aria-live="polite">Copied</span>`
          : nothing}
      </div>
    `;
  }

  /**
   * Render a condensed scheme card matching the M3 reference layout.
   * Top row: 4 vertical stacks (Primary | Secondary | Tertiary | Error).
   * Below: Surface rows span left 3 cols, Inverse + Utility in the right col.
   *
   * @param colors  The generated scheme colors
   * @param prefix  Unique prefix for copy-key namespacing ("light" or "dark")
   */
  private _renderSchemeGrid(colors: SchemeColors, prefix: string) {
    const s = (name: string, bg: keyof SchemeColors, fg: keyof SchemeColors, large = false) =>
      this._swatch(colors, prefix, name, bg, fg, large);
    const ss = (name: string, bg: keyof SchemeColors) =>
      this._surfaceSwatch(colors, prefix, name, bg);
    const is = (name: string, bg: keyof SchemeColors, fg: keyof SchemeColors) =>
      this._inlineSwatch(colors, prefix, name, bg, fg);

    return html`
      <div class="scheme-main">
        <!-- Primary stack -->
        <div class="color-stack">
          ${s("Primary", "primary", "onPrimary", true)}
          ${s("On Primary", "onPrimary", "primary")}
          ${s("Primary Container", "primaryContainer", "onPrimaryContainer", true)}
          ${s("On Primary Container", "onPrimaryContainer", "primaryContainer")}
        </div>

        <!-- Secondary stack -->
        <div class="color-stack">
          ${s("Secondary", "secondary", "onSecondary", true)}
          ${s("On Secondary", "onSecondary", "secondary")}
          ${s("Secondary Container", "secondaryContainer", "onSecondaryContainer", true)}
          ${s("On Secondary Container", "onSecondaryContainer", "secondaryContainer")}
        </div>

        <!-- Tertiary stack -->
        <div class="color-stack">
          ${s("Tertiary", "tertiary", "onTertiary", true)}
          ${s("On Tertiary", "onTertiary", "tertiary")}
          ${s("Tertiary Container", "tertiaryContainer", "onTertiaryContainer", true)}
          ${s("On Tertiary Container", "onTertiaryContainer", "tertiaryContainer")}
        </div>

        <!-- Error stack -->
        <div class="color-stack">
          ${s("Error", "error", "onError", true)}
          ${s("On Error", "onError", "error")}
          ${s("Error Container", "errorContainer", "onErrorContainer", true)}
          ${s("On Error Container", "onErrorContainer", "errorContainer")}
        </div>

        <!-- Surface rows span left 3 columns -->
        <div class="left-content">
          <div class="surface-row">
            ${ss("Surface Dim", "surfaceDim")}
            ${ss("Surface", "surface")}
            ${ss("Surface Bright", "surfaceBright")}
          </div>
          <div class="surface-row five">
            ${ss("Cont. Lowest", "surfaceContainerLowest")}
            ${ss("Cont. Low", "surfaceContainerLow")}
            ${ss("Container", "surfaceContainer")}
            ${ss("Cont. High", "surfaceContainerHigh")}
            ${ss("Cont. Highest", "surfaceContainerHighest")}
          </div>
          <div class="surface-row four">
            ${is("On Surface", "onSurface", "surface")}
            ${is("On Surface Var.", "onSurfaceVariant", "surface")}
            ${is("Outline", "outline", "surface")}
            ${is("Outline Variant", "outlineVariant", "onSurfaceVariant")}
          </div>
        </div>

        <!-- Inverse + Utility in the right column -->
        <div class="right-bottom">
          <div class="color-stack">
            ${is("Inverse Surface", "inverseSurface", "inverseOnSurface")}
            ${is("Inverse On Surface", "inverseOnSurface", "inverseSurface")}
            ${is("Inverse Primary", "inversePrimary", "primary")}
          </div>
          <div class="utility-row">
            ${this._fixedFgSwatch(colors, prefix, "Scrim", "scrim", "#FFFFFF")}
            ${this._fixedFgSwatch(colors, prefix, "Shadow", "shadow", "#FFFFFF")}
          </div>
        </div>
      </div>
    `;
  }

  // ────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────

  render() {
    if (!this._lightColors || !this._darkColors) return html`<p>Loading...</p>`;

    // SVG icons for the theme toggle and scheme headers
    const sunIcon = html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonIcon = html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;

    const themeIcon = this._themePreference === "light" ? sunIcon : moonIcon;
    const themeLabel = this._themePreference === "light" ? "Light" : "Dark";

    return html`
      <div class="layout">
        <!-- ═══ LEFT: Configurator sidebar ═══ -->
        <div class="sidebar">
          <!-- Seed color -->
          <div class="sidebar-section">
            <h3 id="brand-color-heading">Brand Color</h3>
            <div class="seed-input-group">
              <div
                class="seed-swatch"
                aria-hidden="true"
                style="background:${isValidHex(this._hexInput)
                  ? (this._hexInput.startsWith("#")
                      ? this._hexInput
                      : `#${this._hexInput}`)
                  : "#ccc"}"
              ></div>
              <input
                class="seed-input"
                type="text"
                aria-label="Hex color value"
                aria-describedby="seed-error"
                .value=${this._hexInput}
                @input=${this._onHexInput}
                @blur=${this._onHexBlur}
                placeholder="#769CDF"
                spellcheck="false"
                autocomplete="off"
              />
            </div>
            <div class="seed-error" id="seed-error" role="alert">
              ${!isValidHex(this._hexInput) && this._hexInput.length > 1
                ? "Enter a valid hex color"
                : ""}
            </div>

            <!-- Hue slider -->
            <div class="hue-slider-group">
              <div class="hue-slider-header">
                <label class="hue-slider-label" for="hue-range">Hue</label>
                <span class="hue-slider-value">${Math.round(this._hue)}\u00B0</span>
              </div>
              <input
                id="hue-range"
                class="hue-slider"
                type="range"
                min="0"
                max="360"
                step="1"
                aria-valuemin="0"
                aria-valuemax="360"
                aria-valuenow=${Math.round(this._hue)}
                aria-valuetext="${Math.round(this._hue)} degrees"
                .value=${String(Math.round(this._hue))}
                @input=${this._onHueInput}
                style="background:${this._hueGradient}"
              />
            </div>
          </div>

          <!-- Page theme toggle -->
          <div class="sidebar-section">
            <h3 id="appearance-heading">Page Theme</h3>
            <button
              class="theme-toggle"
              @click=${() => this._cycleTheme()}
              aria-label="Page theme: ${themeLabel}. Click to cycle."
              title="Page theme: ${themeLabel}"
            >
              <span class="theme-toggle-icon" aria-hidden="true">${themeIcon}</span>
              <span class="theme-toggle-label">${themeLabel}</span>
            </button>
          </div>

          <!-- Variant selector -->
          <div class="sidebar-section">
            <h3 id="variant-heading">Scheme Variant</h3>
            <div class="variant-grid" role="radiogroup" aria-labelledby="variant-heading">
              ${this._variantPreviews.map(
                (p) => html`
                  <div
                    class="variant-card ${p.variant === this._variant
                      ? "active"
                      : ""}"
                    role="radio"
                    tabindex="0"
                    aria-checked=${p.variant === this._variant}
                    aria-label="${VARIANT_LABELS[p.variant]} scheme variant"
                    @click=${() => this._selectVariant(p.variant)}
                    @keydown=${onActivate(() => this._selectVariant(p.variant))}
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

          <!-- Contrast level -->
          <div class="sidebar-section">
            <h3 id="contrast-heading">Contrast</h3>
            <div class="segmented" role="radiogroup" aria-labelledby="contrast-heading">
              ${([
                { label: "Standard", value: 0.0 },
                { label: "Medium", value: 0.5 },
                { label: "High", value: 1.0 },
              ] as const).map(
                (c) => html`
                  <button
                    class="seg-btn ${this._contrastLevel === c.value ? "active" : ""}"
                    role="radio"
                    aria-checked=${this._contrastLevel === c.value}
                    @click=${() => this._selectContrast(c.value)}
                  >
                    ${c.label}
                  </button>
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
            <h3><label for="output-dir">Output Directory</label></h3>
            <input
              id="output-dir"
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
                aria-label=${this._copiedCommand ? "Command copied" : "Copy CLI command to clipboard"}
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

        <!-- ═══ RIGHT: Dual scheme preview ═══ -->
        <div class="preview">
          <!-- Light scheme -->
          <div
            class="scheme-container scheme-container--light"
            style="background:${this._lightColors.surfaceContainerLow};color:${this._lightColors.onSurface}"
          >
            <div class="scheme-header">
              <span class="scheme-header-icon" aria-hidden="true">${sunIcon}</span>
              <h2>Light</h2>
            </div>
            ${this._renderSchemeGrid(this._lightColors, "light")}
          </div>

          <!-- Dark scheme -->
          <div
            class="scheme-container scheme-container--dark"
            style="background:${this._darkColors.surfaceContainerLow};color:${this._darkColors.onSurface}"
          >
            <div class="scheme-header">
              <span class="scheme-header-icon" aria-hidden="true">${moonIcon}</span>
              <h2>Dark</h2>
            </div>
            ${this._renderSchemeGrid(this._darkColors, "dark")}
          </div>

          <!-- ═══ Tonal Palettes (once, mode-independent) ═══ -->
          ${this._palettes
            ? (() => {
                const palettes = this._palettes;
                return html`
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
                          <div class="palette-strip" role="group" aria-label="${PALETTE_LABELS[key]} tonal palette">
                            ${TONE_STEPS.map((tone) => {
                              const hex =
                                palettes[key as keyof PaletteSet][
                                  String(tone)
                                ];
                              const isLight = tone >= 50;
                              const textColor = isLight
                                ? "rgba(0,0,0,0.6)"
                                : "rgba(255,255,255,0.8)";
                              const copyKey = `${key}-${tone}`;
                              return html`
                                <div
                                  class="tone-swatch"
                                  role="button"
                                  tabindex="0"
                                  aria-label="${PALETTE_LABELS[key]} tone ${tone}: ${hex}. Click to copy."
                                  style="background:${hex};color:${textColor}"
                                  @click=${() =>
                                    this._copySwatchHex(copyKey, hex)}
                                  @keydown=${onActivate(() => this._copySwatchHex(copyKey, hex))}
                                  title="${PALETTE_LABELS[key]} ${tone} — ${hex}"
                                >
                                  ${tone}
                                  ${this._copiedSwatch === copyKey
                                    ? html`<span class="copied-indicator" aria-live="polite"
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
                `;
              })()
            : nothing}
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
      const padding = "\u00A0\u00A0\u00A0\u00A0".repeat(indent - 1);
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
