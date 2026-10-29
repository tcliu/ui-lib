import { fileURLToPath } from 'node:url'

import adapterCloudflare from '@sveltejs/adapter-cloudflare'
import adapterVercel from '@sveltejs/adapter-vercel'

// Second deploy target: `CF_PAGES=1` selects the Cloudflare Pages adapter,
// otherwise the Vercel adapter stays the default. Deploys run through
// `scripts/deploy.mjs --target cloudflare` on the existing Neon backend.
const useCloudflare = process.env.CF_PAGES === '1'

// `svelte-package` reads top-level aliases, while SvelteKit only accepts them
// under `kit`; the package script sets PACKAGE=1 so each tool sees the config
// it expects.
const packaging = process.env.PACKAGE === '1'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  ...(packaging
    ? {
        alias: {
          $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
          '$app/environment': fileURLToPath(new URL('./src/lib/app-environment', import.meta.url)),
        },
      }
    : {}),
  kit: {
    alias: {
      $showcase: fileURLToPath(new URL('./src/showcase', import.meta.url)),
      $appLib: fileURLToPath(new URL('./src/app', import.meta.url)),
    },
    adapter: useCloudflare ? adapterCloudflare() : adapterVercel({ runtime: 'nodejs24.x' }),
  },
}

export default config
