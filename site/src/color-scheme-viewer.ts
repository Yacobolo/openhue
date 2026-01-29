import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  generateScheme,
  isValidHex,
  SCHEME_VARIANTS,
  type SchemeColors,
  type SchemeVariant,
} from "./theme-generator.js";

/**
 * <color-scheme-viewer>
 *
 * Interactive Material Design 3 color scheme visualizer.
 * Provides a color picker, scheme variant selector, and light/dark toggle.
 * Generates and displays all scheme colors live.
 */
@customElement("color-scheme-viewer")
export class ColorSchemeViewer extends LitElement {
  @property({ type: String }) seed = "#769CDF";
  @state() private _variant: SchemeVariant = "tonal-spot";
  @state() private _isDark = false;
  @state() private _colors: SchemeColors | null = null;
  @state() private _hexInput = "#769CDF";

  static styles = css`
    :host {
      display: block;
      font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --page-bg: #f5f5f5;
      --page-text: #1d1b20;
    }

    :host([dark]) {
      --page-bg: #1c1b1f;
      --page-text: #e6e1e5;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    /* ─── Controls ─── */
    .controls {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 32px;
      padding: 20px 24px;
      background: var(--page-bg);
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--page-text) 12%, transparent);
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .control-group label {
      font-size: 13px;
      font-weight: 500;
      color: var(--page-text);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .color-picker-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    input[type="color"] {
      -webkit-appearance: none;
      appearance: none;
      width: 48px;
      height: 48px;
      border: 2px solid color-mix(in srgb, var(--page-text) 20%, transparent);
      border-radius: 12px;
      cursor: pointer;
      padding: 2px;
      background: transparent;
    }

    input[type="color"]::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    input[type="color"]::-webkit-color-swatch {
      border: none;
      border-radius: 8px;
    }

    input[type="text"] {
      width: 90px;
      padding: 8px 10px;
      border: 1px solid color-mix(in srgb, var(--page-text) 20%, transparent);
      border-radius: 8px;
      font-family: "SF Mono", "Fira Code", monospace;
      font-size: 14px;
      background: var(--page-bg);
      color: var(--page-text);
    }

    input[type="text"]:focus {
      outline: 2px solid var(--s-primary, #6750a4);
      outline-offset: 1px;
    }

    select {
      padding: 8px 12px;
      border: 1px solid color-mix(in srgb, var(--page-text) 20%, transparent);
      border-radius: 8px;
      font-size: 14px;
      background: var(--page-bg);
      color: var(--page-text);
      cursor: pointer;
      text-transform: capitalize;
    }

    .toggle {
      position: relative;
      width: 52px;
      height: 28px;
      background: color-mix(in srgb, var(--page-text) 20%, transparent);
      border-radius: 14px;
      cursor: pointer;
      border: none;
      padding: 0;
      transition: background 0.2s;
    }

    .toggle[aria-checked="true"] {
      background: var(--s-primary, #6750a4);
    }

    .toggle::after {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 22px;
      height: 22px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle[aria-checked="true"]::after {
      transform: translateX(24px);
    }

    .toggle-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--page-text);
      min-width: 36px;
    }

    .spacer {
      flex: 1;
    }

    /* ─── Heading ─── */
    h1 {
      font-weight: 500;
      font-size: 24px;
      margin: 0 0 24px;
      color: var(--page-text);
    }

    /* ─── Scheme Grid ─── */
    .main-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr) 250px;
      gap: 24px;
      max-width: 1100px;
    }

    .stack {
      display: flex;
      flex-direction: column;
    }

    .swatch {
      padding: 12px 16px;
      min-height: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 14px;
      transition: background-color 0.15s, color 0.15s;
    }

    .swatch .token-name {
      font-weight: 500;
    }

    .swatch .hex-value {
      font-family: "SF Mono", "Fira Code", monospace;
      font-size: 11px;
      opacity: 0.8;
    }

    .swatch.large {
      min-height: 100px;
    }

    /* Left section */
    .left-content {
      grid-column: span 3;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .row {
      display: flex;
      width: 100%;
    }

    .row > div {
      flex: 1;
    }

    /* Surface height */
    .surface-row .swatch {
      min-height: 160px;
    }

    /* Utility row */
    .utility-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 24px;
    }

    .utility-row .swatch {
      min-height: 60px;
      font-weight: bold;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .main-container {
        grid-template-columns: repeat(2, 1fr);
      }
      .left-content {
        grid-column: span 2;
      }
    }

    @media (max-width: 600px) {
      .main-container {
        grid-template-columns: 1fr;
      }
      .left-content {
        grid-column: span 1;
      }
      .controls {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `;

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

  private _regenerate() {
    if (!isValidHex(this._hexInput)) return;
    this._colors = generateScheme(
      this._hexInput,
      this._variant,
      this._isDark
    );
    // Update host attribute for external styling
    if (this._isDark) {
      this.setAttribute("dark", "");
    } else {
      this.removeAttribute("dark");
    }
  }

  private _onColorPick(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this._hexInput = val.toUpperCase();
    this.seed = this._hexInput;
    this._regenerate();
  }

  private _onHexInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this._hexInput = val;
    if (isValidHex(val)) {
      this.seed = val.startsWith("#") ? val.toUpperCase() : `#${val.toUpperCase()}`;
      this._regenerate();
    }
  }

  private _onVariantChange(e: Event) {
    this._variant = (e.target as HTMLSelectElement).value as SchemeVariant;
    this._regenerate();
  }

  private _onToggleDark() {
    this._isDark = !this._isDark;
    this._regenerate();
  }

  /** Render a single swatch cell */
  private _swatch(
    name: string,
    bgKey: keyof SchemeColors,
    fgKey: keyof SchemeColors,
    large = false
  ) {
    if (!this._colors) return html``;
    const bg = this._colors[bgKey];
    const fg = this._colors[fgKey];
    return html`
      <div
        class="swatch ${large ? "large" : ""}"
        style="background:${bg};color:${fg}"
      >
        <span class="token-name">${name}</span>
        <span class="hex-value">${bg}</span>
      </div>
    `;
  }

  /** Render a surface swatch (uses onSurface for text) */
  private _surfaceSwatch(name: string, bgKey: keyof SchemeColors) {
    if (!this._colors) return html``;
    const bg = this._colors[bgKey];
    const fg = this._colors.onSurface;
    return html`
      <div class="swatch" style="background:${bg};color:${fg}">
        <span class="token-name">${name}</span>
        <span class="hex-value">${bg}</span>
      </div>
    `;
  }

  render() {
    if (!this._colors) return html`<p>Loading...</p>`;
    const c = this._colors;

    return html`
      <div class="controls" style="--s-primary:${c.primary}">
        <div class="control-group">
          <label>Seed</label>
          <div class="color-picker-wrapper">
            <input
              type="color"
              .value=${this.seed.toLowerCase()}
              @input=${this._onColorPick}
            />
            <input
              type="text"
              .value=${this._hexInput}
              @input=${this._onHexInput}
              placeholder="#769CDF"
              spellcheck="false"
            />
          </div>
        </div>

        <div class="control-group">
          <label>Variant</label>
          <select @change=${this._onVariantChange}>
            ${SCHEME_VARIANTS.map(
              (v) =>
                html`<option value=${v} ?selected=${v === this._variant}>
                  ${v}
                </option>`
            )}
          </select>
        </div>

        <div class="spacer"></div>

        <div class="control-group">
          <span class="toggle-label">${this._isDark ? "Dark" : "Light"}</span>
          <button
            class="toggle"
            role="switch"
            aria-checked=${this._isDark ? "true" : "false"}
            @click=${this._onToggleDark}
          ></button>
        </div>
      </div>

      <h1>${this._isDark ? "Dark" : "Light"} Scheme</h1>

      <div class="main-container">
        <!-- Primary -->
        <div class="stack">
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
        </div>

        <!-- Secondary -->
        <div class="stack">
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
        </div>

        <!-- Tertiary -->
        <div class="stack">
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
        </div>

        <!-- Error -->
        <div class="stack">
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
        </div>

        <!-- Surface section -->
        <div class="left-content">
          <!-- Surface Dim / Surface / Surface Bright -->
          <div class="row surface-row">
            ${this._surfaceSwatch("Surface Dim", "surfaceDim")}
            ${this._surfaceSwatch("Surface", "surface")}
            ${this._surfaceSwatch("Surface Bright", "surfaceBright")}
          </div>

          <!-- Surface Container hierarchy -->
          <div class="row surface-row">
            ${this._surfaceSwatch(
              "Surf. Container Lowest",
              "surfaceContainerLowest"
            )}
            ${this._surfaceSwatch(
              "Surf. Container Low",
              "surfaceContainerLow"
            )}
            ${this._surfaceSwatch("Surf. Container", "surfaceContainer")}
            ${this._surfaceSwatch(
              "Surf. Container High",
              "surfaceContainerHigh"
            )}
            ${this._surfaceSwatch(
              "Surf. Container Highest",
              "surfaceContainerHighest"
            )}
          </div>

          <!-- On Surface / Outline row -->
          <div class="row">
            <div
              class="swatch"
              style="background:${c.onSurface};color:${c.surface}"
            >
              <span class="token-name">On Surface</span>
              <span class="hex-value">${c.onSurface}</span>
            </div>
            <div
              class="swatch"
              style="background:${c.onSurfaceVariant};color:${c.surface}"
            >
              <span class="token-name">On Surface Var.</span>
              <span class="hex-value">${c.onSurfaceVariant}</span>
            </div>
            <div
              class="swatch"
              style="background:${c.outline};color:${c.surface}"
            >
              <span class="token-name">Outline</span>
              <span class="hex-value">${c.outline}</span>
            </div>
            <div
              class="swatch"
              style="background:${c.outlineVariant};color:${c.onSurfaceVariant}"
            >
              <span class="token-name">Outline Variant</span>
              <span class="hex-value">${c.outlineVariant}</span>
            </div>
          </div>
        </div>

        <!-- Right: Inverse + Utility -->
        <div class="right-bottom">
          <div class="stack">
            <div
              class="swatch"
              style="background:${c.inverseSurface};color:${c.inverseOnSurface};min-height:180px"
            >
              <span class="token-name">Inverse Surface</span>
              <span class="hex-value">${c.inverseSurface}</span>
            </div>
            <div
              class="swatch"
              style="background:${c.inverseOnSurface};color:${c.inverseSurface}"
            >
              <span class="token-name">Inverse On Surface</span>
              <span class="hex-value">${c.inverseOnSurface}</span>
            </div>
            <div
              class="swatch"
              style="background:${c.inversePrimary};color:${c.primary}"
            >
              <span class="token-name">Inverse Primary</span>
              <span class="hex-value">${c.inversePrimary}</span>
            </div>
          </div>
          <div class="utility-row">
            <div
              class="swatch"
              style="background:${c.scrim};color:white"
            >
              <span class="token-name">Scrim</span>
              <span class="hex-value">${c.scrim}</span>
            </div>
            <div
              class="swatch"
              style="background:${c.shadow};color:white"
            >
              <span class="token-name">Shadow</span>
              <span class="hex-value">${c.shadow}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "color-scheme-viewer": ColorSchemeViewer;
  }
}
