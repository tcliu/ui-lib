import { defineEnvVars } from '@sveltejs/kit/env'

// Every runtime value here is optional on purpose: a checkout that sets none of
// them keeps the app's defaults (no dev badge, no explicit profile) instead of
// failing at startup. Values pass through untouched — each reader trims — so a
// blank entry keeps behaving like an absent one.
const optional = (value: string | undefined) => value

// Declared once so server code reads them from `$app/env/private`. SvelteKit 3
// turned `$env/dynamic/private` into a deprecated alias for that module, which
// only carries the variables declared here; an undeclared read is `undefined`.
export const variables = defineEnvVars({
  DEV_TAG: {
    schema: optional,
    description: 'Worktree badge label; the dev `branch` of the /api/info card.',
  },
  VERCEL_GIT_COMMIT_REF: {
    schema: optional,
    description: 'Commit ref supplied by Vercel; the /api/info `branch` on a deployment.',
  },
  PROFILE: {
    schema: optional,
    description: 'Runtime profile (`dev` or `prod`); the /api/info card `profile`.',
  },
  APP_ACTIVE: {
    schema: optional,
    description: '`false` opts this instance out of catalog scans (the /api/info `active`).',
  },
})
