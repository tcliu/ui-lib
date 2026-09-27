# Design — UI Library

This document describes what the user sees and does. For how the code is
organized, see `ARCHITECTURE.md`; for behavioral contracts and API specs, see
`docs/spec.md`; for how to write code in this project, see `AGENTS.md`.

## Overview

UI Library is a responsive web app built with Svelte 5, SvelteKit, and
Tailwind CSS v4. It supports multiple themes.

## Layout

### Top bar

The app shell's top bar has:
- **Title** on the left (project name, semibold, tracking-tight)
- **Theme** and **language** icon-button menus on the right
- Responsive layout (`flex`, `justify-between`, `gap-4`)
- Border bottom separator

### Main content

The top bar is non-shrinking chrome; the content area fills the remaining
viewport height (`flex-1`, `min-h-0`). The showcase is a two-pane splitter
view:

- **Left pane**: a search box (case-insensitive name filter) above the list of
  components; selecting one routes to its page and marks it active.
- **Right pane**: the selected component's showcase page, which scrolls.

On narrow viewports the list becomes an overlay drawer above the dimmed
content (below the 768px shell-container breakpoint in `auto` mode) instead
of stacking; a pinned `docked` pane stays an in-flow row at every width and
the content scrolls beside it.

## Theming

The app supports multiple themes:
- **Dark** (default): `dark`, `ember`, `nebula`, `forest`, `midnight`
- **Light**: `light`, `sepia`, `sky`, `mint`, `lavender`

Theme selection is persisted in localStorage under `ui-lib:web-settings`.

## Accessibility

- All focusable controls are keyboard reachable
- Explicit focus styles
- Accessible names for icon-only buttons
- Non-interactive scroll wrappers are out of the tab order (`tabindex="-1"`)
- Reduced motion support

## Responsive design

- Mobile-first approach
- Container-query-based breakpoints for components
- Viewport-aware overlays and drawers
- Touch-friendly target sizes
