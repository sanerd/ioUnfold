export const adminCss = `
/* --- 1. SELF-HOSTED / GOOGLE FONT-FACE DEFINITIONS --- */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/inter/v20/UcCm3FwrK3iLTcvnUwkT9mI1F55MKw.woff2') format('woff2');
}

@font-face {
  font-family: 'Newsreader';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/newsreader/v26/cY9CfjOCX1hbuyalUrK439vCgYhCBJWxZCPp.woff2') format('woff2');
}

@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400 500;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbX2o-flEEny0FZhsfKu5WU4xD-Cw6nSGjW7BDEAQ.woff2') format('woff2');
}

/* --- 2. GLOBALE SCHRIFTARTEN & TYPOGRAFIE (ioUnfold Hybrid-System) --- */
*, *::before, *::after, html, body, input, select, textarea, button, table, th, td, p, span, a, label, small, strong {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Newsreader', Georgia, serif;
  font-weight: 400;
  letter-spacing: -0.02em;
}

.badge, .log-terminal, code, pre, kbd, samp {
  font-family: 'JetBrains Mono', monospace;
}

/* --- 3. PICO CSS V2 COMPLETE CUSTOM PROPERTIES OVERRIDES --- */
:root {
  /* Font Families */
  --pico-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --pico-font-family-serif: 'Newsreader', Georgia, serif;
  --pico-font-family-monospace: 'JetBrains Mono', monospace;
  --pico-font-family-h1: var(--pico-font-family-serif);
  --pico-font-family-h2: var(--pico-font-family-serif);
  --pico-font-family-h3: var(--pico-font-family-serif);
  --pico-font-family-h4: var(--pico-font-family-serif);
  --pico-font-family-h5: var(--pico-font-family-serif);
  --pico-font-family-h6: var(--pico-font-family-serif);

  /* Typography Scales */
  --pico-font-size: 100%;
  --pico-line-height: 1.5;
  --pico-font-weight: 400;
  --pico-bold-weight: 700;

  /* Form Factor: ioUnfold Hard-Edge Mandate (Strictly 2px Radius) */
  --pico-border-radius: 2px;
  --pico-border-width: 1px;
  --pico-outline-width: 2px;

  /* Spacing System */
  --pico-spacing: 1rem;
  --pico-typography-spacing-vertical: 1rem;
  --pico-block-spacing-vertical: 2rem;
  --pico-block-spacing-horizontal: 1.5rem;
  --pico-grid-column-gap: 1rem;
  --pico-grid-row-gap: 1rem;
  --pico-nav-element-spacing-vertical: 0.75rem;
  --pico-nav-element-spacing-horizontal: 0.75rem;
  --pico-nav-link-spacing-vertical: 0.5rem;
  --pico-nav-link-spacing-horizontal: 0.5rem;

  /* Form Elements Base Spacing */
  --pico-form-element-spacing-vertical: 0.5rem;
  --pico-form-element-spacing-horizontal: 0.75rem;

  /* Transitions & FX */
  --pico-transition: 0.15s ease-in-out;
  --pico-modal-overlay-backdrop-filter: blur(4px);

  /* Color Palette Tokens (Vivid Mint Accent & Slate System) */
  --io-mint-primary: #2dd4bf;
  --io-mint-hover: #2de4d0;
  --io-mint-active: #14b8a6;
  --io-slate-950: #020617;
  --io-slate-900: #0f172a;
  --io-slate-850: #090d16;
  --io-slate-800: rgba(30, 41, 59, 0.6);
  --io-slate-500: #64748b;
  --io-slate-50: #f8fafc;

  /* Default Theme Mapping -> Dark Mode (Deep Midnight) */
  --pico-primary: var(--io-mint-primary);
  --pico-primary-background: var(--io-mint-primary);
  --pico-primary-border: var(--io-mint-primary);
  --pico-primary-underline: var(--io-mint-primary);
  --pico-primary-hover: var(--io-mint-hover);
  --pico-primary-hover-background: var(--io-mint-hover);
  --pico-primary-hover-border: var(--io-mint-hover);
  --pico-primary-active: var(--io-mint-active);
  --pico-primary-active-background: var(--io-mint-active);
  --pico-primary-active-border: var(--io-mint-active);
  --pico-primary-focus: rgba(45, 212, 191, 0.25);
  --pico-primary-inverse: var(--io-slate-950);

  --pico-background-color: var(--io-slate-950);
  --pico-color: var(--io-slate-50);
  --pico-text-selection-color: var(--io-slate-950);
  --pico-text-selection-background-color: var(--io-mint-primary);
  --pico-muted-color: var(--io-slate-500);
  --pico-muted-border: var(--io-slate-800);
  --pico-border-color: var(--io-slate-800);

  /* Structural Surfaces */
  --pico-card-background-color: var(--io-slate-900);
  --pico-card-border-color: var(--io-slate-800);
  --pico-card-box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  --pico-card-sectioning-background-color: var(--io-slate-850);

  /* Forms & Controls */
  --pico-form-element-background-color: var(--io-slate-900);
  --pico-form-element-border-color: var(--io-slate-800);
  --pico-form-element-color: var(--io-slate-50);
  --pico-form-element-placeholder-color: var(--io-slate-500);
  --pico-form-element-active-background-color: var(--io-slate-900);
  --pico-form-element-active-border-color: var(--io-mint-primary);
  --pico-form-element-focus-color: var(--io-mint-primary);
  --pico-form-element-disabled-opacity: 0.5;

  /* Switches, Checkboxes, Radios */
  --pico-switch-background-color: var(--io-slate-800);
  --pico-switch-color: var(--io-slate-50);
  --pico-switch-checked-background-color: var(--io-mint-primary);

  /* Tables */
  --pico-table-border-color: var(--io-slate-800);
  --pico-table-row-stripped-background-color: rgba(15, 23, 42, 0.5);

  /* Accordion / Details */
  --pico-accordion-border-color: var(--io-slate-800);
  --pico-accordion-active-summary-color: var(--io-mint-primary);
  --pico-accordion-close-summary-color: var(--io-slate-50);

  /* Modals & Overlays */
  --pico-modal-overlay-background-color: rgba(2, 6, 23, 0.85);

  /* Tooltips & Badges */
  --pico-tooltip-background-color: var(--io-slate-900);
  --pico-tooltip-color: var(--io-slate-50);

  /* Code Blocks */
  --pico-code-background-color: var(--io-slate-900);
  --pico-code-color: var(--io-mint-primary);
}

/* --- 4. LIGHT MODE THEME OVERRIDES --- */
[data-theme="light"], :root:not([data-theme="dark"]) {
  @media (prefers-color-scheme: light) {
    --pico-primary: #0d9488;
    --pico-primary-background: #0d9488;
    --pico-primary-border: #0d9488;
    --pico-primary-underline: #0d9488;
    --pico-primary-hover: #0f766e;
    --pico-primary-hover-background: #0f766e;
    --pico-primary-hover-border: #0f766e;
    --pico-primary-active: #115e59;
    --pico-primary-active-background: #115e59;
    --pico-primary-active-border: #115e59;
    --pico-primary-focus: rgba(13, 148, 136, 0.25);
    --pico-primary-inverse: #ffffff;

    --pico-background-color: #f8fafc;
    --pico-color: #020617;
    --pico-muted-color: #64748b;
    --pico-muted-border: #e2e8f0;
    --pico-border-color: #e2e8f0;

    --pico-card-background-color: #ffffff;
    --pico-card-border-color: #e2e8f0;
    --pico-card-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    --pico-card-sectioning-background-color: #f1f5f9;

    --pico-form-element-background-color: #ffffff;
    --pico-form-element-border-color: #cbd5e1;
    --pico-form-element-color: #020617;
    --pico-form-element-placeholder-color: #94a3b8;
    --pico-form-element-active-background-color: #ffffff;
    --pico-form-element-active-border-color: #0d9488;

    --pico-table-border-color: #e2e8f0;
    --pico-table-row-stripped-background-color: rgba(241, 245, 249, 0.6);

    --pico-accordion-border-color: #e2e8f0;
    --pico-accordion-active-summary-color: #0d9488;
    --pico-accordion-close-summary-color: #020617;

    --pico-modal-overlay-background-color: rgba(248, 250, 252, 0.85);
    --pico-tooltip-background-color: #020617;
    --pico-tooltip-color: #f8fafc;

    --pico-code-background-color: #f1f5f9;
    --pico-code-color: #0d9488;
  }
}

/* --- 5. HARD-EDGE OVERRIDES (ioUnfold Component Enforcement) --- */
article, button, input, select, textarea, dialog, pre, code, .badge, .log-terminal, [role="button"] {
  border-radius: var(--pico-border-radius) !important;
}

/* --- 6. BRANDING, UI COMPONENTS & LOG TERMINAL --- */
.brand-title {
  font-family: 'Inter', sans-serif !important;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: var(--pico-primary);
  text-transform: uppercase;
}

.label-uppercase {
  font-family: 'Inter', sans-serif !important;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4em;
  color: var(--pico-primary);
}

/* Badges & Status Controls */
.badge {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: var(--pico-border-radius);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}

.badge-RUNNING   { background: var(--pico-primary); color: #020617; }
.badge-COMPLETED { background: #38bdf8; color: #020617; }
.badge-FAILED    { background: #ef4444; color: #ffffff; }
.badge-PAUSED { background: #fbbf24; color: #020617; }

/* Log Terminal Output */
.log-terminal {
  background-color: var(--pico-background-color);
  border: 1px solid var(--pico-border-color);
  border-radius: var(--pico-border-radius);
  padding: 0.85rem;
  font-size: 0.75rem;
  max-height: 220px;
  overflow-y: auto;
}

.log-line { margin-bottom: 0.25rem; }
.log-time { color: var(--pico-muted-color); margin-right: 0.5rem; }
.log-info { color: var(--pico-primary); }
.log-warn { color: #fbbf24; }
.log-error { color: #f87171; }

/* HTMX Swapping Transitions */
.htmx-swapping {
  opacity: 0;
  transition: opacity 150ms ease-out;
}
`;
