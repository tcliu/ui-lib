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
- `scripts/check-shared-parity.mjs` (run by `npm run check`) byte-compares every
  shared file against each registered sibling app. A change to a shared file is
  not complete until the sibling copies are re-ported or the divergence is added
  to that script's documented exception list with a reason.
- Tag editing stays one shared control: `TagInput` models `string[]` and covers
  per-tag coloring through its optional `chipClassFor` hook plus `chip`/`option`
  snippets, so an app whose tags carry extra data (e.g. `{ name, color }`) maps
  that object model to `string[]` at the call site instead of forking a second
  tag-input component. It exports `focus()` for dialog autofocus.
- The shared primitives resolve labels as `$derived(prop ?? i18n.t('key'))` and
  fall back to the locales in `src/lib/locales/`; a consuming app's locale
  dictionaries must define the shared keys (`common.*`, `number.*`, `dropdown.*`,
  `pagination.*`, `tabs.label`, `search.placeholder`, `splitter.*`, `password.*`,
  `combobox.*`, and `tagInput.*`).
- Component attributes stay camelCase.
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
- Z ladder: sticky content `z-10`, drawer `z-20`, overlays `z-40`, dev tag
  `z-50` — keep overlays at or below `z-40` so the tag is never covered.
- Temporary scratch files (plans, proposals, notes) go in `.tmp/` (plans in
  `.tmp/plans/`), never in source directories. In-progress feature requirements
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
  cover the page.
- The playground executes arbitrary JavaScript in the page: it evaluates the
  compiler output with `new Function` after rewriting its imports to a whitelist
  of shared primitives. This is not a sandbox — the code still reaches page
  globals, storage, and `fetch` — so it is acceptable only for this local
  showcase and must never be handed app secrets, stores, or fetch wrappers.

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
- Icon-only `Button` uses uniform padding (`p-1.5` for `sm`, `p-2.5` for `md`);
  text buttons keep `px`/`py` distinction.
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
