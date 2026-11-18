import { DEV_TAG } from '$app/env/private'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async () => {
  const devTag = (DEV_TAG || '').trim()
  return { devTag: devTag || null }
}
