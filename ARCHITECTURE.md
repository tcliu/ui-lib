# Architecture — UI Library

This document describes how the code is organized so you can navigate and
trace behavior quickly. For what the system does and the contracts it obeys,
see `docs/spec.md`; for what the user sees and does, see `docs/design.md`;
for how to write code in this project, see `AGENTS.md`.

## Stack

- **Svelte 5** (runes) + **SvelteKit** (routing, server endpoints)
- **Tailwind CSS v4** (utility-first styling, theme via CSS variable overrides)
- **Vercel** deployment (`@sveltejs/adapter-vercel`, Node.js runtime)

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
│   │       └── catalog/+server.ts # GET /api/catalog — project self-card for discovery
│   └── lib/
│       ├── components/           # Presentational UI components (seeded from the reference)
│       ├── server/
│       │   └── catalog-card.ts   # Shared catalog-card contract (normalize + resolve)
│       └── use-*.svelte.ts       # Composable factories (domain state, added per feature)
├── scripts/
│   ├── deploy.mjs                # Production deploy to Vercel
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
- **Thin routes** — `+page.svelte` is mostly declarative markup; all logic
  lives in composables and `page/` helpers.
- **Theme system** — themes are CSS variable overrides in `src/styles.css`
  under `[data-theme='…']`. A pre-paint inline script in `app.html` applies
  the stored theme before first paint.
