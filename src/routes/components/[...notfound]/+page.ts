import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

// Catch every unmatched `/components/<slug>` so the segment's error boundary
// renders the localized not-found state instead of the default error page.
export const load: PageLoad = () => {
  throw error(404, 'Unknown showcase component')
}
