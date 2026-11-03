# UI Library

A responsive component-showcase web app cataloguing the shared Svelte 5
primitives in `src/lib/components/` — one showcase route per component with a
live Show-code playground. For what the user sees see `docs/design.md`, for
contracts see `docs/spec.md`, for code organization see `ARCHITECTURE.md`.

## Setup

- Build the browser app at the project root; the web UI stack and component patterns stay in this repo.
- `npm run check`, `npm run build`, `npm test` are the verification gates (see `AGENTS.md`).

```bash
npm install
npm run dev        # dev server (Vite, host-exposed)
```

- `npm run e2e` runs the Playwright specs against a running or freshly started
  server; `npm run test:coverage` measures unit coverage.

## The npm package

The shared surface in `src/lib` is also the npm package `@codepg/ui-lib`; the
root `package.json` carries its name, `exports` and `files`.

```bash
npm install @codepg/ui-lib
```

Svelte `^5.57` is a peer dependency. Import the stylesheet once in the app
shell, after Tailwind's own import, so the consumer's Tailwind also scans the
package's compiled files:

```css
@import 'tailwindcss';
@import '@codepg/ui-lib/styles.css';
```

Components and icons import by path (`@codepg/ui-lib/components/Button.svelte`,
`@codepg/ui-lib/icons/CheckIcon.svelte`); the package entry
(`@codepg/ui-lib`) carries the i18n store and the size/persistence helpers. The
package is consumed through a bundler: its compiled modules keep the source's
extensionless relative imports.

```bash
npm run package         # compile + prune + publint
npm run publish:check   # verify the package and build a scratch consumer
```

`dist/` is gitignored. A consuming app installs `@codepg/ui-lib` and imports
the components by name; the app's own i18n dictionary merges over the shared
one. See `ARCHITECTURE.md` for the surface, the aliases and the exports map.
`publish:check` installs the packed tarball into a scratch app, so it needs
registry access; `npm run package` alone is offline.

### Releasing

Bump the version, then publish the package:

```bash
npm version patch       # or minor / major
npm publish             # prepublishOnly checks credentials, then runs publish:check
```

`npm publish` does not bump or diff against the registry; npm rejects a version
that is already published. The `prepublishOnly` hook first runs
`tools/check-publish-auth.mjs`, which fails in a second when the target registry
has no usable credentials instead of after the full gate, then runs
`publish:check`. A dry run and `SKIP_PUBLISH_AUTH_CHECK=1` skip that probe.

### Publishing locally

A local registry rehearses the real publish path — `npm publish` → registry →
consumer install — without an npm account:

```bash
npx verdaccio --config <config> --listen 4873   # the registry
npm run publish:local
```

`publish:local` builds the package and publishes it with `npm publish
--registry http://localhost:4873/ --tag latest --ignore-scripts`: the tarball
carries only `dist/` (plus the manifest, README and license), and the explicit
tag keeps a rehearsal working once the registry already holds a higher version.
`--ignore-scripts` skips the `prepublishOnly` gate, since the rehearsal already
built the package and a real publish runs the full check.

The consumer then installs it like any published package
(`"@codepg/ui-lib": "^0.1.0"`). Two consequences: a registry never accepts the
same version twice, so every shared-surface change needs a new version; and the
consumer's lockfile pins the registry's URL, so it is a local artifact until
the package is published for real.

## Environment variables

`.env.example` is the single example file documenting all knobs; it is never
loaded. Copy it to `.env` (git-ignored) to override locally — Vite loads
`.env` automatically during `npm run dev` — and create `.env.vercel`
(git-ignored) for the values to push to Vercel. Every setting is optional:
the app ships sensible defaults in code.

## Deployment (Vercel)

The app ships with `@sveltejs/adapter-vercel` (Node.js runtime) and is ready to
deploy to Vercel. Deploy plugins and targets are selected by the committed
`deploy.config.json` at the repo root, so the shared deploy modules stay
app-agnostic; edit that file to change which plugins/targets run.

1. Install the Vercel CLI and log in:

   ```bash
   npx vercel login
   ```

2. Link the repo to your Vercel project once:

   ```bash
   npx vercel link
   ```

   Or skip the manual step: set `VERCEL_PROJECT=<slug>` in `.env.vercel`
   (or pass `npm run deploy -- --project <slug>`). The deploy auto-links an
   unlinked checkout — prompting when the name is unknown and saving the
   answer to `.env.vercel` before syncing env — creating the remote project
   when it does not exist yet. Updating the slug and redeploying switches
   the link interactively after confirmation; a non-interactive run requires
   an explicit `--project <name>` to opt in.

3. Push environment variables (optional):

   Create `.env.vercel` (git-ignored; see `.env.example` for the documented
   knobs) with at least:

   ```bash
   APP_BASE_URL=https://<your-alias>.vercel.app
   ```

   then sync it to Vercel:

   ```bash
   npm run env:sync:vercel
   ```

   By default this only upserts the vars from `.env.vercel` and leaves any
   other project env vars untouched. Pass `--prune` to also remove vars that
   are no longer present in that file.

4. Deploy:

   ```bash
   npm run deploy -- --sync-env
   ```

    This starts a production deploy, streams the Vercel upload/build logs,
    waits for the deployment to reach `READY`, and points the project's
    production domain at `APP_BASE_URL` (resolved from the shell env, then
    `.env.vercel`, then `.env`). Stale `<project>.vercel.app` aliases are
    removed so only the configured domain remains.

`vercel.json` sets the SvelteKit framework with `npm run build`.

## Deployment (Cloudflare Pages)

Second target on the existing Neon backend: `CF_PAGES=1` selects
`@sveltejs/adapter-cloudflare` (see `vite.config.ts`).

```bash
npm run deploy -- --target cloudflare
```

Cloudflare-only values live in the git-ignored `.env.cloudflare`
(`CLOUDFLARE_PROJECT`, `CLOUDFLARE_ACCOUNT_ID`), overlaid on `.env.prod`;
sync with `npm run env:sync:cloudflare`. The live URL is the Pages
production hostname derived from `CLOUDFLARE_PROJECT` — no `APP_BASE_URL`
exists on this target. See `.env.example` for all knobs.
