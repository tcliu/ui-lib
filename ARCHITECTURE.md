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
│       ├── app/                  # App-only chrome (theme state, web-settings storage); never published
│       ├── showcase/             # Showcase shell (ShowcasePage/ShowcaseStage, snippet playground, RelatedNav, component index)
│       ├── server/               # Server-only: SvelteKit keeps this out of the client bundle
│       │   ├── card.ts           # Shared card contract (normalize + resolve)
│       │   ├── cron-expression.ts # Shared cron parser (scheduler apps)
│       │   ├── logging.ts        # Server-side structured event logging
│       │   ├── log-format.mjs    # Shared log-line formatter (server runtime + scripts)
│       │   ├── sql-rewrite.mjs   # Postgres→SQLite token rewrite (app runtime + scripts)
│       │   └── d1-binding.mjs    # D1 binding name (deploy flow + runtime selector)
│       ├── app-shell.ts          # AppShell geometry + drawer-mode ruler (768px container breakpoint)
│       └── i18n.svelte.ts        # App i18n store + context
├── static/
│   └── favicon.svg               # Served as-is (browser tab mark)
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
├── tests/                        # Playwright browser specs (*.spec.ts)
├── docs/
│   ├── design.md                 # User-facing behavior
│   └── spec.md                   # Behavioral contracts, API specs, constraints
├── package/                      # The publishable package (build only, not the source)
│   ├── build.mjs                 # Copies and prunes the surface, then runs svelte-package
│   └── check.mjs                 # Verifies the built package and the scratch consumer
└── .worktrees/                   # Git worktrees (gitignored)
```

## Entry points to trace

1. **`src/routes/+layout.svelte`** — the app shell and two-pane showcase host.
   Read this first to see the top bar (picker toggle, title, theme/language
   menus), the searchable component list, and the AppShell that separates them.

2. **`src/lib/showcase/showcase-components.ts`** — the showcase index (`SHOWCASE_COMPONENTS`)
   and browsing groups (`SHOWCASE_COMPONENT_GROUPS`); `/` redirects to
   `/components/base-dialog`. Helpers in `src/lib/showcase/` (`ShowcasePage`,
   `SnippetPreview` +
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

## Server-only modules

SvelteKit treats a directory named `server` as server-only: an import of
`src/lib/server/**` from client code is a build error, so a module in that
directory can never reach a client bundle. Every module that only the server
runtime and the Node scripts use therefore lives there — the card contract, the
event logger, the log-line format, the Postgres→SQLite rewrite, and the D1
binding name.

The scripts import the same files by relative path (`scripts/db-config.mjs` →
`../src/lib/server/sql-rewrite.mjs`), so the app runtime and the tooling share
one implementation instead of drifting. The shared ones are carried
byte-identically by the consuming apps through the parity gate's server list.

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
  `ListboxPanel.svelte` (positioning, option rows, empty row, the `leading`
  element rendered before the default label, and the `option` snippet for row
  content).
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
  breakpoint class and no stacked docked state; one `AppShellPane` per pane keeps the
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
`node tools/create-worktree.mjs <branch>`). Deletion
(`tools/delete-worktrees.mjs`) refuses a target holding running processes — or
whose process status is unreadable — and deletes it only with `--force` (which
discards uncommitted work). `--kill`/`-k` instead offers to terminate the
guarding processes first (SIGTERM then SIGKILL, default No), re-scans, and
deletes the now-unguarded targets; a non-interactive run needs both `--kill` and
`--yes`.

## Shared parity gate

`npm run check` runs `tools/check-shared-parity.mjs` with `--strict`: it derives
the gated surface (everything under `src/lib` and `scripts/`, minus the app-only
directories, the app-owned files, and tests) and byte-compares it against each
registered sibling, resolving each sibling's own module references so a
present-but-unreferenced port is flagged as dead. It fails on a divergence or a
dead port. The gate carries no path list: a file that owns a per-app value marks its own
header `// parity: app-owned — reason`, and an app that must diverge declares the
fork and its reason in its own `shared-parity.json`. A declaration that matches
canonical again is reported as stale.

## The publishable package

`src/lib` is the canonical shared surface, and it stays there: the parity gate and
every consuming app address it by that path. The npm package is a **generated
artifact**, not a second source of truth — `npm run package` compiles the
surface into `dist/`, which carries the manifest npm publishes.

```
src/lib/**                       canonical, unchanged, siblings unaffected
  └─ npm run package
       .package-build/staging/    copy → prune tests
         svelte.config.js         alias: { $lib: ./src/lib }
         svelte-package           $lib/x → ../x; .ts → .js
       dist/                      compiled output + the publish manifest
```

- **The surface** — everything under `src/lib` except the app's own modules:
  `server/` (SvelteKit's server-only directory), `showcase/` (the demo shell) and
  `app/` (theme state and web-settings storage), with tests pruned. A new shared
  module therefore ships without a list edit, and a specifier that points at a
  private or unresolved file fails the build: the package must be self-contained.
- **The dependencies** — read from the bare specifiers the staged sources import
  and pinned to the app's own versions, so the published manifest cannot drift
  from what the app builds against. `@babel/runtime` is implicit (the CodeMirror
  theme package imports it at runtime), `esm-env` is a normal dependency, and
  `svelte` stays a peer.
- **The alias** — `$lib/x` resolves against this app's `src/lib` and against the
  consumer's own `src/lib`, so a published package must not keep it. The staging
  `svelte.config.js` points `$lib` at the staging tree and `svelte-package`
  resolves it to a relative specifier, so there is no `$lib` rewrite. The
  compiler keeps the source specifier shape (an extensionless import stays
  extensionless), which the consumer's bundler resolves.
- **The environment flag** — a shared module imports `BROWSER as browser` from
  `esm-env` directly where its own copy allows it. The one shared component kept
  byte-identical across projects keeps `$app/environment`, and the staging copy
  maps it to `esm-env`, because the framework module never ships.
- **The exports map** — one `*.svelte` pattern per component directory, one
  `*` catch-all (`*.js`), and an explicit entry for every rune module a
  component pattern would otherwise claim: its specifier ends `.svelte` while
  the compiled file keeps `.js` (`use-grid-model.svelte` →
  `use-grid-model.svelte.js`), and an exact key wins over a pattern. A consumer
  keeps the source path it knows (`components/Button.svelte`, `size-scale`,
  `i18n.svelte`), and the manifest stays ~8 KB instead of one entry per file.
- **The stylesheet** — `dist/styles.css` carries the tokens and the palettes,
  plus the `@source` globs that point the consumer's Tailwind at the package
  (Tailwind does not scan `node_modules`).
- **The manifest** — carries the package identity (`name`, `version`,
  `description`, `license`, `author`, `keywords`), the public `publishConfig`,
  and the exports map above; `sideEffects: ['*.css']` keeps a bundler from
  pruning the stylesheet import while every JS module stays side-effect free,
  and `repository`/`homepage`/`bugs` stay absent until the app has a remote to
  point them at.
- **The README** — `dist/README.md` describes the published package (install,
  the stylesheet import, the entry groups), its counts read from the exports
  map; the app's own `README.md` covers the showcase instead.
- **`npm run publish:check`** — builds the package, asserts that no test and no
  app-only specifier ships, that every import resolves, that every shipped file
  resolves through the exports map, that the README ships and the stylesheet
  keeps its side effect, packs the tarball, and builds a scratch consumer
  against it.
- **`npm run release`** — bumps nothing by itself: run `npm version <patch|minor|major>`
  first, then the release script runs `publish:check`, rebuilds with `package`
  (including `publint`), and publishes the built directory with
  `npm publish ./dist --access public`. A version already on the registry fails
  at npm, so there is no registry-diff or auto-bump step.

The i18n store is the one module the package owns and the app also uses: the
context key comes from the global symbol registry (`Symbol.for('ui-lib:i18n')`),
so the app's copy and the package's copy name the same context. A consuming app
merges its own dictionary over the shared one and sets the store through
`setI18nContext`; for a component rendered outside the provider tree (a test, an
island) it registers its store factory with `setDefaultI18nStore`, so the
fallback reads the app's labels rather than the shared dictionary alone.

## Shared UI primitives

`src/lib/components/` holds the reusable controls; keep the source here
canonical (siblings vendor it via the `unify` skill). Reuse one of these instead
of building a parallel control.

- **Input family** — `TextInput` is the canonical field: it renders the
  `<input>` and owns the base chrome, which lives in `input-chrome.ts`
  (`INPUT_CHROME` surface/border/focus/disabled/read-only/motion,
  `INPUT_CHROME_NO_OUTLINE` the same surface without the border/focus border,
  `INPUT_EMBEDDED` the chrome-less base for a field inside another surface,
  `INPUT_METRIC_CLASS` the `--input-*` metric classes, `INPUT_RATIOS` the
  metric ratios). `PasswordInput`, `SearchInput`, and `NumberInput` compose
  `TextInput`, passing their adornment (eye toggle, search icon, steppers)
  through its `leading`/`trailing` snippets; every input-family control forwards
  `hideOutline`, which drops the bordered outline while keeping the surface,
  padding, and text metrics. `TextArea` is a `<textarea>`, so it
  cannot compose an `<input>` and imports the same base directly, adding
  `h-full` so it fills its container height by default. A wrapper sets
  its adornment metrics on the frame with `wrapperStyle` and clears the adornment
  with an appended `className` gutter; a caller that owns the whole visual
  replaces the base with `inputClass`, while a field rendered inside another
  surface (a tag row, a select trigger, a stepper-less numeric field) takes
  `variant="embedded"`, where the container owns the border, the background, and
  the focus ring and the field adds only the text rules it owns. `NumberInput`
  chooses that box with its own `variant` and toggles the stepper overlay with
  `showControls` independently, so hiding the steppers leaves the bordered box
  intact (the stepless demo is `showControls={false}` plus `hideOutline`).
  `EditableText`
  rides `TextInput` the same way and keeps its own skin — an outline ring
  standing in for the text — through that override, since it paints its own
  surface rather than sitting inside another one. Its editing field caps at
  the viewport's right edge and at its `maxWidth` prop; a host narrower than the
  viewport (a pane, a splitter, a table cell) passes the width it can afford, so
  the field never outgrows the host. An adornment over
  the field's border (the number steppers) paints no border of its own: it reserves
  the ring with a transparent border so the base border, focus, and disabled
  colors stay in lockstep. `SelectDropdown`'s box shares the same line/padY ratios
  so text, search, and select align on one row; a date picker's single-mode field *is*
  this `TextInput` (with the calendar affordance in its `trailing` slot), and its
  range trigger reuses the same field font, line, and padding (`INPUT_RATIOS`),
  so both sit level with a field too. `clearable` renders one shared clear
  affordance: it overlays the field's own right edge (`inside`) or sits after it
  as a sibling (`outside`, chosen automatically when a `trailing` adornment
  already owns that edge; override with `clearPlacement`), and the field reserves
  a size-scaled gutter so text never runs under the inside button. The outside
  row reserves a matching slot while empty — the cross's own box (`--clear-box`
  plus its touch floor) — so the input keeps the same width empty and filled.
  `trailer` renders
  caller content outside the field area, sharing the same size-scaled row the
  outside clear uses; a field whose right edge is already taken shifts the inside
  clear with the `--input-clear-offset` custom property. A `number` Value cell
  that drives live interaction state (its setter ignores blank input —
  pagination `currentPage`/`pageSize`/`total`, resizable `width`, splitter
  `value`) stays non-clearable.
- **Button** — the canonical button: `variant` (`primary`, `secondary`,
  `danger`, `outline`, `ghost`), `size` on the shared axis, an `icon` snippet for
  an icon-only control, and `className` for the caller's own additions. An
  icon-only button (`icon` with no children) takes its box from the icon
  metrics alone, so it matches a text button's row height; `pending` disables
  the button and marks it `aria-busy` for assistive tech, so a caller never
  hand-writes that state. A `className` adds utilities; it never restates a
  variant utility: the button's own classes win on source order, so an
  override reads as applied while changing nothing — a state the button already
  models (`aria-pressed`) is styled through a state variant instead.
- **Buttons** — the row that lays out a set of buttons: `align` (`left`,
  `center`, `right`) positions the default row, `size` on the shared axis drives
  the gap between the buttons, and `className` replaces the default layout
  classes — dropping `align` and the size-driven gap with them, so the caller
  owns the whole row. The gap is the row's only metric (a fixed ratio of the
  size dimension, so `md` lands on the `gap-2` step (8px)), and the buttons
  keep the size the caller gives them.
- **Size metrics** — a sized component exposes one numeric size dimension;
  `xs`–`xl` are aliases of the shared `SIZE_PX` axis (`xs:12 … xl:20`). Every
  metric scales by a fixed ratio of that dimension (`metric = ratio ×
  resolveSize(size)`); font is a ratio too — the text-like controls share
  `0.8125` (Button, the input chrome, `SelectDropdown`), while text-only
  components reuse the shared `FONT_RATIO` (0.875, e.g. TagInput/Toast/
  Checkbox/Pagination). `Button`'s icon-only padding is derived
  (`iconPadRatio`: `padY + (line − icon) / 2`, via `p-[var(--btn-icon-pad)]`), so
  a bordered icon-only box (`icon + 2·iconPad`) is the same height as a text
  button's (`line + 2·padY`) and never goes stale when `padY`/`line` are tuned;
  the icon-only shape also floors its box at the text line height, so the
  paddingless `ghost` glyph matches the ghost text row too. An interrelated
  metric is derived from its base rather than tuned beside it: `SelectDropdown`'s
  trigger gutter (chevron → border) is a fixed share of `padX`
  (`SELECT_GUTTER_SHARE`), emitted as
  `--sel-pad-right: calc(var(--sel-pad-x) * share)` so retuning the padding — or
  a caller overriding `--sel-pad-x` — rescales the chevron's inset with it
  instead of shifting it by a constant offset. The helpers in
  `size-metrics.ts` (`resolveSize`, `dimensionMetrics`, `iconPadRatio`,
  `sizeVarStyle`) emit the metric custom properties on the inline style while a
  static utility set consumes them; the constant ratio means no per-step
  anchor/class table and no geometry module. Size svg primitives (icons,
  spinner) take width/height `size` attributes, never classes, so they compose
  with `className`. An icon passed to a `Button` `icon` snippet carries no
  `size` itself — the button's box sizes it, and so does a `Menu` trigger,
  whose button is the shared `Button` (the trigger exposes the same `size`
  axis, and its glyph follows the button's ratio). A
  sized control's own icon slot is the size dimension itself (`icon` ratio `1`),
  and the glyph rendered into it takes the shared icon ratio (`ICON_RATIO`,
  0.8125) — the text-like font ratio, so an `md` icon lands at 13px, the size of
  its label and the optical size the filled-viewBox glyphs were normalized from.
  An in-field affordance trims that slot rather than matching the label:
  `SelectDropdown`'s trigger chevron and clear cross and `TextInput`'s clear
  cross ride `0.625×` it, `NumberInput`'s steppers `0.75×`, `SearchInput`'s
  leading search icon `0.9×`, and all still scale with the control.
  `Pagination`'s page blocks reuse the select trigger's line and vertical
  padding (plus its 1px border), so the numbered blocks, the jump input, and the
  page-size dropdown land on one height. Each block is content-sized — its own
  label plus its horizontal padding and border — and floored by that height, so
  a one-digit cell is square and a wider number widens only its own cell, in
  CSS alone; the jump input tracks its value with `field-sizing: content`
  (falling back to the fixed square where unsupported), so the active cell
  matches a page button holding the same text, and `caretAtEnd` places its
  caret after the value on focus and click so typing replaces the page number.
  `ChipDropdown`'s `CHIP_RATIOS` make
  every metric — the label font and line, padding, the label→chevron and
  chip→clear-slot gaps, the chevron slot, the clear cross, and the label height
  floor — a fixed ratio of the dimension, calibrated so the default `md`
  reproduces the original 12px chip's label, padding, and gaps; its chevron
  instead rides `SelectDropdown`'s `0.625` affordance share so the two markers
  match. It forwards `size` to its inner clear
  `Button`, and its `CHIP_PANEL_RATIOS` scale the menu rows, empty row, and
  search field (with a size-scaled row min-width flooring the content-fit panel
  at the original 256px at `md`), so the option panel resizes with the chip like
  `SelectDropdown`'s. `Chip` scales its own padding, font, line, and label→remove
  gap (and the remove cross) from the dimension, leaving `chipClass` to carry
  color and the static pill's shape. `FormField` scales its label, gaps, and
  inline label column; `Tabs` scales the nav and tab text, padding, and radius.
  `Buttons` scales the gap between the buttons from the dimension.
  The date input shares one `PICKER_RATIOS` set (`date-input-metrics.ts`) covering
  the field's calendar gutter and the panel (width/padding, nav buttons, day
  cells, weekday and meta text); each field's own chrome is the input family's
  (`--input-*` from `TextInput`), so a date field sits level with a text field.
- **Icon glyphs** — one glyph is one component: a single `aria-hidden` `<svg>`
  sized by its `size`/`className` props, with no per-glyph style variant. A
  glyph whose concept the set already carries renders it through that glyph's
  `variant` prop rather than through a second component; the variant names and
  their stroke treatments live in `src/lib/icons/icon-variants.ts`, the registry
  the icon viewport spec reads, so every rendering is checked on its own
  geometry instead of against the union of the glyph's renderings. Every
  square glyph uses the one square viewBox (`0 0 20 20`) and authors its artwork
  directly in that grid: the glyph is normalized at authoring time to fill the
  box on the dominant axis (centered, no distortion, no empty edge, geometry on
  the 0.01 unit step, stroke widths scaled with it), so no per-icon `<g
  transform>` fit stands between the artwork and the grid and
  `resolveIconPx(size)` maps to identical geometry for every icon; that resolver
  applies the shared `ICON_RATIO` (0.8125), so a viewBox-filling glyph still
  lands at the optical size the components around it were tuned for. A glyph
  ported from another project is re-normalized on the way in: its artwork
  reaches at least two edges of the box (the space is clipped, not padded
  around), so a ported mark reads at the same weight as the set it joins rather
  than floating inside its own frame. The `Caret*`
  family is the set's filled direction marker: the one triangle cropped tight to
  the arrow, 12×8 rendering two-thirds tall for up/down and 8×12 rendering
  two-thirds wide for left/right, used by the table sort pair (up/down) and by
  navigation and disclosure (left/right). The chevron family (`Chevron*` and
  `DoubleChevron*`) takes a `variant` prop (`regular` default, `bold`); each
  variant draws its own normalized path — the bold artwork is inset so its
  heavier stroke still fills the box without clipping — with the stroke weight,
  caps, and joins (`bold` is flat-ended and mitred, for a chunky sharp mark)
  coming from the one shared `chevron-stroke.ts` map, so the treatment stays
  uniform across the eight glyphs. The same registry gives `Delete` its filled
  `regular` can plus the outlined `rows` and `columns` band markers, and `Table`
  its `regular` frame plus the four `insertRowAbove`, `insertRowBelow`,
  `insertColumnBefore`, and `insertColumnAfter` renderings, so a related mark
  extends its glyph rather than shipping a second component. Every glyph
  carries the same `size`/`className` props, plus its registered `variant`
  renderings, and appears on the Icons showcase page, which is the
  set's index: `demo-snippet.ts` keeps one entry per glyph in name order and a
  directory-parity spec fails when a file under `src/lib/icons` has no entry.
- **Listbox surfaces** — `SelectDropdown`, `ChipDropdown`, `TagInput`,
  `AutoComplete`, and `Menu` sit on the shared listbox interaction core (Key
  patterns, Shared listbox interactions); `SelectDropdown` derives its trigger
  label from the committed value (options are bare strings or `{ value, label? }`).
- **AutoComplete** — a free-text field composing `TextInput` + `useListbox` +
  `ListboxPanel`: picking an option writes its label to the bindable `value` and
  reports the option's `value` via `onSelect`, filtering to matches only (no
  full-list fallback) and hiding the panel when nothing matches.
- **Menu** — an icon-triggered dropdown (desktop popover, phone bottom sheet):
  its trigger is the shared `Button`, so the box, the hit area, the focus ring,
  and the glyph's size all come from the shared button, and the `size` prop
  scales the trigger on the shared axis (the panel chrome keeps its own
  metrics). The trigger's icon therefore carries no `size` of its own, and
  `triggerClass` never restates the trigger's padding. The panel is a
  `role="menu"` listbox over the shared interaction core, with rows taking
  focus (unlike the never-focused listbox rows) and the phone sheet as the
  narrow-viewport presentation (`MenuSheet` is that sheet).
- **TagInput** — models `string[]` and colours tags from a built-in per-tag
  palette (override with `palette` or `chipClass`, whose function form overrides
  per tag and owns the whole chip class string, shape included); an app with
  a richer tag object maps it to `string[]` at the call site and supplies the
  per-tag colour through `chipStyle` (the chip) and `optionDotStyle` (the dot
  before the option label), keeping its own colour model out of the markup. It
  reports the typed draft via `onQueryChange`, renders chips through `Chip`, and
  exports `focus()`.
- **DateInput** — one control for a date or a date-time, single or a range:
  `DateInput` composes the fields (`DateField` owns the field chrome and the
  portalled panel, over `use-calendar-grid.svelte.ts` for the visible month,
  roving focus, and day nodes, `use-date-text-field.svelte.ts` for the draft and
  strict commit, and `use-time-segments.svelte.ts` for the hour/minute/second
  row). Its two shared modules split by concern: `date-input-core.ts` holds the
  date/time domain (the date math, the display pattern, the typed-entry
  conversion) and carries no presentation, while `date-input-metrics.ts` holds
  the presentation (the `PICKER_RATIOS` that scale the field and its calendar,
  and the `DateInputTheme` per-part colors), so the dependency flow stays
  one-way. The control takes a `time`/`range` pair of options, a `format` prop
  (a dayjs
  display pattern for the field *and* the pattern the typed text is parsed
  against, strictly and locale-aware), and a `theme` prop of per-part color
  classes (structural classes stay fixed). `time` makes every field a date-time
  (its panel gains an hour/minute/second row and the value serializes as
  `YYYY-MM-DDTHH:mm:ss`); `range` renders two independent fields (`from`/`to`,
  each with its own calendar and panel) around a separator, each behaving exactly
  as the single field, so both options coexist — a date-time range is two
  date-time fields. A range pair hands the focus on: committing one end (a
  typed entry, or a pick that closes the calendar) while the other is still
  empty moves the focus to the empty end and opens its calendar there (the
  filled end's panel closes with it, so one calendar is open at a time). Each
  end reaches the other through the pair's `sibling` handle (`DateFieldSibling`
  — the other end's committed day plus the action that takes the focus), which
  `DateInput` wires from the two fields' exported `focusAndOpen`; the day the
  filled end hands over anchors the new panel, so the calendar opens on the
  month the range already sits in. A pick that keeps its panel open (the time
  row) does not hand the focus over, and the pair's time segments never do.
  The pair always holds its two instants in order: a commit that lands on the
  wrong side of the other end exchanges the two values, so the range never
  inverts — the same swap the old single-panel picker did, so a day picked
  before the start becomes the start, and a clock stepped past the other end
  hands the ends over. The comparison is on the instants (`compareValues`),
  not on the days, so a date-time range's clocks count too; the values travel
  whole, so each end keeps a value its own format can read (a bare day would
  read as unset and clear the field). The swap is the pair's business, so it
  lives in `DateInput` (which owns both ends' writes), not in the field, and
  the other end is read before the first write (a prop read after it would
  already carry the value the commit writes). The `highlightRange` prop paints
  the days between the two ends in each end's calendar: the ends read as the
  selected days and the days between them carry the `theme.rangeSpan` tint plus
  a dotted underline (the tint alone would be the only cue), and every day of
  the span is an `aria-selected` cell in a grid marked `aria-multiselectable`
  while it shows one.
  The field is the shared `TextInput`: the calendar icon sits
  in its `trailing` slot and opens the panel, typing is filtered to characters
  the pattern can contain, and each commit parses strictly — a valid entry writes
  back through the internal value format, anything else (including a rollover
  such as Feb 31) reverts to the committed text, with no error state. A field
  whose pattern carries clock tokens also accepts it in part: the entry may
  carry the clock in part and the rest defaults ("2026-01-12 03" in a
  "YYYY-MM-DD HH:mm:ss" field commits "2026-01-12T03:00:00", the date alone
  commits at midnight). The forms come from `entryPatterns` (the pattern up to
  each of its clock tokens, then its date part), and the conversion from
  `toValue` (the typed text to the value it becomes, `''` when it matches
  none) — the shared util an app can use for the same conversion. A 12-hour
  clock or a meridiem keeps its clock whole, since a clock without its
  meridiem would be ambiguous. The grid
  re-anchors its visible month on the value: every change while the panel is
  closed, a value updated from outside while it is open (a typed commit, a
  parent write, restored data), and a complete, valid entry previewed as it is
  typed — so retyping the year moves the view and the highlighted day before the
  commit lands, while the field summary keeps showing the stored value, and a
  rejected entry leaves the grid on the committed value, so the calendar never
  shows a month other than the field's own value. A value
  that carries a time keeps it when only the day changes. Each panel's footer
  pairs a summary of the field's value with the shared icon-only `Button` as its
  clear affordance (the field cross, named for assistive tech rather than
  labelled in text, riding `0.8×` of the icon slot so it reads lighter than the
  calendar glyph). Each field's width hugs
  the pattern's own text in `ch`, plus the chrome the input carries (its padding
  and the calendar gutter), so the value sits close to the affordance rather than
  in a wide field with slack. Each time segment is edited as clock seconds, so a
  step or entry past its own range carries into the next unit and a clock at the
  top of the day rolls the date (23:59:59 + 1s is the next day's 00:00:00)
  instead of clamping; the inputs carry no `min`/`max` for exactly that reason,
  and a roll moves the grid without taking focus from the segment being stepped
  (only a day grid that holds focus hands it to the new day).
  Date math, pattern
  formatting, and the width estimate ride on `dayjs` (a new runtime dependency
  for any app that vendors the input), with the `customParseFormat` plugin
  extended once in `date-input-core.ts`. `DateInput` scales every field and its
  calendar from one `size` (`PICKER_RATIOS` in `date-input-metrics.ts`): its root
  carries the `--pick-*` set, and each portalled panel gets the same set through
  `sizeVarAction` — it is detached from the root, and a `style` binding would
  replace the inline styles the positioner owns.
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
  shared `Button`. Its sticky header and corner cells sit at `z-20`/`z-30`, above
  the app ladder's `z-10` sticky step: the corner is painted last within the
  grid's own stacking context, and lowering it to `z-10` would let the body's
  sticky row headers (equal `z-index`, later in DOM order) paint over it. The
  values stay scoped to the grid and never escape into an overlay.
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
  props tables, so docs and viewer share one table. Its dialog-backed rows
  open an *action* dialog (not `FormDialog`): the editor's primary applies
  the content, so it stays enabled while the content is valid — confirming the
  unchanged seeded content is still the intended action — and dismissing the
  editor mutates nothing.
- **ColumnChooser** — the column-visibility control: an icon trigger opens a
  panel of checkboxes (one per column, labelled by its header) that toggle
  columns on and off, beside a reset button that restores the default set.
  The trigger and reset labels are passed translated, and the panel is the
  shared portalled placement, so it clamps and flips like the other panels.
- **Copyable** — a text and its copy affordance: the text (or a caller's
  content) beside a ghost copy button that copies `copyText` (defaulting to the
  text) and reports the result through the shared toast. The button appears on
  hover or focus and stays visible on touch, and it is omitted entirely when
  there is nothing to copy; `copyPosition` places it inline (default) or at the
  content's top-right corner. The write-and-report step is the shared
  `copy-to-clipboard` helper, which `EditableText` uses too.
- **Resizable** — two-axis resize: `width` + `height` plus `onResize(width, height)`,
  bounds via `minWidth`/`minHeight`/`maxWidth`/`maxHeight`, and three
  invisible cursor-only handles. Every drag and key nudge reports whole pixels
  (fractional deltas round to the nearest integer). `maxWidth`/`maxHeight` accept `'parent'`: the
  box is capped in CSS (`max-w-full`/`max-h-full`) and the drag, key, and
  Home/End clamps measure the parent at interaction time. The handles are
  focusable `role="separator"` widgets carrying `aria-valuenow`/`-min` and
  `-max` when the bound is finite (the max is omitted for an unbounded edge).
  `pointerOnlyHandles` keeps their tab stops closed for good, so a frame that is
  page chrome adds no invisible focus stops (the showcase stage sets it; a frame
  whose keyboard resize is the demo's own subject leaves it off).
- **Splitter** — the one-axis seam between two panes: `value` plus `onChange`,
  `min`/`max` in the same `unit` (`'px'` default, `'%'` for percentage mode,
  where the pointer delta is converted against the flex container's width
  measured on drag start so callers track a plain percentage). It renders a
  zero-sized in-flow wrapper with an absolutely centered, focusable
  `role="separator"` handle that keeps the 12px target and its focus ring while
  the panes stay flush. `AppShell` and the showcase stage build on it.
- **StructureTree / StructureNode** — display and inline-edit a JSON-shaped
  `value`: `StructureTree` renders the top-level container (or a leaf), and each
  `StructureNode` row expands/collapses, renames its key, edits its value
  through a dialog, and copies it. The node's inline text field (edit
  key/text/width, focus-at-end effect, begin/cancel) lives in
  `use-structure-inline-edit.svelte.ts`: each field is sized to the width of the
  text it replaces, so editing it never moves the rest of the row — the colon
  and the value carry a wider gap so the field's focus ring clears the colon —
  typing scrolls inside the field, and focusing collapses the caret to the end
  of the text (the press gesture that opened the field is left unselected too,
  since a field can mount underneath it and the browser would otherwise select
  the word; once the field is open a double-click selects its text normally);
  its object-edit dialog (open flag,
  seed/draft pair, save/format/reset/close) lives in
  `use-structure-object-editor.svelte.ts`; the dialog's discard confirm performs
  the discard on dismissal (`confirmOnDismiss`), so Escape, the overlay, and the
  close control drop the draft instead of returning to the form with it intact. The value helpers (`isContainer`,
  `childEntries`, `jsonPath`, `setAtPath`, `renameKeyAtPath`, …) live in
  `structure-value.ts`. Both components take `size`; `structureStyle` emits the
  node's `--tree-*` metrics from `STRUCTURE_RATIOS` (calibrated so `md`
  reproduces the original 14px/19.25px text and the `xs`/`sm` control steps) and
  a `--tree-gutter` that matches the container caret column — the caret
  button's own box plus the default row-gap difference — so a leaf key and a
  container label share a left edge at every level and size.
- **BarChart** — renders a generic series as `columns: { label, segments,
  tip? }[]`: a column with one segment is a plain bar, several stack (each
  segment growing by its `value` within the column). Column height is its
  segment sum over the tallest column, floored at 2% so the smallest stays
  visible; a wide series thins the axis labels (`ceil(count / 16)`). A
  segment's optional `tone` picks a palette fill from `chart-tones.ts`
  (`CHART_TONES`/`TONE_CLASS`) — literal utilities, so `[data-theme]` remaps
  apply; unset, the tone cycles by segment index. Segment labels build the
  legend (one row per distinct label, summed across columns) unless `legend` is
  false, and a column's `tip` rides the shared `Tooltip`. The plot is a
  `role="img"` named by `ariaLabel` (`chart.label` fallback), with the axis
  `aria-hidden`. `size` scales every metric on the shared axis, calibrated so
  `md` reproduces the ported chart (a 140px plot, 56px max column, 10px axis,
  12px legend); `height` overrides only the plot box (a number is px, a string
  verbatim) — a footprint override, like `BaseDialog`'s height variant, rather
  than a second size dimension — while the metrics keep scaling.
- **FormField** — `layout="stacked"` (default) puts the label above the control;
  `layout="inline"` puts it in the shared inline column at >=sm (6rem at `md`,
  scaling with `size`) and stacks below sm. The inline track is an arbitrary
  value driven by `--ff-inline-col`, not a theme token, so a consuming app need
  not define an app-private grid-columns entry.
- **Tooltip** — plain-text hints use the `tooltip` prop with the shared
  `Tooltip` component. A `tooltip` on a disabled `Button` rides the
  non-disabled wrapper. The component leaves only a hidden anchor in its
  parent (its content portals to `document.body`, and no whitespace text node
  sits beside the anchor), so an inline trigger's own text and layout are never
  disturbed: placing `<Tooltip>` inside an element makes that element the
  trigger with no `trigger` ref, and the explicit `trigger` prop stays for
  cases where the anchor sits elsewhere.
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
  body: the optional `header` snippet renders in the pinned header region (the
  region still labels the dialog; `title` renders the default heading when no
  header is passed), while `children` scrolls between it. The action row is
  part of the content, not a panel region: a dialog that keeps its row visible
  composes it as a `flex-none` sibling of its own scroll area, which is what
  `ConfirmDialog` and `FormDialog` do. `FormDialog` forwards `header`, wraps the
  body in a `<form>` (so Enter still submits), and owns the action row: the
  built-in save/reset pair, extra `actions` buttons before it, or a caller
  `footer` that replaces the pair — the footer renders inside the form, so a
  `type="submit"` button in it submits the form. Its discard confirm takes
  `confirmOnDismiss` — with it the confirm's own dismissal performs the
  discard, without it the dismissal returns to the form with the draft intact.
  `ConfirmDialog` renders its message as the body with the confirm row in
  `footer`.
- **i18n** — a primitive resolves its label as `$derived(prop ?? i18n.t('key'))`
  against `src/lib/locales/` (nested `as const` trees with a dotted-path
  `MessageKey`; non-default locales are typed `LocaleMessages<typeof en>` so a
  missing key fails the build). A consuming app's dictionaries define `common.*`,
  `number.*`, `dropdown.*`, `pagination.*`, `tabs.label`, `chart.label`,
  `search.*`, `splitter.*`, `password.*`, `chip.remove`, `tagInput.*`,
  `copy.*`, `edit.*`, `editor.*`, `structure.*`, `range.*`, `date.*`,
  `time.*`, `grid.*`, `table.*`, `resizable.*`, and `appShell.*`.
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
`focus-within.ts`, `drag-close-down.ts`, `caret-at-end-on-keyboard-focus.ts`,
`Tooltip.svelte`, `AppShell.svelte`,
`use-grid-autoscroll.svelte.ts`, `grid-cell-refs.ts`,
`use-table-scroll-sync.svelte.ts`, `app/theme.svelte.ts`, and `i18n.svelte.ts`.

One component carries a single, named exception rather than a general licence:
`StructureNode.svelte`'s inline-edit text measurement writes and clears a hidden
span's content in one tick, because the field width is needed synchronously
before the first paint.

The only sanctioned `svelte-ignore a11y_*` suppressions are the two documented
false positives scoped to the resize-handle (`a11y_no_noninteractive_*`) and
DataGrid (`a11y_no_static_element_interactions`) subtrees; never suppress another
`a11y_*` warning, and never suppress `state_referenced_locally`.

## Showcase component pages

Each component has one route, `src/routes/components/<slug>/+page.svelte`,
registered in `src/lib/showcase/showcase-components.ts`: `SHOWCASE_COMPONENTS`
(`{ slug, name }[]`) is the index and route source (`/` redirects to
`/components/base-dialog`), and `SHOWCASE_COMPONENT_GROUPS` (`Record<group, slug[]>`) declares the
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
5. Add the slug to `CONVERTED_PAGE_SLUGS` in `tests/snippets.spec.ts`; the
   `components.spec.ts` loop and the `snippets.spec.ts` reproduce loop already
   cover every registered slug.
6. Add a behavior spec under `tests/` for what the generic loops do not cover.

**Resizable stages.** An overlay or placement demo renders inside `ShowcaseStage`
— a pane sized by an inline `flex-basis` percentage plus a `Splitter unit="%"`
handle (dragging 25%–100%), labelled from `scope` as `resizeLabel` — or inside
`ShowcasePage`'s optional resizable stage when the frame is pure chrome. A
`stage={{ minWidth }}` prop renders the hook/host/`Resizable`/pane around both
the static demo and the live mount (the pane is the live mount, so the frame
survives a compile), and the page binds `stageWidth` so its Reset restores the
seeded width. The pane carries no padding (so the demo aligns with the settings
panel), which puts the demo's first control flush at the host's clip edge: the
host therefore clips with the shared clip margin (`--stage-clip-margin`) instead
of at the edge, and neither hook carries paint containment, so a demo's focus
ring or border renders alike whether the demo is static or live. The stage passes
`pointerOnlyHandles` to its `Resizable`, keeping the invisible handles out of the
tab order entirely (the `Resizable` demo, whose subject is keyboard resizing,
leaves it off). Because that frame is chrome, the page's
Show-code builder emits only the demo content, never the frame. A frame that is
the demo's own subject stays in the snippet: AppShell's self-measuring
`Resizable` (width and height),
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
previous render. The live demo row carries no paint containment: containment clips
at the box edge, so a control flush there would lose its focus ring, which means a
snippet that renders a fixed overlay can cover the page. A
snippet may declare local values (data arrays, column defs) in a single leading
`<script>` block, which `snippet-source.ts` splits out and merges into the
compiled preamble's instance script; the block must come first and must not use
module context, and local names override same-named `scope` keys.

## Test layout

A unit test lives beside the module it exercises: `button-size.test.ts` sits next
to `Button.svelte` in `src/lib/components/`, and the fixture it drives is
`button-size.harness.svelte` in the same directory. There is no test-only
directory inside `src/` or `scripts/` — a `__tests__/` folder splits a module
from its spec and makes the shared surface carry files no sibling needs.

The two kinds of test are kept apart by what they exercise: a unit test drives
a module, a browser flow drives a served app, so the browser specs keep the
root `tests/` directory (`*.spec.ts`) — the name the SvelteKit scaffold gives
that directory. The suite is still called end-to-end in the tooling (`npm run
e2e`, `tools/run-e2e.mjs`); only its directory follows the scaffold.

`npm run check` runs `tools/check-test-layout.mjs`: it fails on a test-only
directory, a unit test outside `src/` or `scripts/`, a unit test whose
directory holds no module, a unit test that imports no module from its own
directory, and a spec filed on the wrong side of the split.

## End-to-end tests

`tests/helpers.ts` holds the shared snippet helpers; `components.spec.ts` and
`snippets.spec.ts` hold the generic showcase loops, never one growing spec.
Locator hooks include `data-showcase-demo` (and `data-showcase-live` once the
snippet's live compile has mounted); a portaled overlay renders under
`document.body`, not the demo hook, so its assertions are page-wide.
