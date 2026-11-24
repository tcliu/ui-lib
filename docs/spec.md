# Spec — UI Library

This document describes the behavioral contracts, API specs, and constraints.
For what the user sees and does, see `docs/design.md`; for how the code is
organized, see `ARCHITECTURE.md`; for how to write code in this project, see
`AGENTS.md`.

## Stack

- **Svelte 5** (runes) + **SvelteKit** (routing, server endpoints)
- **Tailwind CSS v4** (utility-first styling, theme via CSS variable overrides)
- **Vercel** deployment by default (`@sveltejs/adapter-vercel`, Node.js runtime),
  or **Cloudflare Workers** (`@sveltejs/adapter-cloudflare`, selected by `CF_WORKERS=1`
  / `npm run deploy -- --target cloudflare` on the existing Neon backend)

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_BASE_URL` | No (Vercel only) | — | Public URL the app is reachable at; the deploy points the Vercel production domain at its hostname |
| `VERCEL_PROJECT` | No | — | Vercel project slug used to auto-link an unlinked checkout |
| `CLOUDFLARE_PROJECT` | Cloudflare only | — | Worker name; the live URL is the Workers.dev host derived from it |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare only | — | Cloudflare account ID for the Pages/API steps |
| `DEV_TAG` | No | — | Worktree badge label (set in `.env.local` by `tools/create-worktree.mjs`) |
| `PROFILE` | No | — | Explicit `dev`/`prod` runtime profile. The scripts fall back to `dev` when it is unset; the `/api/info` card reports it as `null` in an app with no runtime profile |
| `SQLITE_PATH` | No | `.data/dev.sqlite` | Dev database file (SQLite) |
| `DATABASE_URL` | Prod only | — | Neon connection string; required when `PROFILE=prod` |
| `SCHEMA_NAME` | No | `public` | Postgres schema to create tables in |
| `SCHEMA_VERIFY_TABLES` | No | `app_meta` | Comma-separated tables `npm run schema:apply` must find after applying |
| `APP_ACTIVE` | No | `true` | `false` opts this instance out of catalog scans (`active` field of `GET /api/info`) |

The app declares the variables its server code reads in `src/env.ts` and imports
them from `$app/env/private`; a value that reaches server code needs its entry
there, since an undeclared variable reads as `undefined`.

## Schema

`sql/schema.sql` is the source of truth for the database schema. Apply it with
`npm run schema:apply`, which targets the dev SQLite file (`PROFILE=dev`) or
Neon (`PROFILE=prod`). Requests never run DDL.

Keep the file portable: `toSqliteSql` in `scripts/db-config.mjs` rewrites `$n`
placeholders, `bigserial`, and `current_timestamp` for the SQLite path, so use
only DDL both backends accept. Replace the placeholder `app_meta` table with
your domain tables and list them in `SCHEMA_VERIFY_TABLES`.

## API routes

### `GET /api/info`

Public, no auth. Returns this project's catalog self-card: a flat card
(`{ id, name, icon?, description?, branch?, repo?, status, url?, profile?, tags, active? }`)
that a catalog scanner reads to discover and identify the project. `id` and
`name` are required; `branch` is the runtime ref (worktree `DEV_TAG` in dev,
commit ref in production); `profile` is the app's runtime profile (the `PROFILE`
env var, `dev`/`prod`) and is absent in an app with no runtime profile; absent
fields normalize to `null`, a missing/unknown `status` defaults to `Active`,
and `active` defaults to `true` (`APP_ACTIVE=false` opts the instance out of
catalog scans). Responses carry `cache-control: no-store`.

Normalization lives in `src/lib/server/card.ts`. A project may also
answer with an envelope carrying the card under `self` (`{ ..., self: {...} }`);
consumers resolve `self` when present and the whole body otherwise. Keep that
module's shape identical across projects so any scanner can parse any of them.

### Other API routes

No POST routes exist. The only API route is `GET /api/info` above.

## Constraints

- Theme palettes live only in `src/lib/styles.css` (`[data-theme]` overrides of the
  Tailwind palette variables; `dark` is the default with no attribute)
- Z-index ladder: sticky `z-10`, drawer backdrop `z-30`, floating drawer and
  overlays `z-40`, dev tag `z-50`
- AppShell presentation follows one ruler: the shell container width against
  the 768px breakpoint (`auto` docks at/above, overlays below;
  `docked`/`floating` pin one behavior; rail always docks). No viewport
  breakpoint class takes part in pane layout, so measurement and layout agree
  at every width.

## Error handling

- Surface client-side failures through the shared toast (`svelte-sonner`); the
  only server route is `GET /api/info`, which returns no error payload, so there
  is no server-error wire contract.
- Log unexpected errors with enough context to reproduce; never surface raw
  technical detail as user-facing text.
