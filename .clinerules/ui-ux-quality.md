# HANSAN V3 — UI/UX Quality Contract

Source of truth for visual decisions. Preserve HANSAN visual direction: minimalist neumorphism, carefully controlled neobrutalist details, warm ivory, orange #FF7A00, blue #0029FF, existing typography and tokens.

## Brand tokens (from src/styles/tokens.css and tailwind.config.ts)

- Colors: `--hansan-orange` #FF7A00, `--hansan-blue` #0029FF, `--hansan-ivory` #FFF5D5.
- Surfaces: `--hansan-surface` #F4ECDA, `--hansan-surface-soft` #FBF4E2, `--hansan-surface-raised` #FFFFFF, `--hansan-surface-sunken` #EFE4C9.
- Ink: `--hansan-ink` #1C1A15, `--hansan-ink-muted` #6B6455. Lines: `--hansan-line` #DDD0B4, `--hansan-line-strong` #C9B98F.
- Status: success #1C6B3F, warning #9A5B00, danger #B3271E, info #0029FF.
- Shadows: `--orbit-shadow` 5px 5px 0 ink, `--orbit-shadow-sm` 3px 3px 0 ink, `--sleepwise-shadow` 6px 6px 0 ink, `--neu-raised`, `--neu-raised-sm`, `--neu-inset`, `--neu-flat`.
- Radii: `--radius-neu` 0.75rem, `--radius-sm` 0.375rem, `--radius-xs` 0.25rem, `--radius-orbit` 14px, `--radius-full` 9999px.
- Spacing: `--space-section` 2.5rem, `--space-block` 1.5rem. Shell: header 4rem, sidebar 16.5rem / 4.5rem collapsed, content max 88rem.
- Typography: `--font-brand` "Glacial Indifference", "Segoe UI", system-ui, sans-serif. `--font-mono` ui-monospace, Cascadia Mono, Menlo, Consolas.
- Motion: `--transition-fast` 150ms ease, `--transition-base` 220ms ease. Focus ring `--focus-ring` 0 0 0 3px rgba(0,41,255,0.25).
- Z-index scale: header 40, sidebar 30, drawer 50, dialog 60, toast 70, tooltip 80.

## Typography hierarchy

- Use Tailwind `font-sans` (maps to brand font). Headings: semibold/bold, ink color. Body: regular, ink. Muted text: `hansan-ink-muted`.
- Monospace for code/ids via `font-mono`.

## Layout and responsive breakpoints

- Mobile-first. Support desktop, tablet, mobile.
- Use Tailwind responsive prefixes (`sm`, `md`, `lg`, `xl`). Avoid fixed widths that break reflow.
- Container max width `max-w-shell` (88rem) where appropriate.
- Respect `--space-section` / `--space-block` for vertical rhythm.

## Component reuse

- Reuse `src/components/ui` exports: Button, Input, Alert, Card (+Header/Title/Description), Section, PageHeader, EmptyState, Badge.
- Use `cn()` from `src/lib/cn` for class merging.
- Do not duplicate a component that already exists. Extend via props/variants instead.
- Tailwind classes must come from the configured theme tokens; avoid arbitrary hex colors when a token exists.

## Interaction states

- Hover, focus-visible, active, disabled, loading, error, empty, success.
- Focus: visible ring (`focus-visible:ring-2 focus-visible:ring-hansan-blue`) or `--focus-ring`.
- Disabled: cursor not-allowed + opacity 0.5 (`--disabled-opacity`).
- Buttons: primary (orange, ink border, neu shadow), secondary (raised surface), ghost.
- Loading: spinner with `aria-hidden`, disable button.
- Forms: label, helper text, error message, empty state.

## Accessibility

- Semantic HTML (button, nav, main, section, header, footer, form, label).
- Keyboard operable: tab order, Enter/Space activation, Escape to close.
- Visible focus states; never remove outline without replacement.
- Accessible names for icon-only controls; `aria-label`/`aria-labelledby`.
- Color contrast: text on surfaces must be readable; avoid low-contrast muted text on light surfaces.
- Respect `prefers-reduced-motion`.
- Landmarks, `lang`, and `<title>` for full pages.

## Visual QA criteria

- No generic AI patterns: no gratuitous gradients, excessive cards, arbitrary spacing, inconsistent radii, decorative noise.
- Hierarchy clear in every section.
- Consistent spacing and radii across the page.
- Responsive at mobile/tablet/desktop without horizontal scroll.
- All states implemented (loading/error/empty) where data is involved.
- Focus visible; keyboard usable.
- Contrast acceptable.

## UI/UX Pro Max

- Optional design-intelligence reference (MIT). Official Cline support is NOT verified; do not assume native compatibility.
- If adopted manually, keep it under `.cline/skills/ui-ux-pro-max` or `.clinerules/skills/ui-ux-pro-max`, and read only the relevant subset.
- HANSAN tokens, components, and patterns remain the source of truth. UI/UX Pro Max may improve decision quality but must not override HANSAN's design system.
- Do not implement the HQ login page as part of toolkit setup.
