# @codepg/ui-lib

The shared UI surface for Svelte 5 apps: components, icons, actions, the i18n
store, and the size and persistence helpers. Each component imports by its own
path, and every sized control scales from one `size` prop.

## Requirements

- Svelte `^5.57` (a peer dependency)
- Tailwind CSS v4 (a peer dependency; the stylesheet ships Tailwind source, not
  compiled CSS)

## Install

```bash
npm install @codepg/ui-lib
```

Import the stylesheet once in the app shell, after Tailwind's own import, so the
consumer's Tailwind also scans the package's compiled files:

```css
@import 'tailwindcss';
@import '@codepg/ui-lib/styles.css';
```

## Imports

Components and icons import by path, so a bundle only carries what it uses:

```svelte
<script lang="ts">
  import Button from '@codepg/ui-lib/components/Button.svelte'
  import CheckIcon from '@codepg/ui-lib/icons/CheckIcon.svelte'
  import { SIZE_PX, resolveFontPx } from '@codepg/ui-lib'
</script>
```

The package entry (`@codepg/ui-lib`) carries the i18n store and the size and
persistence helpers:

- `SIZE_PX`, `SIZE_ORDER`, `resolveFontPx`, `ICON_RATIO`, `FONT_RATIO` and the
  `SizeInput`/`SizeName` types — the shared `xs`–`xl` size axis.
- `createPersistStore` — a keyed `localStorage` store with an ordered prefix
  chain (first prefix writes, later ones migrate on read, removal clears all).
- `useColumnWidthStorage` — parsed column widths over that store.

The package is consumed through a bundler: its compiled modules keep the
source's extensionless relative imports.

### Editor

`CodeEditor` and `LazyCodeEditor` are the only components with optional
dependencies. The CodeMirror packages are declared as optional peer
dependencies, so an app that does not render the editor installs none of them;
an app that does installs what it needs:

```bash
npm install @codemirror/autocomplete @codemirror/commands @codemirror/lang-html \
  @codemirror/lang-javascript @codemirror/lang-json @codemirror/lang-markdown \
  @codemirror/lang-xml @codemirror/lang-yaml @codemirror/language \
  @codemirror/search @codemirror/state @codemirror/view \
  @uiw/codemirror-theme-github
```

The theme package needs `@babel/runtime`; the package depends on it, so the
theme resolves without installing it yourself.

## i18n

Labels resolve from a shared dictionary and a locale store. A consuming app
merges its own dictionary over the shared one and sets the store through
`setI18nContext`; for a component rendered outside the provider tree (a test, an
island) it registers its store factory with `setDefaultI18nStore`. An app's
locale dictionaries must define the shared keys.

```ts
import { createI18nStore, setI18nContext } from '@codepg/ui-lib'

setI18nContext(createI18nStore({ en, fr }, 'en', 'app:locale'))
```

The context key comes from the global symbol registry, so the app's copy and the
package's copy name the same context.

## Theming

Themes are `[data-theme]` overrides of the Tailwind palette variables in
`@codepg/ui-lib/styles.css`; no per-component theme conditionals. Ink on vivid
accent fills uses the fixed `text-onaccent` token.

## Versioning

Releases follow semantic versioning, and every published version has an entry
in the `CHANGELOG.md` the package ships. The version is the contract: a breaking
component or export change is a major bump.

## Working on this repository

The project root hosts both the package and the showcase web app that
catalogues it: the shared source stays in `src/lib`, and one route per component
gives a live Show-code playground. User-facing behavior is documented in
`docs/design.md`, contracts in `docs/spec.md`, and code organization in
`ARCHITECTURE.md`.

```bash
npm install
npm run dev        # dev server (Vite, host-exposed)
```

`npm run check`, `npm run build` and `npm test` are the verification gates (see
`AGENTS.md`). `npm run e2e` runs the Playwright specs against a running or
freshly started server; `npm run test:coverage` measures unit coverage.

```bash
npm run package         # compile + prune + publint
npm run publish:check   # verify the package and build a scratch consumer
```

`dist/` is gitignored. `publish:check` installs the packed tarball into a
scratch app, so it needs registry access; `npm run package` alone is offline.

### Releasing

Write the changelog entry for the version you are about to publish, bump the
manifest to that version, then publish:

```bash
# 1. rename the `## [Unreleased]` section in CHANGELOG.md to `## [x.y.z] - date`
npm version x.y.z       # or: npm version patch | minor | major
npm publish             # prepublishOnly checks credentials, then publish:check
```

The publish gate fails when the newest version entry does not match the
manifest version, so an untagged change cannot ship silently. `npm publish`
does not bump or diff against the registry; npm rejects a version that is
already published. The `prepublishOnly` hook first runs
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
carries only `dist/` (plus the manifest, README, changelog and license), and the
explicit tag keeps a rehearsal working once the registry already holds a higher
version. `--ignore-scripts` skips the `prepublishOnly` gate, since the rehearsal
already built the package and a real publish runs the full check.

Two consequences: a registry never accepts the same version twice, so every
shared-surface change needs a new version; and the consumer's lockfile pins the
registry's URL, so it is a local artifact until the package is published for
real.

## Deployment

The showcase app ships with `@sveltejs/adapter-vercel` (Node.js runtime) and
`@sveltejs/adapter-cloudflare` (`CF_PAGES=1` selects it in `vite.config.ts`).
Deploy plugins and targets are selected by the committed `deploy.config.json`,
so the shared deploy modules stay app-agnostic.

`.env.example` is the single example file documenting all knobs; it is never
loaded. Copy it to `.env` (git-ignored) to override locally — Vite loads `.env`
automatically during `npm run dev` — and create `.env.vercel` (git-ignored) for
the values to push to Vercel. Every setting is optional: the app ships sensible
defaults in code.

### Vercel

1. Install the Vercel CLI and log in: `npx vercel login`.
2. Link the repo once: `npx vercel link`, or set `VERCEL_PROJECT=<slug>` in
   `.env.vercel` (or pass `npm run deploy -- --project <slug>`) to auto-link an
   unlinked checkout, creating the remote project when it does not exist yet.
3. Sync environment variables (optional): create `.env.vercel` with at least
   `APP_BASE_URL=https://<your-alias>.vercel.app`, then run
   `npm run env:sync:vercel`. Pass `--prune` to also remove vars no longer in
   that file.
4. Deploy: `npm run deploy -- --sync-env`. This starts a production deploy,
   streams the build logs, waits for `READY`, and points the project's
   production domain at `APP_BASE_URL` (shell env, then `.env.vercel`, then
   `.env`), removing stale `<project>.vercel.app` aliases.

`vercel.json` sets the SvelteKit framework with `npm run build`.

### Cloudflare Pages

```bash
npm run deploy -- --target cloudflare
```

Cloudflare-only values live in the git-ignored `.env.cloudflare`
(`CLOUDFLARE_PROJECT`, `CLOUDFLARE_ACCOUNT_ID`), overlaid on `.env.prod`; sync
with `npm run env:sync:cloudflare`. The live URL is the Pages production
hostname derived from `CLOUDFLARE_PROJECT` — no `APP_BASE_URL` exists on this
target. See `.env.example` for all knobs.

## License

MIT
