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
│   │   ├── +layout.svelte        # App shell: top bar (theme/language menus) + dev tag
│   │   ├── +layout.server.ts     # Passes the DEV_TAG env to the layout
│   │   ├── +page.ts              # Redirects / to the first showcase component
│   │   ├── components/
│   │   │   ├── +layout.svelte    # Two-pane showcase: searchable list + splitter
│   │   │   └── <slug>/+page.svelte # One showcase page per component
│   │   └── api/
│   │       └── info/+server.ts    # GET /api/info — project self-card for discovery
│   └── lib/
│       ├── components/           # Presentational UI components (seeded from the reference)
│       ├── actions/              # Shared interaction helpers (type-ahead, option match, list key-nav)
│       ├── server/
│       │   └── card.ts   # Shared card contract (normalize + resolve)
│       └── use-*.svelte.ts       # Composable factories (domain state, added per feature)
├── scripts/
│   ├── deploy.mjs                # Deploy entry (availability/preflight -> interview -> plugin pipeline)
│   ├── deploy.config.mjs         # Deploy plugin + required-env selection (project-owned)
│   ├── _deploy/                  # Pipeline core + backend selection + targets/{vercel,cloudflare} + plugins
│   ├── sync-vercel-env.mjs       # Push .env.vercel values to the Vercel project
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

1. **`src/routes/+layout.svelte`** — the app shell. Read this first to see the
   top bar (theme/language menus) and how `src/routes/components/+layout.svelte`
   hosts the two-pane showcase.

2. **Composable factories** (`src/lib/use-*.svelte.ts`) — own all domain
   state; added as features land. They are the only place where cross-domain
   coordination happens.

## Layering

The app follows a strict dependency direction:

```
Route (+page.svelte)
  │  wires
  ▼
Composable factories (use-*.svelte.ts)
  │  own state, call
  ▼
Engines / clients
  │  call
  ▼
Server endpoints (+server.ts)
```

- **Routes** are thin orchestration — they instantiate composables and bind
  them to components. They contain no domain logic.
- **Composables** own reactive state and orchestrate engines. They are the
  only place where cross-domain coordination happens.
- **Engines/clients** are non-reactive modules that perform work.
- **Server endpoints** handle HTTP concerns (validation, rate limiting,
  caching headers).

## Key patterns

- **Composable factories** — `useXxx()` functions returning reactive state
  via Svelte 5 runes. Each owns one domain concern. They accept dependencies
  as arguments to avoid circular imports.
- **Shared listbox interactions** — the dropdown surfaces build on one set of
  helpers in `src/lib/actions/`: `typeahead.ts` (native type-ahead; Shift
  reverses), `option-index.ts` (lowercased option index, match test, and
  matched-label split), `listbox-keynav.ts` (modified-key test plus
  flush-on-move), and `use-active-highlight.svelte.ts` (O(1) per-row highlight
  flags). SelectDropdown and ChipDropdown build on the full set; Menu uses the
  type-ahead helper.
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
  container squeezes the pane instead of clipping or overlapping it. Rail
  collapse docks while wide and floats as an open-or-closed overlay (no rail
  strip) below the breakpoint. Both panes share one per-side controller
  (`use-app-shell-drawer.svelte.ts`). Nested shells publish an `AppShellNesting`
  context callback and visibility-hide their own floating panes (kept mounted,
  `open` preserved) while an ancestor overlay is open, so an outer overlay
  always covers an inner one.
