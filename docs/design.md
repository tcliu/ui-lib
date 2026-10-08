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
- **Component page**: the page title is followed by a **Related** row of tag
  chips linking to components that share a browsing group (for example, the
  dropdown selectors link to one another).
- **SelectDropdown page**: unlike the standard demo-plus-settings page, its demo
  renders inside a resizable frame, the Show-code toggle sits beside the page
  title, and its props table adds an editable **Value** column that shows and
  sets each prop's current value (`options` edits as JSON through an edit
  dialog). Single-prop editing lives in that column, so its config panel keeps
  only Reset.

On narrow viewports the list becomes an overlay drawer above the dimmed
content (below the 768px shell-container breakpoint in `auto` mode) instead
of stacking; a pinned `docked` pane stays an in-flow row at every width and
the content scrolls beside it.

## Component interaction

Shared dropdown-style listboxes follow the native control's type-ahead: typing
a printable key jumps to the next option whose label starts with it, wrapping
around, and repeating the key cycles the same-letter options; holding Shift
jumps to the previous match instead. Type-ahead only moves the highlight and
opens the panel — it never commits a value.

A filterable dropdown narrows its list as you type. While a query matches more
than one option the matched part of each label is emphasized, while a lone match
is left plain. Confirming an option writes the confirmed label back into the
input, and reopening the panel filters by that label, so the typed query does not
reappear after a selection.

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
