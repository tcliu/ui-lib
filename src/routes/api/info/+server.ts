import { env } from '$env/dynamic/private'
import { normalizeCard } from '#lib/server/card.js'

const NO_STORE = { 'cache-control': 'no-store, max-age=0' }

export function GET(): Response {
  // Self-card for project discovery: this project's own props, carried the same
  // way every managed project carries theirs, so a catalog scanner (and
  // tools/find-running-apps.mjs) can identify a running dev server. Branch is
  // the runtime ref, not a static prop: worktree tag in dev, commit ref on Vercel.
  const branch = (env.DEV_TAG || env.VERCEL_GIT_COMMIT_REF || '').trim() || null
  return Response.json(
    normalizeCard({
      id: 'ui-lib',
      name: 'UI Library',
      branch,
      // Runtime profile authority: `PROFILE` (`dev`/`prod`), absent in apps with
      // no runtime profile (the card normalizes it to `null`).
      profile: env.PROFILE,
      // `APP_ACTIVE=false` opts this instance out of catalog scans.
      active: env.APP_ACTIVE,
    }),
    { headers: NO_STORE },
  )
}
