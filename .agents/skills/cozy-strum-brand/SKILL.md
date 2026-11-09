---
name: cozy-strum-brand
description: Design tokens, color palettes, typography, and aesthetic guidelines for The Cozy Strum, aligning with The Cozy Skillet and The Cozy Cart.
---

# The Cozy Strum Brand & Design System

The Cozy Strum continues the warm, tactile, distraction-free aesthetic pioneered in **The Cozy Skillet** and **The Cozy Cart**. It is designed for acoustic musicians practicing late at night in a soft-lit room or sitting on a porch with an instrument.

## 1. Color Palette & Thematic Atmosphere

### 1.1 Warm Latte / Parchment (Light Mode)
Reflects aged paper sheet music, natural maple wood, and warm sunlight.
- **Canvas / Background**: `#FAF6F0` (Warm milk & parchment)
- **Card Surface**: `#F3ECE1` (Tuscan cream cardstock)
- **Elevated Border**: `#E4D7C5` (Subtle kraft paper outline)
- **Primary Text**: `#2A211B` (Deep espresso roast)
- **Secondary / Muted Text**: `#6E5A4F` (Toasted walnut)
- **Terracotta Primary Accent**: `#C85A32` (Clay / warm saddle leather)
- **Amber Chord Highlight**: `#D97706` (Golden amber badge background with warm tint `#FEF3C7`)

### 1.2 Campfire / Dark Roast (Dark Mode)
Designed specifically for dim practice rooms without glare or eye fatigue.
- **Canvas / Background**: `#14110F` (Deep dark espresso)
- **Card Surface**: `#1E1916` (Smoked chestnut surface)
- **Elevated Border**: `#2E2620` (Subtle hearth border)
- **Primary Text**: `#EDE4D7` (Warm oat cream)
- **Secondary / Muted Text**: `#A8988B` (Aged parchment gray)
- **Amber Glowing Chord**: `#F59E0B` (Campfire ember gold with subtle glow)
- **Terracotta Accent**: `#E07A5F` (Muted coral clay)

---

## 2. Typography Hierarchy

```css
/* Editorial Headings: Nostalgic, literary, warm */
--font-serif: 'Fraunces', 'Playfair Display', Georgia, serif;

/* Interface Controls: Clear, humanist, modern */
--font-sans: 'Plus Jakarta Sans', Inter, -apple-system, sans-serif;

/* Music Tabs & ASCII Notation: Strict column grid, no ligatures */
--font-mono: 'JetBrains Mono', 'Fira Code', Menlo, monospace;
```

### Tab Font Strictness
To avoid pitch misalignments in tabs:
```css
.tab-monospace {
  font-family: var(--font-mono);
  font-variant-ligatures: none;
  font-feature-settings: 'liga' 0, 'calt' 0;
  white-space: pre;
}
```

---

## 3. UI Component Patterns

### 3.1 Chord Badge
- Chords above lyrics are wrapped in interactive pills:
  - Font: Bold monospace.
  - Hover: Subtle scale `transform: scale(1.05)`, reveals popover SVG chord diagram.
  - Color: Terracotta text on warm cream background with gentle border.

### 3.2 Sticky Practice Dock
- Floats at the viewport edge (bottom or top dock toggle).
- Translucent frosted glass effect:
  ```css
  background: rgba(243, 236, 225, 0.85); /* Light */
  /* Dark */
  background: rgba(30, 25, 22, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  ```
- Ergonomic button hit-targets (min `44px`) so fingers holding a pick or capo can easily tap controls.

### 3.3 Tactile Shadows & Micro-interactions
- Soft multi-layered shadows mimicking natural room lighting (`box-shadow: 0 4px 20px -2px rgba(42, 33, 27, 0.08)`).
- Quick transition curves: `transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1)`.
