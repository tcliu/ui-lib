# Spec — UI Library

This document describes the behavioral contracts, API specs, and constraints.
For what the user sees and does, see `docs/design.md`; for how the code is
organized, see `ARCHITECTURE.md`; for how to write code in this project, see
`AGENTS.md`.

## Stack

- **Svelte 5** (runes) + **SvelteKit** (routing, server endpoints)
- **Tailwind CSS v4** (utility-first styling, theme via CSS variable overrides)
- **Vercel** deployment (`@sveltejs/adapter-vercel`, Node.js runtime)

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_BASE_URL` | No | — | Public URL the app is reachable at |
| `DEV_TAG` | No | — | Worktree badge label (set in `.env.local` by `scripts/create-worktree.mjs`) |
| `PROFILE` | No | `dev` | Explicit `dev`/`prod` runtime profile; `NODE_ENV=production` also selects `prod` |
| `SQLITE_PATH` | No | `.data/ui-lib-dev.sqlite` | Dev database file (SQLite) |
| `DATABASE_URL` | Prod only | — | Neon connection string; required when `PROFILE=prod` |
| `SCHEMA_NAME` | No | `public` | Postgres schema to create tables in |
| `SCHEMA_VERIFY_TABLES` | No | `app_meta` | Comma-separated tables `npm run schema:apply` must find after applying |

## Schema

`sql/schema.sql` is the source of truth for the database schema. Apply it with
`npm run schema:apply`, which targets the dev SQLite file (`PROFILE=dev`) or
Neon (`PROFILE=prod`). Requests never run DDL.

Keep the file portable: `toSqliteSql` in `scripts/db-config.mjs` rewrites `$n`
placeholders, `bigserial`, and `current_timestamp` for the SQLite path, so use
only DDL both backends accept. Replace the placeholder `app_meta` table with
your domain tables and list them in `SCHEMA_VERIFY_TABLES`.

## API routes

### `GET /api/catalog`

Public, no auth. Returns this project's catalog self-card: a flat card
(`{ id, name, icon?, description?, branch?, repo?, status, url?, tags }`) that
a catalog scanner reads to discover and identify the project. `id` and `name`
are required; `branch` is the runtime ref (worktree `DEV_TAG` in dev, commit ref
on Vercel); absent fields normalize to `null`, and a missing/unknown `status`
defaults to `Active`. Responses carry `cache-control: no-store`.

Normalization lives in `src/lib/server/catalog-card.ts`. A project may also
answer with an envelope carrying the card under `self` (`{ ..., self: {...} }`);
consumers resolve `self` when present and the whole body otherwise. Keep that
module's shape identical across projects so any scanner can parse any of them.

### `POST /api/...`

Request/response contracts go here.

## Constraints

- Theme palettes live only in `src/styles.css`
- Component attributes stay camelCase
- Z-index ladder: sticky `z-10`, drawer `z-20`, overlays `z-40`, dev tag `z-50`

## Error handling

- Surface server failures as stable wire codes mapped to localized strings
- Never surface raw English literals or technical detail as user-facing errors
