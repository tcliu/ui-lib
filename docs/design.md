# Design — UI Library

This document describes what the user sees and does. For how the code is
organized, see `ARCHITECTURE.md`; for behavioral contracts and API specs, see
`docs/spec.md`; for how to write code in this project, see `AGENTS.md`.

## Overview

UI Library is a component showcase: a responsive Svelte 5 / SvelteKit /
Tailwind CSS v4 app cataloguing the shared primitives in
`src/lib/components/` — one route per component
(`src/routes/components/<slug>/+page.svelte`, indexed by
`SHOWCASE_COMPONENTS` in `src/app/showcase/index/showcase-components.ts`) with a live
Show-code playground on every page. It supports multiple themes.

## Layout

### Top bar

The app shell's top bar has:
- **Component-picker toggle** (menu icon button) plus the localized
  showcase **title** on the left
- **Theme** and **language** icon-button menus on the right
- Wrapping header row (`flex-wrap`); the shell itself is a non-shrinking
  `h-full flex-col overflow-hidden` column inside an app-supplied `h-dvh` box

### Main content

The content area fills the remaining viewport height (`flex-1`, `min-h-0`).
The showcase is an `AppShell` two-pane view:

- **Left pane**: a search box (case-insensitive name filter) above the list of
  components; selecting one routes to its page and marks it active
  (`aria-current="page"`).
- **Right pane**: the selected component's showcase page, which scrolls.
- **Component page**: the page title is followed by a **Related** row of tag
  chips linking to components that share a browsing group (declared once in
  `SHOWCASE_COMPONENT_GROUPS`; relatedness is symmetric by construction).
- **Every page is converted**: the shell hosts the Show-code toggle and Reset
  beside the page title, and the props table appends an editable
  **Value** column that shows and sets each prop's current value (`options`
  edits as JSON through an edit dialog; a snippet edits as text or, when its
  own markup is the demo content, through a markup dialog, and a snippet row
  also carries an eye toggle that applies or unapplies it). Single-prop
  editing lives in that column, so the config panel keeps only Reset plus
  editors for demo data no single prop covers. An overlay or placement demo
  renders inside a resizable stage so its placement can be inspected as the
  container narrows; the frame clips with a margin so a control flush at its edge
  keeps its focus ring, and the frame's invisible resize handles stay out of the
  tab order (keyboard resizing belongs to the Resizable demo).

In `auto` mode the picker floats as an overlay above the dimmed content when
the shell container narrows below the 768px container breakpoint, and docks
beside the content at/above it; `docked`/`floating` pin one behavior at every
width.

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
reappear after a selection. Double-clicking the input selects the whole value,
so typing replaces it instead of editing one word inside it.

An autocomplete field narrows its suggestion list the same way but keeps the
typed text as its value: free text is accepted, picking a suggestion writes that
suggestion's label into the field, and a query that matches nothing hides the
panel instead of falling back to the full list. `Escape` dismisses the
suggestions while keeping focus and the typed text.

A password field's eye toggle switches between masked and plain text without
moving the caret or changing the selection; when the field had focus before the
click, focus returns to it, so the user keeps their place.

A date field edits its value as text: typing keeps only the characters the
display format can hold, and a commit that is not a valid date for that format
(a rollover such as Feb 31) is rejected, so the field returns to its last good
value with no error state. A field whose pattern carries a clock also accepts
the pattern in part: the entry may carry the clock in part and the rest
defaults, so "2026-01-12 03" commits "2026-01-12T03:00:00" and the date alone
commits at midnight. A 12-hour clock, or one carrying a meridiem, stays whole —
a clock without its meridiem would be ambiguous. The
calendar affordance beside the field opens the calendar, and picking a day
writes it back while keeping any time the value already carried; with a time
format the calendar carries an hour/minute/second row whose segments carry into
the next unit instead of clamping.

A range is two such fields around a separator, each behaving as the single
field. Committing one end while the other is still empty moves the focus — and
the open calendar — to the empty end. The two ends stay in order: a commit that
lands on the wrong side of the other end exchanges the two values, so the range
never inverts. With `highlightRange`, the days between the two ends are tinted
and dotted in each end's calendar.

A bar chart renders one bar per column, stacking a column's segments; each bar's
height is its total against the tallest column (with a small floor so a zero
column stays visible), and a wide series thins the axis labels so they still
fit. Segments take a colour from the shared tone palette, cycling when a segment
names none, and the legend lists one row per labelled segment with its value
summed across columns; a column with a tip shows it on hover. The whole plot
scales with its `size`, and `height` overrides only the plot box when a fixed
footprint is needed.

## Theming

The app supports ten themes; `dark` is the default palette (no `data-theme`
attribute, applied pre-paint by the inline script in `src/app.html`), and the
other nine opt in through `data-theme`:
- **Dark**: `dark` (default), `ember`, `nebula`, `forest`, `midnight`
- **Light**: `light`, `sepia`, `sky`, `mint`, `lavender`

Theme selection (plus picker visibility) is persisted as fields of one JSON
object in localStorage under `ui-lib:web-settings`.

## Accessibility

- All focusable controls are keyboard reachable, with visible focus rings
- Accessible names for icon-only buttons
- Non-interactive scroll wrappers are out of the tab order (`tabindex="-1"`)
- Plain-text hints ride the shared `Tooltip` component (`tooltip` prop);
  overlay dialogs portal to `document.body`
- Reduced motion support (`motion-reduce:transition-none`)

## Responsive design

- The shell fills its container (`h-full`) inside an app-supplied `h-dvh` box,
  with one flexible content region; layout decisions stay in CSS so the first
  paint is correct on mobile and desktop
- `AppShell` pane presentation derives from one container-measured `floating`
  boolean (768px container breakpoint), never viewport breakpoint classes
- Overlays clamp to the viewport and flip when crowded; touch targets stay
  tappable on coarse pointers
