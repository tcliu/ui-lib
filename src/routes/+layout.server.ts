import { env } from '$env/dynamic/private'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async () => {
  const devTag = (env.DEV_TAG || '').trim()
  return { devTag: devTag || null }
}
