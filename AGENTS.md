# AGENTS — ui-lib
Project-specific development conventions for the UI Library web app.

## Agent progress

- For non-trivial tasks, follow `~/.agents/references/agent-progress.md` alongside the primary skill; trivial single-step edits skip it.

## Skill routing

- Trivial single-skill requests invoke the matching skill directly, without routing; route non-trivial, composite, or ambiguous requests through the `skill-routing` skill.
- Honor the selected skills' approval, verification, and scope constraints.

## File editing

- Edit with the smallest possible range: select only the lines that change and put their complete final content in the edit body; if an edit is rejected or the file changed since the last read, re-read the section and issue a new minimal edit rather than retrying.
- An `edit` rejection saying the body "restates" adjacent lines means unchanged context lines leaked into the body: shrink the range to exactly the lines that change and resend; do not retry the same payload.

## Read first

- Read the shared references applicable to the files being edited before
  editing, keeping pre-edit investigation within the read cap in `~/.agents/references/agent-progress.md`.
- Before changing a documented surface, read its managed doc (`ARCHITECTURE.md`, `docs/design.md`); the source wins, and the doc is fixed in the same change.
- Before `read` on a path not seen in prior output or a listing, run `glob` to confirm it instead of guessing names or worktree paths.
- If a `~/.agents/references/...` path is missing, the config root is unconfigured: ask the user for its path once and use it for the session.
- When reviewing completed work, follow the `review` skill and report
  findings with severity, location, rule, and fix.
- When a task is ambiguous, ask the user to clarify or present up to three concrete options before editing, to avoid unwanted changes.

## Architecture

- The project root hosts the browser app and the npm package: the shared source
  stays in `src/lib`, and the root `package.json` is the package manifest.
- `npm run package` runs `tools/build-package.mjs`: `svelte-package` with
  `PACKAGE=1`, the prune of server-only output and tests from `dist/`, then
  `publint`. The root `exports`/`files` fields define what ships.
- That tool drops `svelte-package`'s server-only guard warning only for the
  files the prune removes; it names them and fails when one survives, or when
  any other warning remains. Never add an `$app/server` guard import to silence
  it.
- The root `svelte.config.js` keeps the app aliases under `kit` and adds the
  package-only `$lib`/`$app/environment` ones when `PACKAGE=1`, because
  `svelte-package` and SvelteKit read different config keys.
- Release by bumping the root version with `npm version <patch|minor|major>` and
  running `npm publish`; npm's `prepublishOnly` hook runs `npm run publish:check`
  first, and the build does not diff against the registry or bump.
- A shared component originates here: a sibling that needs one adds it to this
  repo, republishes the package, then consumes it from the package.
- A consuming app imports the package by name (`@codepg/ui-lib/...`); the
  package's own i18n store and the app's share one context key, so the app
  merges its dictionary over the shared one.
- The published identity lives in the root `package.json`; scripts read the name
  rather than repeating the scope. Dependencies used only by the app's scripts
  or server stay in `devDependencies`.
- This project is the canonical source for the shared UI surface; fix a shared component here first, then port it, never fork without syncing back.
- Reuse the existing shared control for a concern instead of building a parallel one; keep app-private UI out of the shared directories (inventory in `ARCHITECTURE.md`).
- `server/` stays under `src/lib` so SvelteKit's `$lib/server` guard covers it;
  the package prunes it from `dist/`. `showcase/` and `app/` are app-private and
  live in `src/showcase` and `src/app`, outside the package source. An
  app-only module belongs in one of those two.
- An app-owned value rides a shared default plus an app-supplied override (a configure call or a data file read at the call site): the shared module stays byte-identical and the package owns it, so the app supplies data instead of owning code. A per-app literal inside a shared module is the exception the parity gate has to whitelist; prefer the override shape.
- A keyed `localStorage` surface layers a generic store and a typed wrapper instead of hand-rolling prefix logic: `createPersistStore(prefixes)` owns the chain (first prefix writes, later ones are migrated read fallbacks, removal clears all) and the domain module (`useColumnWidthStorage`) owns parsing and appends its canonical prefix. The caller passes its own prefixes; no module-level `configure` call or global registry, so behavior never depends on startup order.
- A module whose only per-app part is such a value becomes package-owned (its marker drops); a marker survives only for app content — dictionary bodies, project config data, a package entry — where no call site can supply it.
- Shared components never traverse or manipulate the DOM; sanctioned exceptions and the permitted `svelte-ignore` suppressions are in `ARCHITECTURE.md`. Never suppress another `a11y_*` warning or `state_referenced_locally`.
- Plain-text hints use the `tooltip` prop with the shared `Tooltip` component; a disabled `Button`'s tooltip rides its non-disabled wrapper (disabled triggers fire no events).
- `npm run check` enforces shared parity; a change is complete only once siblings are re-ported or the app declares the fork and its reason in its own `shared-parity.json`. Mechanism in `ARCHITECTURE.md`.
- A module only the server runtime and the scripts use lives under `src/lib/server/`, which SvelteKit keeps out of the client bundle; the scripts import the same file, so the two runtimes cannot drift. Mechanism in `ARCHITECTURE.md`.
- Keep shared scripts byte-identical: read per-app values from ungated app files, never hardcode an app name or path; project-owned data stays out of gated directories.
- Tag editing stays one shared control (`TagInput`); map an app's richer tag
  object to `string[]` at the call site instead of forking a second control.
- The dropdown/menu surfaces share `use-listbox.svelte.ts` (and `ListboxPanel` where the panel shape fits); compose them for a new listbox surface, never re-wiring the helpers by hand.
- Free-text suggestions stay one shared control (`AutoComplete`), filtering to
  matches only and hiding the panel when nothing matches.
- Give `DateInput` its `theme` prop instead of forking it for a different
  palette.
- `SelectDropdown` derives its trigger label from the committed value; pass
  `buttonLabel` only to override it.
- Spreadsheet editing stays one shared control (`DataGrid`); reuse it instead of
  forking a grid.
- Tabular display stays one shared control (`DataTable`), with `FieldTable` for
  `FieldConfig[]` props tables; pagination is optional (omit it for no footer).
- Tree/JSON-shaped display stays one shared control (`StructureTree`); reuse it
  instead of forking a tree viewer.
- Charted data display stays one shared control (`BarChart`), with its tones in
  `chart-tones.ts` (literal palette utilities only, so `[data-theme]` remaps
  apply); a chart's footprint override is its `height` prop beside the `size`
  axis, never a second size dimension. Mechanism in `ARCHITECTURE.md`.
- Two-axis container resizing stays one shared control (`Resizable`); reuse it
  instead of reimplementing pointer capture and keyboard nudges.
- `FormField` carries a `layout` prop (`stacked` default, `inline` label column
  at >=sm) so a form row aligns its labels without forking the wrapper.
- Text-like inputs share one base chrome from `input-chrome.ts`; a new text-like
  field uses that base instead of re-declaring it. A field drops its outline with
  `hideOutline` (the base's borderless surface, padding, and text metrics) rather
  than a custom `inputClass`, and every input-family control forwards it.
- `NumberInput`'s `showControls` hides only the stepper overlay; `variant="embedded"`
  is what hands the box to the caller, so a stepper-less field keeps its bordered
  box — pair it with `hideOutline` for a borderless one.
- A clearable field extends the shared `ClearableProps` group, never re-declaring it or hand-rolling a cross; mechanism in `ARCHITECTURE.md` (Input family).
- A `number` Value cell driving live interaction state (its setter ignores blank input) stays non-clearable.
- A composite field uses `TextInput`'s `trailer` slot for content outside the
  field area rather than re-declaring an input.
- Resize handles are focusable `role="separator"` widgets carrying `aria-valuenow`/`-min` and `-max` when finite (max omitted for an unbounded edge); keep the two documented scoped `svelte-ignore` comments.
- Keep the `DataGrid` ARIA grid pattern and its documented scoped
  `svelte-ignore` comment; never add another `a11y_*` suppression.
- Never combine `align` with `className` on `Buttons`: the custom class replaces the default row and drops `align`; spell the row out (`flex w-full … justify-end`).
- `Buttons` takes the shared `size` axis for the gap between its buttons (its
  only metric); the buttons keep the size the caller gives them, and a custom
  `className` replaces the row, dropping the gap with it.
- The `AppShell` aside carries no padding; left-pane content owns its spacing.
- `AppShell` pane presentation derives from one container-measured `floating`
  boolean, never viewport breakpoint classes; docked and floating are the only
  presentations. Mechanics are in `ARCHITECTURE.md`.
- Labels resolve as `$derived(prop ?? i18n.t('key'))` per
  `~/.agents/references/svelte-i18n.md` (Label resolution); a consuming app's locale
  dictionaries must define the shared keys. Keys, dictionaries, and the exact
  list are in `ARCHITECTURE.md`.
- Component attributes stay camelCase.
- A sized component exposes one numeric size dimension (`xs`–`xl` aliases of the `SIZE_PX` axis) and scales every metric by a fixed ratio; an interrelated metric derives from its base rather than being tuned beside it (the trigger gutter is a fixed share of the horizontal padding), per `~/.agents/references/tailwind.md` (Derived custom properties); details in `ARCHITECTURE.md`.
- A composite embedding sized controls exposes `size?: SizeInput` and forwards it to every inner sized control, defaulting to the shared `md` step so both agree.
- `Pagination`'s page blocks match the page-size dropdown trigger's height (same select line, vertical padding, and 1px border), so the row's controls sit level rather than from a hand-tuned block ratio; a page cell sizes in CSS alone — square at rest, widened only by its own label — and the active cell (the jump field) shares the page buttons' box for the same text and puts the caret at the end on focus/click (`caretAtEnd`).
- A dialog panel's footprint is `BaseDialog`'s `widthVariant`/`heightVariant` (or the `size` shorthand setting both; explicit variant wins), not a `SizeInput` metric scale. Mechanism in `ARCHITECTURE.md`.
- Size svg primitives (icons, spinner) take `size` attributes, never classes.
- A sized control's icon slot is the size dimension itself (`icon` ratio `1`), while the glyph renders at the shared `ICON_RATIO` (`0.8125`), so an icon matches its label and keeps the optical size the filled-viewBox glyphs were normalized from.
- An in-field affordance glyph rides a trimmed share of the icon slot rather than the whole slot — the dropdown trigger's chevron and its clear cross and a clearable field's cross at `0.625×`, the number steppers at `0.75×`, the date panel's clear cross at `0.8×`, the search icon at `0.9×` — so it reads lighter than the label while still scaling with the control.
- `ChipDropdown` scales on the shared size axis (its ratios calibrated so `md` reproduces the original chip's label, padding, and gaps, with its chevron on `SelectDropdown`'s `0.625×` affordance share) and reserves the clear slot while holding its own label width, so clearing never resizes it.
- `Chip` owns its size-scaled spacing (padding, font, line, gap) on the shared axis; `chipClass` supplies color and the static pill's shape (radius), so a caller passes `size` instead of baking padding/font into the class.
- `FormField` and `Tabs` scale their own chrome on the shared axis — `FormField`: label, gaps, and inline label column; `Tabs`: nav/tab text, padding, and radius; the controls slotted into a `FormField` stay the caller's to size.
- The date input is one control: a single `DateField` owns the shared `TextInput` field and the calendar, and `DateInput` composes one field or a `range` pair with a separator — each field behaving as the single field, so a range and a time coexist — so the calendar, the `size` axis, the dayjs `format` pattern, and the `theme` live in the one field.
- A range pair hands the focus to the empty end when the other one is filled and keeps its two instants in order (a commit on the wrong side exchanges the ends); mechanism in `ARCHITECTURE.md`.
- A date field edits its value as text: filter to the pattern's characters, parse strictly on commit, revert anything else; a field whose pattern carries clock tokens also takes it in part, defaulting the missing units. Mechanism in `ARCHITECTURE.md`.
- A date field's width hugs the `format` pattern's own text in `ch` (no prompt floor, no growth), so the value sits close to its calendar affordance and no slack opens between them.
- A `time` field's segments carry instead of clamping: a segment stepped or typed past its own range advances the next unit, and 23:59:59 + 1s rolls the date to the next day's 00:00:00. Mechanism in `ARCHITECTURE.md`.
- Icon glyphs share one square viewBox (`0 0 20 20`) and author their artwork
  directly in it, already normalized to fill the box (dominant axis, centered)
  on the 0.01 unit step, so every square icon renders at a consistent size per
  `size` value and no per-icon `<g transform>` fit sits between artwork and
  grid; the caret pair keeps its non-square crop. A glyph ported in from
  another project is re-normalized on the way in: its artwork reaches at least
  two edges of the box (the space is clipped, not padded around), so it reads
  at the set's weight. Mechanism in `ARCHITECTURE.md`.
- A glyph whose concept the set already carries, or a related mark adding a
  band, edge, or fill, is that glyph's `variant`, never a second file; register
  each rendering's stroke treatment in the shared registry. Mechanism in
  `ARCHITECTURE.md`.
- Reuse this project's existing UI primitives; every button is the shared
  `Button` (icon-only through its `icon` snippet) per
  `~/.agents/references/ui-patterns.md`, never a raw `<button>`.
- A composite trigger that renders the shared `Button` (the `Menu` trigger)
  inherits its box, hit area, focus ring, and glyph size, so the trigger's
  icon carries no `size` and a trigger class never restates padding; the
  composite forwards the shared `size` axis to that button. Mechanism in
  `ARCHITECTURE.md`.
- Icons and buttons take the shared default size: a call site never restates
  the size step, and an icon inside a `Button`'s `icon` snippet carries no
  `size` because the button's box sizes the glyph. Per
  `~/.agents/references/ui-patterns.md` (Shared components).
- Apply code changes in a separate branch and worktree under `.worktrees/` per `~/.agents/references/git.md`, unless the user opts for the current worktree.
- Worktree deletion refuses targets with running processes; the explicit
  terminate-and-delete step (`--kill`) is in `ARCHITECTURE.md`.
- Z ladder: sticky content `z-10`, drawer backdrop `z-30`, floating drawer and
  other overlays (dialogs, menus) `z-40`, dev tag `z-50` — a floating pane must
  paint above its own backdrop, and overlays stay at or below `z-40` so the tag
  is never covered.
- Portal dialogs to `document.body` through `positionPanel` sheet mode so no
  ancestor stacking context can clip or trap them.
- Temporary scratch (plans in `.tmp/plans/`, requirements in `.tmp/features/`)
  lives in `.tmp/`, never in source directories.
- The shared `CodeEditor`/`LazyCodeEditor` load language packs on demand through
  a `docType` lookup; its CodeMirror theme package needs `@babel/runtime` in any
  app that vendors it.
- The showcase's code panel is a live playground: a Show-code snippet must reproduce its static demo exactly, never including a shell-owned resize frame.
- `ShowcasePage` pins everything above the props `tbody` so only the `FieldTable` body scrolls and the header band never scrolls away; mechanism in `ARCHITECTURE.md`.
- When a component's props change, update its showcase page in the same change (playground state, props-table rows, snippet builder, tests), or the change is incomplete.
- A snippet passes page bindings through `scope`; its own data lives in a single leading `<script>` block, local names overriding `scope` keys. Mechanism in `ARCHITECTURE.md`.
- Never assign a constructed collection (`new Set()`/`new Map()`) to snippet state; the compiler emits a legacy `init()` that throws at root mount.
- The playground executes arbitrary JavaScript in the page and is not a sandbox:
  never hand it app secrets, stores, or fetch wrappers.
- Register every page in `src/showcase/showcase-components.ts` and start a new page
  from a close existing one; the add-a-page checklist is in `ARCHITECTURE.md`
  (Showcase component pages).
- The Icons page indexes the whole set: every glyph under `src/lib/icons` gets an entry, in name order, and the snippet playground's preamble imports every glyph, so a directory-parity spec fails when either list misses one.
- The variant playground control offers every registered variant; a glyph takes the chosen one only when it carries it, and the rest keep their default.
- Every page uses the converted shell so the props table drives the live demo, and is listed in `CONVERTED_PAGE_SLUGS`; shape in `ARCHITECTURE.md`.
- Converted-page props table: list editable props first (primitives, data, snippets, A–Z), then function props (A–Z); a function prop or object carrying functions stays read-only.
- Every Snippet-typed prop is editable through the markup dialog; demo data with no prop row lives in the settings panel. Mechanism in `ARCHITECTURE.md`.
- Every dialog-backed prop row renders an eye toggle beside the edit icon; a toggle-configured primitive row renders it trailing the input.
- Apply an applied prop as `prop={on ? value : undefined}` per `~/.agents/references/svelte.md` (Components), never `{#if}`-gated element children.
- A row's eye off omits an optional prop from the demo and Show-code, keeping committed data for re-applying; a required prop resets to its default.
- Committing a changed value re-applies the eye (an unchanged commit leaves it
  as it is), and Reset restores data plus eyes.
- Start a new eye on when its curated value is non-default; only default-valued rows start off, so the cleared form reproduces the curated demo and seed exactly.
- The only eye-free dialog row is data applied elsewhere with nothing of its own to preserve (data-table `chooserColumns`); record the reason in a code comment.
- Build a required dialog row's eye with `resetToggle` (off resets committed data to the row default); an optional row's uses `snippetToggle`. A row whose demo binds the state also uses `resetToggle` (off resets the bound state to its default; the binding stays). Mechanism in `ARCHITECTURE.md`.
- Declare a `text`/`number`/`tri` row and let `syncFieldsOf` derive its absent-attribute fallback; never hand-write a `sync.set` repeating it (`set` stays for a bespoke setter) — except an eye row prefilling a literal default, which takes a custom `read` (absent resolves to current state) and `set` (default maps back to unset) so compiling never stages the default into the form.
- A `text`/`number` Value cell with a Value editor sets `clearable`; `TextArea` has no clearable.
- A Value cell's Type takes a `?` suffix only when the prop is optional, so a required value keeps the bare type.
- A Value input's placeholder is the literal default when the prop has one, otherwise absent, never a meta-hint like `(none)` or `(built-in)`.
- Build a dialog-backed prop row with the shared `snippetField`/`jsonField`/`snippetToggle`/`resetToggle`/`snippetDialog` helpers rather than inline row literals; the row's seed and commit stay page-specific. Mechanism in `ARCHITECTURE.md`.
- Build a `size`/`text`/`boolean`/`enum` prop row with the shared `sizeField`/`textField`/`boolField`/`enumField` helper rather than an inline literal; Show-code builders share escaping and tri-state helpers (`escapeAttr`/`escapeText`/`escapeRawLine`/`unescapeAttr`/`TriState`/`flagOn`) from `$showcase/snippet-build.ts` instead of re-declaring them per page.
- The shell owns the snippet preview: a page passes `scope`/`sync` (plus `scopeRefresh`/`scopeRefreshWhen` when its snippet reads scope keys the seed omits) to `ShowcasePage` rather than constructing a `SnippetPreview` itself.
- Seed a dialog-backed Value cell from the fallback-resolved demo value, not the raw override; map the untouched default back to unset on commit.
- A dialog-backed row must round-trip every editable facet its dialog presents, with `dialog.valid` rejecting any shape it cannot reproduce; cover each with a round-trip spec.
- Before closing a props-table task, re-audit all rows, not just the requested type: every editor-less primitive-typed row is made editable or its read-only reason recorded.
- A playground preset that derives other props fills their panel fields from the shared builder constants, so demo, Show-code, and live render stay identical.
- Every `size` prop gets a settings-panel control.
- A settings-panel control that drives several props at once is a preset: it writes them, so the props table mirrors it (the Buttons page's size sets the row's gap and every button's size).
- Wide and container-sensitive demos follow the stage rules in `ARCHITECTURE.md`; a demo frame carries no inline-start or top padding, matching the settings panel's left edge.
- A stage frame clips with the shared clip margin, never at its edge, so a flush control keeps its focus ring or border.
- The stage's resize handles stay out of the tab order.

## UI behavior

- Size and space elements from their own box; never compensate a container's padding or margin with a negative margin on an inner element.
- Overhang with a `before:-inset-*` hit area or a zero-footprint wrapper, and tighten stacks with the stack's own spacing (`~/.agents/references/ui-patterns.md`).
- Use the fewest elements: put borders and spacing on existing elements instead of adding `hr`/`div` wrappers, and merge a single-child wrapper into its parent.
- Keep responsive layout decisions in CSS (no JS `matchMedia` for initial
  layout) so the first paint is correct on mobile and desktop.
- Keep focusable controls keyboard reachable with explicit focus styles and accessible names; keep non-interactive scroll wrappers out of the tab order (`tabindex="-1"`).
- `AppShell` fills its container (`h-full`), the app supplying the viewport box (`h-dvh` wrapper); never `min-h-screen`, `overflow-hidden` clipping, or chasing mobile keyboard gaps (see `cross-browser.md`).
- Icon-only `Button` padding is the same fixed ratio of its size dimension as every other metric; text buttons keep `px`/`py` distinction. Mechanism in `ARCHITECTURE.md`.
- The `ghost` variant deliberately carries no padding for icons or text, so it stays compact.
- A ghost text button restores breathing room through `className`; a ghost on a touch surface still owes the mobile target (`~/.agents/references/responsive-design.md`).
- `ConfirmDialog` routes dismiss affordances to `onCancel` when passed; a discard confirm passes `confirmOnDismiss` so Escape/overlay/close perform the confirm, while destructive confirms keep the safe cancel.

## Theming

- Theme palettes live only in `src/lib/styles.css` as `[data-theme]` overrides of
  the Tailwind palette variables; do not add per-component theme conditionals
  or duplicate palette values.
- Ink on vivid accent fills uses the fixed `text-onaccent` token, never a
  remapped slate grade.
- Adding or renaming a theme means updating every sync point in one change;
  missed sync points silently fall back to the default palette.

## References

- Follow `~/.agents/references/svelte.md` for Svelte 5 runes and effect rules.
- Follow `~/.agents/references/packaging.md` for the package delivery model (in-place compile, exports map, published manifest, republish flow).
- Follow `~/.agents/references/js-ts.md` for module design (coherent responsibility, one-way dependency flow, domain helpers split from presentation).
- Follow `~/.agents/references/tailwind.md` for literal utility classes and attribute-driven palette remapping.
- Follow `~/.agents/references/accessibility.md` for focus management, keyboard access, labels, and reduced motion.
- Follow `~/.agents/references/responsive-design.md` for breakpoints, touch targets, and overlay drawers.
- Follow `~/.agents/references/portals.md` for portal and overlay positioning, viewport clamping, and flip-when-crowded placement.
- Follow `~/.agents/references/ui-patterns.md` for dialogs, form dialogs, icons, comboboxes, and the two-arrow table sort pattern.
- Follow `~/.agents/references/svelte-i18n.md` for the locale store, the message-key tree, and label resolution.
- Follow `~/.agents/references/cross-browser.md` for browser-owned viewport and keyboard differences.
- Follow `~/.agents/references/reliability.md` for state safety, async flows, and concurrency guards.
- Follow `~/.agents/references/verification.md` for lint, typecheck, and test validation tiering.
- Follow `~/.agents/references/git.md` for commit message conventions and worktree isolation.
- Follow `~/.agents/references/sql.md` for schema and query conventions.
- Follow `~/.agents/references/logging.md` for server-side structured event logging.
- Follow `~/.agents/references/browser-debugging.md` for browser reproduction and evidence collection.

## Keeping references in sync

- When a code change establishes or revises a project-specific convention, update
  this `AGENTS.md` in the same change.
- When a code change establishes or revises a generic reusable convention, update the appropriate `$AI_CONFIG_DIR/references/` file in the same change rather than duplicating it here.
- After a behavior-affecting change, invoke the `doc` skill to reconcile the managed docs (`README.md`, `ARCHITECTURE.md`, `docs/design.md`, `docs/spec.md`) in the same change, per `~/.agents/references/conventions-extraction.md` (Document roles).
- Shared reference files under `$AI_CONFIG_DIR/references/` must stay generic: no project-specific paths, component names, routes, or internal identifiers; put project-level details here instead.
- When recording a convention borrowed from a sibling project, describe only the rule and its content; never name the source project.
- This `AGENTS.md` holds project-specific *development conventions* — rules to follow when writing code — not feature descriptions or implementation narratives. Keep each bullet to the rule plus the briefest rationale; architecture detail belongs in the project's architecture document (`ARCHITECTURE.md`, or its spec when the project hosts architecture there) and user-facing behavior in `docs/design.md`.
- Offer `learn` on a correction, approval, or new convention per `~/.agents/references/learning-flow.md`, the single owner of the correction signals; do not restate them here.

## Quality checks

- Trivial non-behavioral edits (docs, comments, strings) need only a targeted
  check (e.g. `npm run check` or the single affected test).
- Run the full suite before finishing behavior-affecting changes or handing
  off a worktree:

```bash
npm run check
npm run build
npm test
```

- Measure unit coverage with `npm run test:coverage` (vitest v8 provider); use the summary as evidence for test-coverage findings, never as a percentage target.
- Browser (e2e) specs live one-per-component/concern under `tests/`, with shared helpers not one growing spec; anchor locators on roles, accessible names, or `data-*` hooks, never DOM nesting.
- A unit test lives beside its module (`foo.test.ts`, fixture `*.harness.svelte`); browser specs stay in root `tests/`, with no test-only directory in `src/`, `scripts/`, or `tools/`. `npm run check` enforces it (`tools/check-test-layout.mjs`); shared parity exempts tests and harnesses. Mechanism in `ARCHITECTURE.md`.
- Portaled overlays render under `document.body`, not the demo hook, so anchor those assertions page-wide; match exactly when one accessible name prefixes another (`~/.agents/references/testing.md`).
- TypeScript rides dual installs: keep `typescript@~6` main (`svelte-check` peers only on 5/6) and `@typescript/native` checking via `--tsgo`; promoting to 7 breaks the gate.
