# Parlez Design System

This document describes the design language currently implemented in `app/globals.css` and route components. It is the baseline for future work: reuse these tokens and patterns before adding a new one-off value.

## Direction

Parlez should feel friendly, calm, optimistic, and lightly playful. The current interface combines a cool blue-gray canvas, white elevated cards, indigo actions, warm coral/yellow accents, rounded geometry, and restrained illustrations. Learning content remains the visual focus.

## Color tokens

The canonical global tokens are:

| Role | Value | Usage |
|---|---:|---|
| Background | `#f4f7fb` | Page canvas |
| Foreground | `#19263c` | Primary text |
| Card | `#ffffff` | Raised surfaces |
| Primary | `#5267da` | Primary actions, active navigation, progress |
| Primary foreground | `#ffffff` | Text on primary |
| Muted | `#eef2f7` | Quiet controls and fills |
| Muted foreground | `#718096` | Secondary text |
| Border | `#e5eaf2` | Default separators |
| Focus ring | `#5267da` | General focus token |
| Keyboard focus accent | `#f3bf52` | Visible button focus outline |

Existing supporting accents include coral (`#ef736a`), yellow (`#f3bf52`/`#f4c75a`), pale indigo (`#eef0ff`), pale yellow (`#fff5df`), and emerald Tailwind utilities for success states. New components should use the CSS variables or these existing accent families. Consolidating remaining literal colors into semantic tokens is a tracked task.

## Typography

- UI sans: `Nunito Sans`, falling back to `Segoe UI`, then `sans-serif`.
- Display serif: `Fraunces`, falling back to Georgia, then `serif`.
- The serif face is reserved for brand/display moments; functional controls and body copy use the sans face.
- Eyebrows are small, uppercase, muted, and bold.
- French prompts and reader content should be larger and more prominent than translations.

The app does not currently load Nunito Sans or Fraunces as web fonts, so fallbacks are what most users see. Font loading and typographic consistency remain quality work.

## Shape and elevation

- Base radius token: `1.25rem`.
- Cards generally use rounded 20–24px geometry with soft borders/shadows.
- Navigation and compact controls use approximately 10–14px radii.
- Pills and badges use fully rounded geometry.
- Shadows are low-contrast and should support hierarchy without making the UI feel heavy.

## Layout

- Desktop uses a fixed 230px left sidebar and a centered page area capped around 1180px.
- Content-heavy screens use a main column plus a narrower right column.
- Smaller screens replace the sidebar with a top bar, optional menu, and fixed bottom navigation.
- Pages use generous spacing and vertically stacked `ScreenCard` sections.
- Every route should retain a single obvious primary action.

## Shared patterns

The shared layout contract lives in `components/layout/app-shell.tsx`:

- `AppShell` supplies desktop/mobile navigation and the page header.
- `ScreenCard` supplies the standard raised surface.
- `ScreenHeading` supplies an optional eyebrow, title, and action slot.

Reusable global classes in `app/globals.css` cover buttons, cards, progress tracks, learning activities, flashcards, reader/speaking surfaces, and responsive navigation. Prefer extracting a React component when a pattern gains behavior or appears with divergent markup; retain a global class for purely visual reuse.

## Interaction and accessibility

- Interactive elements need a visible keyboard focus state.
- Icon-only buttons need an accessible label.
- Motion should be brief (roughly 150–250ms) and must respect reduced-motion preferences when animation is added.
- Text and essential controls must meet WCAG AA contrast.
- Touch targets should be at least 44×44px on mobile.
- Do not communicate review state or correctness through color alone.
- Microphone, clipboard, speech-synthesis, and IndexedDB failures need inline, recoverable feedback; browser alerts are not a finished interaction.

## Known design debt

- Many route components contain literal Tailwind colors instead of semantic tokens.
- Fonts named in the theme are not loaded.
- The header eyebrow defaults to a hard-coded 2025 date, and identity/level/streak values are hard-coded.
- Several controls are visual placeholders (settings, add phrase) or lead to static screens.
- The navigation omits the Phrase Bank route and makes the core Reader route indirect.
- Responsive behavior exists, but no documented device/browser accessibility pass has been completed.
- Loading, empty, error, permission-denied, and offline states are inconsistent.
- `globals.css` is a large monolithic style layer without component ownership boundaries.

These are delivery gaps, not invitations to invent a second visual language. Fix them within the palette, typography, spacing, and component patterns above.
