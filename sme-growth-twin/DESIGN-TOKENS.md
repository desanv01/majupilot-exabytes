# SME Growth Twin Design Tokens

These values are the authoritative starting tokens for the redesign. A phase may add semantic aliases, but it must not introduce an unrelated visual system.

## Color

```css
:root {
  --color-ink-950: #082d3f;
  --color-ink-800: #123f5b;
  --color-paper-50: #fffdf8;
  --color-paper-100: #f7f4ec;
  --color-surface: #ffffff;
  --color-text: #17394b;
  --color-text-muted: #5b7181;
  --color-border: #d8e4e2;
  --color-teal-700: #087c79;
  --color-teal-500: #13a29b;
  --color-teal-200: #bfeae3;
  --color-teal-100: #e4f5f1;
  --color-amber-600: #9a6414;
  --color-amber-100: #fff2d7;
  --color-coral-700: #a63e36;
  --color-coral-100: #fce9e6;
  --color-focus: #f2a43a;
}
```

All color use must map to a semantic purpose. Teal is not decoration; it identifies action, progress, selected evidence, or a positive verified state.

## Type

- Product UI: DM Sans, weights 400, 500, 600, and 700.
- Display accent: Libre Baskerville, weight 700.
- Load fonts through `next/font` or a checked-in local package. Do not add a runtime Google Fonts stylesheet.
- Routine labels and controls are at least 14px. Default body copy is 16px. Do not reproduce the tiny labels from a generated mockup.

## Spacing

Use the scale: 4, 8, 12, 16, 24, 32, 48, 64, and 96px.

## Shape and elevation

- Inputs: 8px radius.
- Buttons: 10px radius.
- Panels: 16px radius.
- Status tags: full radius.
- Resting shadow: subtle and rare.
- Elevated shadow: reserved for overlays, selected comparisons, and sticky action surfaces.

## Focus and interaction

- Use a visible 2px focus ring with an offset against both ink and paper surfaces.
- Minimum target: 44 by 44 CSS pixels.
- Hover never substitutes for a persistent selected or validation state.

## Responsive and print checkpoints

- Required widths: 360, 390, 768, 1024, 1280, and 1440px.
- Navigation and primary actions must remain usable without horizontal scrolling.
- Blueprint print output must remain legible on A4 and retain source and assumption labels.
