import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { normalizeCatalogCard } from '$lib/server/catalog-card';

const NO_STORE = { 'cache-control': 'no-store, max-age=0' };

export async function GET(): Promise<Response> {
  // Self-card for project discovery: this project's own props, carried the same
  // way every managed project carries theirs, so a catalog scanner (and
  // scripts/find-running-apps.mjs) can identify a running dev server. Branch is
  // the runtime ref, not a static prop: worktree tag in dev, commit ref on Vercel.
  const branch = (env.DEV_TAG || env.VERCEL_GIT_COMMIT_REF || '').trim() || null;
  return json(
    normalizeCatalogCard({
      id: 'ui-lib',
      name: 'UI Library',
      branch,
    }),
    { headers: NO_STORE },
  );
}
