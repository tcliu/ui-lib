# AGENTS — ui-lib
Project-specific development conventions for the UI Library web app.

## Agent progress

- For non-trivial tasks, follow `~/.agents/references/agent-progress.md` alongside the primary skill; trivial single-step edits skip it.

## Skill routing

- Trivial single-skill requests invoke the matching skill directly, without routing; route non-trivial, composite, or ambiguous requests through the `skill-routing` skill.
- Honor the selected skills' approval, verification, and scope constraints.

## File editing

- Edit with the smallest possible range: select only the lines that change and put their complete final content in the edit body; if an edit is rejected or the file changed since the last read, re-read the section and issue a new minimal edit rather than retrying.
- An `edit` rejection saying the body "restates" adjacent lines means unchanged
  context lines leaked into the body: shrink the range to exactly the lines
  that change and resend; do not retry the same payload.

## Read first

- Read the shared references applicable to the files being edited before
  editing, keeping pre-edit investigation within the read cap in `~/.agents/references/agent-progress.md`.
- Before `read` on a path not seen in prior tool output or a directory
  listing, run `glob` to confirm the path instead of guessing file names or
  worktree paths.
- If a `~/.agents/references/...` path does not exist, the config root is
  unconfigured on this machine (fresh clone): ask the user for the config-root
  path once and use it for the session instead of guessing.
- When reviewing completed work, follow the `review` skill and report
  findings with severity, location, rule, and fix.
- When a task is ambiguous about what to change or how to approach it, ask the
  user to clarify or present up to three concrete options before editing, to
  avoid unwanted changes.

## Architecture

- The project root hosts the browser app.
- This project is the canonical source for the shared UI surface: the primitives
  in `src/lib/components/`, the shared icons and actions, and the generic
  `scripts/`. Sibling apps vendor them through the `unify` skill and adapt only
  import paths and per-app storage keys. Fix a shared component here first, then
  port it; never fork one in a consuming app without syncing the change back, or
  `npm run check`'s parity gate will fail.
- Shared components never traverse or manipulate the DOM: render `$state`,
  reach an owned node through `bind:this` or a Svelte action, and read an event
  target's own attributes in place. Follow the imperative-DOM-access ban in
  `~/.agents/references/svelte.md`; only these isolated accessibility and
  infrastructure helpers are exempt: `position-panel.svelte.ts` (portal
  attach/detach and placement), `BaseDialog` + `use-app-shell-drawer.svelte.ts`
  (focus trap and `document.activeElement` restore), `use-dropdown.svelte.ts`,
  `click-outside.ts`, `use-focusout-close.ts`, `drag-close-down.ts`,
  `Tooltip.svelte`, and `AppShell.svelte` (outside-click and popup focus
  containment, Escape routing through their own element refs),
  `use-grid-autoscroll.svelte.ts` (grid hit-testing through
  `elementFromPoint`/`closest`/`dataset`), `grid-cell-refs.ts` (owned-node
  registry: cells, editors, and selectors register their own nodes through
  actions so grid focus and edit transitions never query the DOM),
  `use-table-scroll-sync.svelte.ts`
  (header padding measured from the body scrollbar), `tooltip.svelte.ts`
  (action reads its own element's `dataset` + geometry), and `theme.svelte.ts` +
  `i18n.svelte.ts` (root `data-theme`/`lang` attributes). Keep each in its own
  focused module and never copy the pattern into feature code.
- Plain-text hints use `data-tip` with the shared `use:tooltip` engine (route
  layout hosts the `#tip` box via `setTipBox`); rich positioned content keeps
  the `Tooltip` component. A `dataTip` on a disabled `Button` rides on a
  non-disabled wrapper, since disabled triggers fire no mouse events.
- `scripts/check-shared-parity.mjs` (run by `npm run check`) byte-compares the
  shared directories (`src/lib/components/`, `src/lib/icons/`, `src/lib/actions/`,
  `src/lib/data-table/`, `scripts/`) plus the listed top-level `src/lib/*.ts`
  files against each registered sibling app. Keep app-private UI out of the
  shared directories (this app's own chrome lives under `src/routes/_chrome/`);
  a change to a shared file is not complete until the sibling copies are
  re-ported or the divergence is added to that script's documented exception
  list with a reason.
- Tag editing stays one shared control: `TagInput` models `string[]` and covers
  per-tag coloring through its optional `chipClassFor` hook plus `chip`/`option`
  snippets, so an app whose tags carry extra data (e.g. `{ name, color }`) maps
  that object model to `string[]` at the call site instead of forking a second
  tag-input component. It exports `focus()` for dialog autofocus.
- Spreadsheet editing stays one shared control: `DataGrid` models `string[][]`
  and covers header/column-label, fixed-column, resize-persistence, and
  read-only variants through props (`showHeaders`, `columnLabels`, `maxColumns`,
  `editable`, `storageKey`), together with its `use-grid-*` hooks and grid
  icons, so an app needing a CSV or key/value editor reuses it instead of
  forking a grid.
- Two-axis container resizing stays one shared control: `Resizable` takes
  `width`/`height` numbers plus `onResize(width, height)`, bounds them through
  `minWidth`/`minHeight`/`maxWidth`/`maxHeight`, and renders three invisible
  handles (right, bottom, corner) that show only a resize cursor, so an app
  needing a drag-resizable box reuses it instead of reimplementing pointer
  capture and keyboard nudges. A maximum may be the string `'parent'`, which
  bounds the frame to the parent's content box: the box is capped in CSS
  (`max-w-full`/`max-h-full`, so a requested size can never overflow the
  container) and the drag, key nudge, and Home/End clamps measure the parent at
  interaction time. Use it to keep a frame inside a non-scrolling container so
  no scrollbar can ever cover a handle.
- `FormField` carries a `layout` prop: `stacked` (default) renders the label
  above the control; `inline` renders the label in a 6rem column beside the
  control at >=sm and stacks below sm, so a form row aligns its labels without
  forking the wrapper.
- Resize handles are focusable `role="separator"` widgets carrying
  `aria-valuenow`/`aria-valuemin`/`aria-valuemax`; the two
  `svelte-ignore a11y_no_noninteractive_*` comments above a handle are the
  documented false positive for Svelte misclassifying a focusable separator as
  non-interactive, scoped to the handle subtree.
- `DataGrid` implements the ARIA grid pattern — a `role="grid"` table whose
  `role="columnheader"`/`role="rowheader"`/`role="gridcell"` cells carry
  `tabindex="-1"` plus pointer and keyboard handlers, with the container
  capturing the Ctrl+Z/Ctrl+Y history shortcuts; the `svelte-ignore
  a11y_no_static_element_interactions` comments on those elements are the
  documented false positive for Svelte misclassifying ARIA-defined grid roles as
  static elements, scoped to the grid subtree. These two scoped exceptions are
  the only sanctioned a11y suppressions: never suppress another `a11y_*` warning,
  and never suppress `state_referenced_locally` (read the value through an
  accessor or `untrack` instead).
- Never combine `align` with `className` on `Buttons`: a custom `className`
  replaces the default row and silently drops `align`; spell the row out
  (`flex w-full … justify-end`) instead.
- The `AppShell` aside carries no padding: left-pane content owns its own
  spacing, so shell and pane padding never need compensating values.
- `AppShell` pane presentation derives from one `floating` boolean measured on
  the shell's own container (`ResizeObserver` at `APP_SHELL_DESKTOP_BREAKPOINT`),
  never from viewport breakpoint classes; docked and floating are the only two
  presentations, and direction, borders, splitters, backdrop, `inert`, Escape,
  and the slide axis all follow it. A pane anchored on the far side of its
  splitter (the right pane) passes `invert` so the handle follows the pointer
  while widening the pane instead of running away from it. Docked wrappers keep
  an explicit pane width
  and the content row a `min-width` floor so a narrow container squeezes the pane
  instead of clipping or overlapping it. Rail collapse docks while wide and
  floats as a plain overlay when narrow; a nested shell visibility-hides its own
  floating panes while an ancestor overlay is open. Mechanics in
  `ARCHITECTURE.md`.
- The shared primitives resolve labels as `$derived(prop ?? i18n.t('key'))` and
  fall back to the locales in `src/lib/locales/` (nested `as const` trees with a
  dotted-path `MessageKey`; every other locale is typed `LocaleMessages<typeof en>`
  so a missing key fails the build). A consuming app's locale
  dictionaries must define the shared keys (`common.*`, `number.*`, `dropdown.*`,
  `pagination.*`, `tabs.label`, `search.placeholder`, `splitter.*`, `password.*`,
  `combobox.*`, `tagInput.*`, `kebab.*`, `range.*`, `grid.*`, `resizable.*`, and
  `appShell.*`).
- Component attributes stay camelCase.
- New sized components support the full `xs`–`lg` scale from the start (literal
  per-size classes, never interpolated) instead of growing sizes one use case
  at a time.
- Size svg primitives (icons, spinner) through the `size` prop (`xs`–`lg` as
  width/height attributes), never size classes: attributes compose with
  `className`, while explicit size classes in `className` still win because
  CSS beats attributes.
- Express an icon glyph's alternate drawing styles as a `variant` prop on the
  one component (`outline` stroke by default, `solid` fill) instead of adding a
  second icon file, so one glyph stays one component.
- Reuse this project's existing UI primitives and patterns when they fit,
  especially dialog, dropdown, editor, and icon components; do not build a
  parallel design system for equivalent controls.
- Apply code changes in a separate git branch and worktree under `.worktrees/`
  per the shared `git.md` worktree practice (branch `<type>/<change-name>`,
  path mirrors branch); create worktrees with
  `node scripts/create-worktree.mjs <branch>` from the default worktree; it
  copies the gitignored local dev files (`.env.local` and all files under
  `.data/`) and sets `DEV_TAG=<branch>` so the dev tag identifies the branch,
  unless the user opts for the current worktree.
- Worktree deletion refuses targets with running processes: `findProcessesInPath`
  (`scripts/_worktrees.mjs`) scans `/proc` cwds and both delete flows refuse
  guarded checkouts (an unreadable process status also refuses), because deleting
  under a live server half-removes the worktree (unregistered,
  files/branch/server left). An explicit terminate-and-delete step (default No;
  `--kill` in `delete-worktrees.mjs`) stops guarding processes via the shared
  `terminateProcessesInPath` helper — SIGTERM then SIGKILL on re-verified
  individual PIDs only, never the invoker's own process chain.
- Z ladder: sticky content `z-10`, drawer `z-20`, overlays `z-40`, dev tag
  `z-50` — keep overlays at or below `z-40` so the tag is never covered.
  Exception: the transient `use:tooltip` hint host uses the `--z-index-tooltip`
  token (45, Tailwind's `--z-index-*` namespace → the `z-tooltip` utility),
  above portalled `z-40` dialogs that paint after it in body order, still below
  the dev tag.
- Portal dialogs to `document.body` through `positionPanel` sheet mode so no
  ancestor stacking context (including the showcase's paint-contained demo row)
  can clip or trap them.
- Temporary scratch files (plans, proposals, notes) go in `.tmp/` (plans in
  `.tmp/plans/`), never in source directories. Direct every other temporary
  file there too (dev-server logs, probe scripts, ad-hoc output) instead of
  `/tmp`, so scratch stays inside the worktree and cleans up with it. In-progress feature requirements
  go in `.tmp/features/{feature-name}.md` as supplementary context only.
- The shared `CodeEditor`/`LazyCodeEditor` load language packs on demand through
  a `docType` lookup, and its CodeMirror theme package requires `@babel/runtime`
  to be installed in any app that vendors it.
- The showcase's per-section code panel is a live playground: `ShowcaseSection`
  owns a `SnippetPreview` (`src/lib/showcase/use-snippet-preview.svelte.ts`)
  that compiles the edited Svelte source in the browser (`svelte/compiler`
  loaded via dynamic `import()` so it stays a separate lazy chunk) and swaps
  the section's own demo row with the live instance in place. `CodeSnippet`
  is only the editor plus the copy button. A section passes the page bindings
  its snippet references through `ShowcaseSection`'s `scope`; compile and
  render failures show inline and keep the previous render, and the live demo
  row is `contain: paint` so a snippet that renders a fixed overlay cannot
  cover the page (portaled dialogs escape it by design). Every section's snippet must reproduce its own static demo
  exactly (same structure, full class strings, localized text via `scope`, same
  props), so opening Show-code with default state is pixel-identical until the
  user edits. Snippets must never assign a constructed collection (`new
  Set()`/`new Map()`) to state: the compiler then emits a legacy `init()` call
  that throws when the playground mounts the snippet at the root — build the
  value in a `scope` helper instead. A snippet may also declare local values
  (data arrays, column defs) in a single leading `<script>` block: the
  playground splits it out and merges it into the compiled preamble's instance
  script, and local names override same-named `scope` keys, so a snippet can be
  self-contained. The block must come first and must not use module context;
  the split/merge logic lives in `src/lib/showcase/snippet-source.ts`.
- The playground executes arbitrary JavaScript in the page: it evaluates the
  compiler output with `new Function` after rewriting its imports to a whitelist
  of shared primitives. This is not a sandbox — the code still reaches page
  globals, storage, and `fetch` — so it is acceptable only for this local
  showcase and must never be handed app secrets, stores, or fetch wrappers.
- Every component showcase page is one `ShowcaseSection` with a single live
  demo plus a settings-panel `footer` (`Reset` plus `FormField` controls over
  `pg*` playground state, unset by default); a colocated `demo-snippet.ts`
  builder (+ test) regenerates the Show-code source from that state, and the
  section title derives from `isCustomized` (`showcase.default` /
  `showcase.customized`).
- A playground preset that derives other props fills visible panel fields for
  them (shared builder constants as the single source), so static demo,
  Show-code, and live render stay identical; every `size` prop gets a panel
  control using the standard `xs`–`lg` options.
- Showcase demos for the wide components (`DataGrid`, `DataTable`, `Splitter`)
  use `ShowcasePage wide`, fill the container (no max-width), and render inside
  `ShowcaseStage` (`src/lib/showcase/ShowcaseStage.svelte`): a pane sized by an
  inline `flex-basis` percentage plus a `Splitter unit="%"` handle that drags it
  between 25% and its 100% default, labelled with `showcase.resizeDemo`. The
  width is interaction state, excluded from `isCustomized` and restored by
  `Reset`; the page passes the handle label through the section `scope` as
  `resizeLabel`, and the `demo-snippet` builder emits the same stage from the
  shared literals in `resizable-stage.ts` (including the snippet's local
  `stageWidth` state) so static demo and Show-code stay identical. A demo passes
  `showHandle={false}` when its pane owns a bounded height or its own separator
  is the only handle — `ShowcaseStage` then renders the pane with no inline width
  and no handle (the width comes from `paneClass`), and its builder uses the
  handle-less `stageStaticOpenLines`/`stageStaticCloseLines` literals instead of
  the `stageWidth` state; the DataTable demo is always handle-less (its
  `fillHeight` pane owns a bounded height), and the Splitter demo is always
  handle-less (its own separator is the only handle).
- The AppShell demo is the one container-responsive demo that needs a
  `Resizable` frame instead of `ShowcaseStage`: the shell measures its own
  container to choose between docked and floating, so the container itself must
  be resizable. Its stage is a non-scrolling `w-full overflow-hidden` host
  wrapping a `Resizable` at a fixed px default (840×420, min 320×240) with
  `maxWidth="parent"` — the frame is bounded by the host and capped in CSS, so it
  can never overflow it and no scrollbar can appear over a frame handle — and
  `maxHeight={SHELL_STAGE_MAX_HEIGHT}` (the host hugs the frame, so the parent's
  height is not a usable bound). Its pane carries no padding, so the shell lines
  up with the settings panel below it. Those literals live in the app-shell
  `demo-snippet` (the `SHELL_STAGE_*` constants and its stage line helpers) and
  the snippet emits the same stage, so static demo and Show-code stay identical.
- Showcase demo frames line up with the section chrome: a demo wrapper carries
  no inline-start or top padding, only the padding its own scrollbars need on the
  axes where they render, so the frame's left edge matches the settings panel
  below it.

## UI behavior

- Keep responsive layout decisions in CSS (no JS `matchMedia` for initial
  layout) so the first paint is correct on mobile and desktop.
- Keep all focusable controls keyboard reachable, with explicit focus styles and
  accessible names for icon-only buttons. Keep non-interactive scroll wrappers
  out of the tab order (`tabindex="-1"` on overflow containers) so Tab lands
  only on interactive controls.
- The app shell fills the dynamic viewport with `h-dvh` (non-shrinking chrome,
  one flexible editor region); do not add `min-h-screen`, clip the shell with
  `overflow-hidden`, or chase mobile keyboard gaps — those differences are
  owned by the browser (see `cross-browser.md`).
- Icon-only `Button` uses uniform padding (`p-1` for `xs`, `p-1.5` for `sm`, `p-2.5` for `md`, `p-3` for `lg`);
  text buttons keep `px`/`py` distinction. The `ghost` variant deliberately
  carries no padding for icons or text, so it stays compact; a ghost text button
  restores breathing room through `className`, and a ghost on a touch surface
  still owes the mobile target per `~/.agents/references/responsive-design.md`.
- `ConfirmDialog` routes its dismiss affordances to a separate `onCancel` when
  one is passed; a discard confirm passes `confirmOnDismiss` so Escape, overlay
  click, and the close icon perform the confirm (the discard) instead of
  returning to the form, while destructive confirms keep the safe cancel.

## Theming

- Theme palettes live only in `src/styles.css` as `[data-theme]` overrides of
  the Tailwind palette variables; do not add per-component theme conditionals
  or duplicate palette values.
- Ink on vivid accent fills uses the fixed `text-onaccent` token, never a
  remapped slate grade.
- Adding or renaming a theme means updating every sync point in one change;
  missed sync points silently fall back to the default palette.

## References

- Follow `~/.agents/references/svelte.md` for Svelte 5 runes and effect rules.
- Follow `~/.agents/references/js-ts.md` for module design with one-way dependency flow.
- Follow `~/.agents/references/tailwind.md` for literal utility classes and attribute-driven palette remapping.
- Follow `~/.agents/references/accessibility.md` for focus management, keyboard access, labels, and reduced motion.
- Follow `~/.agents/references/responsive-design.md` for breakpoints, touch targets, and overlay drawers.
- Follow `~/.agents/references/portals.md` for portal and overlay positioning, viewport clamping, and flip-when-crowded placement.
- Follow `~/.agents/references/ui-patterns.md` for dialogs, form dialogs, icons, comboboxes, and the two-arrow table sort pattern.
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
- When a code change establishes or revises a generic reusable convention, update
  the appropriate file under `$AI_CONFIG_DIR/references/` in the same change rather
  than duplicating it here.
- Shared reference files under `$AI_CONFIG_DIR/references/` must stay generic and
  implementation-agnostic: no project-specific paths, component names, routes, or
  internal identifiers. Put project-level details in this `AGENTS.md` instead.
- When recording a convention borrowed from a sibling project, describe only the rule and its content; never name the source project.
- This `AGENTS.md` holds project-specific *development conventions* — rules to
  follow when writing code — not feature descriptions or implementation
  narratives. Keep each bullet to the rule plus the briefest rationale;
  architecture detail belongs in `ARCHITECTURE.md` and user-facing behavior in
  `docs/design.md`.
- When the user corrects a mistake, approves a fix, or states a new convention, invoke the `learn` skill so the lesson is not repeated.

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
- e2e specs live one-per-component/concern under `e2e/` (showcase,
  components, snippets, data-table, resizable-stage, app-shell, base-dialog),
  with shared snippet helpers in `e2e/helpers.ts` rather than one growing spec.
- TypeScript rides dual installs: `typescript@~6` stays the main package because
  `svelte-check` peers only on 5/6, while `@typescript/native` (TS 7) performs
  the check via the `--tsgo` flag in `npm run check`. Keep both and the flag;
  promoting `typescript` to 7 breaks the check gate.
