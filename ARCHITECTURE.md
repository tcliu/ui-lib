# Architecture — UI Library

This document describes how the code is organized so you can navigate and
trace behavior quickly. For what the system does and the contracts it obeys,
see `docs/spec.md`; for what the user sees and does, see `docs/design.md`;
for how to write code in this project, see `AGENTS.md`.

## Stack

- **Svelte 5** (runes) + **SvelteKit** (routing, server endpoints)
- **Tailwind CSS v4** (utility-first styling, theme via CSS variable overrides)
- **Vercel** deployment by default (`@sveltejs/adapter-vercel`, Node.js runtime), or **Cloudflare Pages** (`@sveltejs/adapter-cloudflare`, selected by `CF_PAGES=1`)

## Project structure

```
ui-lib/
├── src/
│   ├── app.html                  # HTML shell, pre-paint theme script
│   ├── styles.css                # Tailwind entry, theme palette overrides
│   ├── routes/
│   │   ├── +layout.svelte        # App shell: top bar, two-pane showcase, dev tag
│   │   ├── +layout.server.ts     # Passes the DEV_TAG env to the layout
│   │   ├── +page.ts              # Redirects / to the first showcase component
│   │   ├── _chrome/              # App-private UI (this app's chrome; never shared)
│   │   ├── components/
│   │   │   └── <slug>/+page.svelte # One showcase page per component
│   │   └── api/
│   │       └── info/+server.ts    # GET /api/info — project self-card for discovery
│   └── lib/
│       ├── components/           # Presentational UI components (canonical shared surface)
│       ├── actions/              # Shared interaction helpers (type-ahead, option match, list key-nav)
│       ├── data-table/           # DataTable helpers
│       ├── icons/                # Shared icon glyphs
│       ├── locales/              # i18n dictionaries (en, zh-CN, zh-TW)
│       ├── showcase/             # Showcase shell (ShowcasePage/ShowcaseStage, snippet playground, RelatedNav)
│       ├── server/
│       │   ├── card.ts   # Shared card contract (normalize + resolve)
│       │   └── logging.ts # Server-side structured event logging
│       ├── app-shell.ts          # AppShell geometry + drawer-mode ruler (768px container breakpoint)
│       ├── theme.svelte.ts       # Theme state (THEMES, dark default) over web-settings storage
│       ├── i18n.svelte.ts        # App i18n store + context
│       └── showcase-components.ts # Showcase index (SHOWCASE_COMPONENTS) + browsing groups
├── scripts/
│   ├── deploy.mjs                # Deploy entry (availability/preflight -> interview -> plugin pipeline)
│   ├── deploy.config.mjs         # Loads the repo-root deploy.config.json (project-owned selection)
│   ├── _deploy/                  # Pipeline core + backend selection + targets/{vercel,cloudflare} + plugins
│   ├── sync-vercel-env.mjs       # Push .env.vercel values to the Vercel project
│   ├── sync-cloudflare-env.mjs   # Push .env.cloudflare values to the Cloudflare Pages project
│   ├── heartbeat.mjs             # Liveness heartbeat
│   ├── log-event.mjs             # Structured event logger
│   ├── create-worktree.mjs       # Worktree creation
│   ├── worktree-manager.mjs      # TUI worktree manager
│   ├── _worktrees.mjs            # Worktree library
│   ├── _terminal.mjs             # Terminal utilities
│   ├── _tui.mjs                  # TUI rendering utilities
│   ├── _interactive-shell.mjs    # Interactive shell utilities
│   ├── env-file.mjs              # Shared dotenv parser
│   ├── db-config.mjs             # Database connection config
│   ├── apply-schema.mjs          # Apply the SQL schema
│   ├── register-worktrees.mjs    # Register worktrees with git
│   ├── delete-worktrees.mjs      # Delete worktree branches and checkouts
│   ├── copy-worktree-config.mjs  # Copy gitignored local config into a worktree
│   ├── find-running-apps.mjs     # Probe for running dev servers
│   └── run-e2e.mjs               # E2E entry point (resolve or start a server)
├── sql/
│   └── schema.sql                # Schema source of truth (applied via npm run schema:apply)
├── docs/
│   ├── design.md                 # User-facing behavior
│   └── spec.md                   # Behavioral contracts, API specs, constraints
└── .worktrees/                   # Git worktrees (gitignored)
```

## Entry points to trace

1. **`src/routes/+layout.svelte`** — the app shell and two-pane showcase host.
   Read this first to see the top bar (picker toggle, title, theme/language
   menus), the searchable component list, and the AppShell that separates them.

2. **`src/lib/showcase-components.ts`** — the showcase index (`SHOWCASE_COMPONENTS`)
   and browsing groups (`SHOWCASE_COMPONENT_GROUPS`); `/` redirects to the first
   entry. Helpers in `src/lib/showcase/` (`ShowcasePage`, `SnippetPreview` +
   `snippet-playground.ts`, `FieldTable` rows) compose each page.

## Layering

Showcase pages are thin composition over the shared surface:

```
Route (components/<slug>/+page.svelte + colocated demo-snippet.ts)
  │  composes
  ▼
Showcase shell (src/lib/showcase/) + FieldTable rows
  │  drive
  ▼
Shared components (src/lib/components/) + actions/i18n/theme helpers
  │  served by
  ▼
Server endpoint (api/info/+server.ts via src/lib/server/card.ts)
```

- **Routes** are declarative page markup plus a `demo-snippet.ts` builder that
  regenerates the Show-code source from page state. They contain no shared
  control logic.
- **Showcase shell** owns the demo/stage/playground/props-table machinery shared
  by every page.
- **Shared components** are dependency-free presentational controls; they never
  traverse or manipulate the DOM outside the sanctioned infrastructure helpers.
- **Server endpoints** handle HTTP concerns (validation, caching headers); the
  only route is `GET /api/info`.

## Key patterns

- **Composable factories** — `useXxx()` functions returning reactive state
  via Svelte 5 runes. Each owns one domain concern. They accept dependencies
  as arguments to avoid circular imports.
- **Shared listbox interactions** — the dropdown surfaces build on one set of
  helpers in `src/lib/actions/`: `typeahead.ts` (native type-ahead; Shift
  reverses), `option-index.ts` (lowercased option index, match test, and
  matched-label split), `listbox-keynav.ts` (modified-key test plus
  flush-on-move), and `use-active-highlight.svelte.ts` (O(1) per-row highlight
  flags). `use-listbox.svelte.ts` composes them into the navigation and dismissal
  core shared by `SelectDropdown`, `ChipDropdown`, `TagInput`, `AutoComplete`,
  and `Menu` (active
  index, held-key moves with optional disabled-skipping, type-ahead, focusout
  close, and the `useDropdown` lifecycle); each surface keeps its own open state,
  filtering, and value commit. The aria-activedescendant surfaces render
  `use-active-highlight` flags; `Menu` focuses the active item instead.
  `SelectDropdown`, `TagInput`, and `AutoComplete` share the panel chrome through
  `ListboxPanel.svelte` (positioning, option rows, empty row, and the `option`
  snippet for row content).
- **Thin routes** — `+page.svelte` is mostly declarative markup; all logic
  lives in composables and `page/` helpers.
- **Theme system** — themes are CSS variable overrides in `src/styles.css`
  under `[data-theme='…']`. A pre-paint inline script in `app.html` applies
  the stored theme before first paint.
- **AppShell responsive presentation** — one `floating` boolean, measured from
  the shell's own container via a `ResizeObserver` against
  `APP_SHELL_DESKTOP_BREAKPOINT`, drives every pane decision: flex direction,
  aside borders, which splitters render (the far-side right-pane splitter is
  `invert`ed so its handle tracks the cursor while the pane widens), the
  overlay/backdrop, `inert` on the main column, Escape dismissal, and the slide
  axis. There is no viewport
  breakpoint class and no stacked docked state; one wrapper per pane keeps the
  pane mounted across the docked/floating switch — the opaque surface and the
  explicit `w-[var(--pane-w)]` (capped at `max-w-[calc(100%-3rem)]`) live on the
  wrapper, the aside yields (`min-w-0`, no `shrink-0`) so it can never overflow
  it, and the content row keeps a `min-width` floor from `min` so a narrow
  container squeezes the pane instead of clipping or overlapping it. The pane's
  aside clips its own content (`overflow-hidden`) and is a query container
  (`@container`), so nothing paints across the splitter and pane content can
  adapt to the pane's own width (the demo drops its left-pane label in the rail).
  Rail collapse docks while wide and floats as an open-or-closed overlay (no rail
  strip) below the breakpoint. Both panes share one per-side controller
  (`use-app-shell-drawer.svelte.ts`). Nested shells publish an `AppShellNesting`
  context callback and visibility-hide their own floating panes (kept mounted,
  `open` preserved) while an ancestor overlay is open, so an outer overlay
  always covers an inner one.

## Worktrees

Worktrees live under `.worktrees/` (created with
`node scripts/create-worktree.mjs <branch>`). Deletion
(`scripts/delete-worktrees.mjs`) refuses a target holding running processes — or
whose process status is unreadable — and deletes it only with `--force` (which
discards uncommitted work). `--kill`/`-k` instead offers to terminate the
guarding processes first (SIGTERM then SIGKILL, default No), re-scans, and
deletes the now-unguarded targets; a non-interactive run needs both `--kill` and
`--yes`.

## Shared parity gate

`npm run check` runs `scripts/check-shared-parity.mjs` with `--strict`: it
byte-compares the gated shared directories (`src/lib/components`,
`src/lib/icons`, `src/lib/actions`, `src/lib/data-table`, `scripts`), the listed
top-level `src/lib/*.{ts,mjs}` files, and the shared server utilities against
each registered sibling, resolving each sibling's own module references so a
present-but-unreferenced port is flagged as dead. It fails on a divergence or a
dead port; a deliberate divergence is recorded in the script's documented
exception list with a reason.

## Shared UI primitives

`src/lib/components/` holds the reusable controls; keep the source here
canonical (siblings vendor it via the `unify` skill). Reuse one of these instead
of building a parallel control.

- **Input family** — `TextInput` is the canonical field: it renders the
  `<input>` and owns the base chrome, which lives in `input-chrome.ts`
  (`INPUT_CHROME` surface/border/focus/disabled/read-only/motion,
  `INPUT_METRIC_CLASS` the `--input-*` metric classes, `INPUT_RATIOS` the
  metric ratios). `PasswordInput`, `SearchInput`, and `NumberInput` compose
  `TextInput`, passing their adornment (eye toggle, search icon, steppers)
  through its `leading`/`trailing` snippets; `TextArea` is a `<textarea>`, so it
  cannot compose an `<input>` and imports the same base directly, adding
  `h-full` so it fills its container height by default. A wrapper sets
  its adornment metrics on the frame with `wrapperStyle` and clears the adornment
  with an appended `className` gutter; a caller that owns the whole visual
  replaces the base with `inputClass`. An adornment over the field's border (the
  number steppers) paints no border of its own: it reserves the ring with a
  transparent border so the base border, focus, and disabled colors stay in
  lockstep. `SelectDropdown`'s box shares the same line/padY ratios so text,
  search, and select align on one row. `clearable` renders one shared clear
  affordance: it overlays the field's own right edge (`inside`) or sits after it
  as a sibling (`outside`, chosen automatically when a `trailing` adornment
  already owns that edge; override with `clearPlacement`), and the field reserves
  a size-scaled gutter so text never runs under the inside button. The outside
  row reserves a matching slot (an inert spacer the size of the cross) while
  empty, so the input keeps the same width empty and filled. `trailer` renders
  caller content outside the field area, sharing the same size-scaled row the
  outside clear uses; a field whose right edge is already taken shifts the inside
  clear with the `--input-clear-offset` custom property. A `number` Value cell
  that drives live interaction state (its setter ignores blank input —
  pagination `currentPage`/`pageSize`/`total`, resizable `width`, splitter
  `value`) stays non-clearable.
- **Size metrics** — a sized component exposes one numeric size dimension;
  `xs`–`xl` are aliases of the shared `SIZE_PX` axis (`xs:12 … xl:20`). Every
  metric scales by a fixed ratio of that dimension (`metric = ratio ×
  resolveSize(size)`); font is a ratio too — the text-like controls share
  `0.8125` (Button, the input chrome, `SelectDropdown`), while text-only
  components reuse the shared `FONT_RATIO` (0.875, e.g. TagInput/Toast/
  Checkbox/Pagination). `Button`'s icon-only padding is the same ratio
  (`0.375 × the dimension`, via `p-[var(--btn-icon-pad)]`). The helpers
  in `size-metrics.ts` (`resolveSize`, `dimensionMetrics`,
  `sizeVarStyle`) emit the metric custom properties on the inline style while a
  static utility set consumes them; the constant ratio means no per-step
  anchor/class table and no geometry module. Size svg primitives (icons,
  spinner) take width/height `size` attributes, never classes, so they compose
  with `className`. An icon passed to a `Button` `icon` snippet is sized by the
  button's icon box (`[&_svg]:h-full [&_svg]:w-full`) and carries no `size`
  itself; Menu-trigger icons keep their `size` (Menu has no such override).
- **Icon glyphs** — one glyph is one component: a single `aria-hidden` `<svg>`
  sized by its `size`/`className` props, with no per-glyph style variant.
- **Listbox surfaces** — `SelectDropdown`, `ChipDropdown`, `TagInput`,
  `AutoComplete`, and `Menu` sit on the shared listbox interaction core (Key
  patterns, Shared listbox interactions); `SelectDropdown` derives its trigger
  label from the committed value (options are bare strings or `{ value, label? }`).
- **AutoComplete** — a free-text field composing `TextInput` + `useListbox` +
  `ListboxPanel`: picking an option writes its label to the bindable `value` and
  reports the option's `value` via `onSelect`, filtering to matches only (no
  full-list fallback) and hiding the panel when nothing matches.
- **TagInput** — models `string[]` and colours tags from a built-in per-tag
  palette (override with `palette` or `chipClass`, whose function form overrides
  per tag); an app with
  a richer tag object maps it to `string[]` at the call site. It reports the
  typed draft via `onQueryChange`, renders chips through `Chip`, and exports
  `focus()`.
- **DateRangePicker** — a `theme` prop of per-part color classes replaces only
  those color classes; structural classes stay fixed.
- **DataGrid** — models `string[][]`; header/column-label, fixed-column,
  resize-persistence, and read-only are props (`showHeaders`, `columnLabels`,
  `maxColumns`, `editable`, `storageKey`) over the `use-grid-*` hooks
  (`use-grid-model` owns the row matrix, its mutation, and the undo/redo stacks,
  `use-grid-selection` orchestrates selection, `use-grid-columns` the column
  widths/labels, `use-grid-clipboard` copy/cut/paste, `use-grid-autoscroll`
  scroll-into-view, `use-grid-keyboard` the cell-box key mapping,
  `use-grid-selectors` the row/column selector drags and range steps,
  `use-grid-editor` the in-cell editor, `use-grid-sort` the column-sort state,
  `use-grid-undo-redo` the toolbar history controls, `use-grid-history` the
  snapshot stacks, and `use-grid-serialize` the committed-matrix bounds);
  `grid-selection-state.ts` holds the selection-state shape so the selector and
  keyboard composables can share it without importing the selection
  orchestrator; the toolbar is `GridToolbar` and the selection/presentation
  classes live in `grid-styles.ts`. It implements the
  ARIA grid pattern: a `role="grid"` table whose
  `role="columnheader"`/`role="rowheader"`/`role="gridcell"` cells carry
  `tabindex="-1"` plus pointer and keyboard handlers, and the container owns the
  Ctrl+Z/Ctrl+Y history shortcuts. Its inline glyph controls that the shared
  `Button` cannot express (sort arrows, segmented page numbers, the row/column
  selectors, the live-rename affordances) stay raw `<button>`/`role="button"`
  elements per the ui-patterns inline-glyph exception; every other button is the
  shared `Button`.
- **DataTable / FieldTable** — `DataTable` models paged `rows` + `columns`; its
  `pagination` object (`total`, `pageSize`, `currentPage`, `onPageChange`,
  `onPageSizeChange`, `pageSizeOptions`, `labels`, `trailing`) is optional, and omitting it renders
  no footer. The managed column-width engine lives in
  `use-table-columns.svelte.ts`: pixel widths aligned by column key, the
  persisted copy, the reset signal, and the shared `use-column-resize`; the
  component keeps the DOM refs.
  `variant="docs"` swaps the viewer chrome for the static docs chrome.
  `bordered={false}` drops the viewer/split container chrome for borderless
  embedding. `FieldTable` rides on `DataTable` to render `FieldConfig[]`
  props tables, so docs and viewer share one table.
- **Resizable** — two-axis resize: `width` + `height` plus `onResize(width, height)`,
  bounds via `minWidth`/`minHeight`/`maxWidth`/`maxHeight`, and three
  invisible cursor-only handles. Every drag and key nudge reports whole pixels
  (fractional deltas round to the nearest integer). `maxWidth`/`maxHeight` accept `'parent'`: the
  box is capped in CSS (`max-w-full`/`max-h-full`) and the drag, key, and
  Home/End clamps measure the parent at interaction time. The handles are
  focusable `role="separator"` widgets carrying `aria-valuenow`/`-min` and
  `-max` when the bound is finite (the max is omitted for an unbounded edge).
- **StructureTree / StructureNode** — display and inline-edit a JSON-shaped
  `value`: `StructureTree` renders the top-level container (or a leaf), and each
  `StructureNode` row expands/collapses, renames its key, edits its value
  through a dialog, and copies it. The node's measured inline text field
  (edit key/text/min-width, focus and auto-width effects, begin/cancel) lives in
  `use-structure-inline-edit.svelte.ts`; its object-edit dialog (open flag,
  seed/draft pair, save/format/reset/close) lives in
  `use-structure-object-editor.svelte.ts`. The value helpers (`isContainer`,
  `childEntries`, `jsonPath`, `setAtPath`, `renameKeyAtPath`, …) live in
  `structure-value.ts`.
- **FormField** — `layout="stacked"` (default) puts the label above the control;
  `layout="inline"` puts it in a 6rem column at >=sm and stacks below sm. The
  inline track is a literal arbitrary value, not a theme token, so a consuming
  app need not define an app-private grid-columns entry.
- **Tooltip** — plain-text hints use the `tooltip` prop with the shared
  `Tooltip` component. A `tooltip` on a disabled `Button` rides the
  non-disabled wrapper.
- **Dialogs** — `ConfirmDialog` routes its dismiss affordances to `onCancel` when
  one is passed, and `confirmOnDismiss` makes Escape/overlay/close perform the
  confirm instead of cancelling. Dialog content portals to `document.body`
  through `positionPanel` sheet mode. The panel footprint lives on `BaseDialog`:
  `widthVariant` (`xs`–`7xl`, plus `fit`/`wide`), `heightVariant` (`auto` plus
  `xs`–`7xl`), and the `size` shorthand that sets both (an explicit variant
  wins). The steps are exported as `DIALOG_SIZE_VARIANTS`. Tailwind has no
  named `max-h` container scale, so the height steps are literal
  container-equivalent values, capped by the panel's own `max-h-[90vh]`. A
  `ConfirmDialog`'s confirm-button scale is `buttonSize`, distinct from the
  panel `size`. `BaseDialog` composes the panel as fixed header, scrolling
  body, fixed footer: the optional `header`/`footer` snippets render in the
  pinned regions (the header region still labels the dialog; `title` renders
  the default heading when no header is passed), while `children` scrolls
  between them. `EditDialog` forwards `header` and renders its action row
  through `footer` (the form keeps wrapping the body so Enter still submits);
  `ConfirmDialog` renders its message as the body with the confirm row in
  `footer`.
- **i18n** — a primitive resolves its label as `$derived(prop ?? i18n.t('key'))`
  against `src/lib/locales/` (nested `as const` trees with a dotted-path
  `MessageKey`; non-default locales are typed `LocaleMessages<typeof en>` so a
  missing key fails the build). A consuming app's dictionaries define `common.*`,
  `number.*`, `dropdown.*`, `pagination.*`, `tabs.label`, `search.placeholder`,
  `splitter.*`, `password.*`, `chip.remove`, `tagInput.*`, `copy.*`, `edit.*`,
  `editor.*`, `structure.*`, `range.*`, `grid.*`, `resizable.*`, and
  `appShell.*`.
- **CodeEditor / LazyCodeEditor** — load language packs on demand through a
  `docType` lookup; the CodeMirror theme package needs `@babel/runtime` in any
  app that vendors it.

### Sanctioned DOM access

Shared components never traverse or manipulate the DOM (render `$state`, reach an
owned node through `bind:this` or a Svelte action, read an event target's own
attributes in place). These isolated infrastructure helpers are the only
exceptions, and the pattern must not be copied into feature code:
`position-panel.svelte.ts`, `BaseDialog` + `use-app-shell-drawer.svelte.ts`,
`use-dropdown.svelte.ts`, `click-outside.ts`, `use-focusout-close.ts`,
`drag-close-down.ts`, `Tooltip.svelte`, `AppShell.svelte`,
`use-grid-autoscroll.svelte.ts`, `grid-cell-refs.ts`,
`use-table-scroll-sync.svelte.ts`, `theme.svelte.ts`, and
`i18n.svelte.ts`.

The only sanctioned `svelte-ignore a11y_*` suppressions are the two documented
false positives scoped to the resize-handle (`a11y_no_noninteractive_*`) and
DataGrid (`a11y_no_static_element_interactions`) subtrees; never suppress another
`a11y_*` warning, and never suppress `state_referenced_locally`.

## Showcase component pages

Each component has one route, `src/routes/components/<slug>/+page.svelte`,
registered in `src/lib/showcase-components.ts`: `SHOWCASE_COMPONENTS`
(`{ slug, name }[]`) is the index and route source (`/` redirects to the first
entry), and `SHOWCASE_COMPONENT_GROUPS` (`Record<group, slug[]>`) declares the
relatedness behind each page's `RelatedNav` chips — two components are related
when they share a group, so the relation is symmetric by construction.

A page composes shared pieces from `src/lib/showcase/`:

- `ShowcasePage` — page container and demo block: `title`, demo `children`,
  `code`, the `scope`/`sync` it builds its own `SnippetPreview` from (a
  caller-owned `preview` still wins), `scopeRefresh`/`scopeRefreshWhen`,
  `configPanel`, `stage`/
  `stageWidth`, an optional `onReset`, and the `fields` rows it renders as the
  shared `FieldTable`. The page fills the viewport (`h-full`) with the demo
  block (title row, `RelatedNav`, demo, editor, config panel) fixed in a
  `flex-none` wrapper; the Props section below holds the only
  scrollport, so the header band (including the thead bottom border) never
  scrolls. It tags its demo row `data-showcase-demo` and its props section
  `data-showcase-props` (named "Props", no visible heading). The title row
  owns the demo-visibility eye toggle (on by default; hiding keeps the demo
  mounted with `display:none` so a live instance survives), the code toggle
  when a `code` seed is present, and the `Reset` that fires `onReset` — so a
  converted page renders no header chrome or props table of its own. The
  container caps at `max-w-7xl`.
- `FieldTable` — the props table, split into a fixed header band with a
  body-only scrollport (`bodyScroll` + `fillHeight` on its `DataTable`), so
  pages render it bare with no wrapper. Both tables share declared column
  widths, keeping them aligned; the body flexes into the leftover height.
  `bordered={false}` keeps it borderless on the page canvas, and long
  name/type tokens wrap instead of spilling into the next column. It
  renders each row's Value cell from its `editor`
  (`text` → `TextInput`, `textarea` → `TextArea`, `number` → `NumberInput`,
  `enum`/`size` → `SelectDropdown`, `boolean` → `Checkbox`, `options-json`/
  `snippet` → an edit dialog seeded from the row's `value`). A `text` row
  whose value reaches 30 chars renders `TextArea` instead, so long values
  stay readable; the area editor absolutely fills its Value cell (an in-flow
  spacer holds the two-row floor), so tall rows leave no gap beneath it. A
  dialog-backed row also
  renders an apply eye toggle from its `toggle` config (a primitive row with
  toggle config renders it trailing the input). A `text`/`number`/`enum`/`size` row renders its clear
  cross only when its `clearable` flag is set (with `clearLabel`/`onClear`
  committing empty).
- `SnippetPreview` (`use-snippet-preview.svelte.ts`) + `snippet-playground.ts` —
  the live Show-code playground (its `sync` option runs the write-back through
  `snippet-sync.ts`); `use-scope-refresh.svelte.ts` recompiles over scope keys;
  `snippet-source.ts` splits a leading `<script>`.
- `ShowcaseStage.svelte` and `resizable-stage.ts` — the resizable stage for wide
  and container-sensitive demos.
- A colocated `demo-snippet.ts` (+ `.test.ts`) builder regenerates the Show-code
  source from the page's `pg*` state.

**Page shape.** Every page is converted. It owns the `SnippetPreview` and passes
its `fields`, keeps the title row, demo, and editor fixed above the props
scrollport, lets the shell host the code toggle and `Reset` (fired through
`onReset`), and appends an editable Value column so the props table drives the
live demo.

**Adding a page.**

1. Add `{ slug, name }` to `SHOWCASE_COMPONENTS` and the slug to its group(s) in
   `SHOWCASE_COMPONENT_GROUPS`.
2. Create `src/routes/components/<slug>/+page.svelte`, starting from a close
   existing page (`button`, `select-dropdown`, or `app-shell`).
3. Add the colocated `demo-snippet.ts` builder and its `.test.ts`.
4. Follow the page shape above and add its editable Value rows (row rules in
   `AGENTS.md`).
5. Add the slug to `CONVERTED_PAGE_SLUGS` in `e2e/snippets.spec.ts`; the
   `components.spec.ts` loop and the `snippets.spec.ts` reproduce loop already
   cover every registered slug.
6. Add a behavior spec under `e2e/` for what the generic loops do not cover.

**Resizable stages.** An overlay or placement demo renders inside `ShowcaseStage`
— a pane sized by an inline `flex-basis` percentage plus a `Splitter unit="%"`
handle (dragging 25%–100%), labelled from `scope` as `resizeLabel` — or inside
`ShowcasePage`'s optional resizable stage when the frame is pure chrome. A
`stage={{ minWidth }}` prop renders the hook/host/`Resizable`/pane around both
the static demo and the live mount (the pane is the live mount, so the frame
survives a compile), and the page binds `stageWidth` so its Reset restores the
seeded width. Because that frame is chrome, the page's Show-code builder emits
only the demo content, never the frame. A frame that is the demo's own subject
stays in the snippet: AppShell's self-measuring `Resizable` (width and height),
and the `showHandle={false}` static pane (DataTable, Splitter) whose bounded pane
is the demo. The `ShowcaseStage` builder emits its stage from the shared literals
(`resizable-stage.ts`, or the AppShell `SHELL_STAGE_*` constants) so static demo
and Show-code stay identical.

**Converted-page rows.** Each editable row's editor and its write-back shape are
declared once as a `SyncableFieldConfig` and the table is derived with
`syncFieldsOf(fields)`; a write-back with no prop row (a demo sample value, an
item label the demo owns) is appended after it. A builder that always emits an
attribute lists its default in that row's `sync.unsetValues`. The page passes
its `scope` and `sync: { tag, getFields }` to `ShowcasePage`, which owns the
preview and writes compiled
attributes back into page state and reseeds (`syncSeed`) so the editor keeps the
user's text; a page whose snippet reads `scope` keys the seed does not cover
passes `scopeRefresh` (a `scopeRefreshWhen` gate scopes it)
to recompile over those keys while live. A Value cell prefills its
literal component default (`boolean` as `yes`/`no`, `enum`/`size`/`text`/
`number` literals; markers like `locale`/`built-in` and non-literals stay
unset with a placeholder), so the table shows what the demo renders. A row's
literal default is its `editorDefaultValue`, else the Value cell's
`placeholder` (a marker default has none). The
builder omits the default and `syncFieldsOf` derives the row's write-back
setter from its `onChange`. A row without an eye resolves an absent attribute
(an empty write) back to the row's own default — a `tri` row to its boolean
default (yes/no), a `text`/`number` row to its literal default, and a row with
neither to unset — so a page declares the row and never repeats the
fallback in a hand-written `sync.set`, which stays the escape hatch for a
bespoke setter. An eye row that prefills a literal default never stages it: an
absent attribute writes the row's current value back (so unapplying with
Show-code open cannot wipe committed custom data), and a write that lands on the
default unstages the eye. A `custom` tag-attribute `read` (e.g. `size`) follows
the same rule; a `scriptJson` sync needs no such guard (a missing declaration
already skips). Clearing a Value restores the same default (unsets when the row
has no literal default) and unapplies the eye, and Reset restores the curated
playground. The
same literal default is the editors' clear baseline, so the cross hides while
the Value matches it. A row
with a `dialog` editor opens `FieldTable`'s dialog
(`OK` commits, `Reset` reverts); pure snippet helpers shared across demos live in
`$lib/showcase/`. A dialog-backed prop row is built with `snippetField`
(markup dialog) or `jsonField` (JSON dialog) plus `snippetToggle` (optional
eye) / `resetToggle` (required eye) / `snippetDialog`
(`$lib/showcase/snippet-field.ts`), which supply its `type`/`defaultValue`/
`editor` boilerplate, apply-eye toggle, and exact-shape dialog; only the
row's seed and commit stay page-specific. A non-dialog row family is built the
same way: the `size`/`text`/`boolean`/`enum` rows are `sizeField`/`textField`/
`boolField`/`enumField` (same module), and the Show-code
builders share their escaping and tri-state helpers from
`$lib/showcase/snippet-build.ts` rather than re-declaring them. A
dialog-backed `children` row that takes free-form HTML (the
AppShell block) accepts only well-balanced markup the demo and the compiled seed
render identically — no expressions, component tags, directives, comments,
scripts, or event handlers — and renders and emits it verbatim.

**Snippet playground.** A section passes the page bindings its snippet
references through `scope`. A snippet must reproduce its static demo exactly —
same structure, full class strings, localized text via `scope`, same props — so
default Show-code is pixel-identical to the demo. Compile and render failures show inline and keep the
previous render; the live demo row is `contain: paint` so a snippet that renders
a fixed overlay cannot cover the page (portaled dialogs escape it by design). A
snippet may declare local values (data arrays, column defs) in a single leading
`<script>` block, which `snippet-source.ts` splits out and merges into the
compiled preamble's instance script; the block must come first and must not use
module context, and local names override same-named `scope` keys.

## End-to-end tests

`e2e/helpers.ts` holds the shared snippet helpers; `components.spec.ts` and
`snippets.spec.ts` hold the generic showcase loops, never one growing spec.
Locator hooks include `data-showcase-demo`; a portaled overlay renders under
`document.body`, not the demo hook, so its assertions are page-wide.
