import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The server has no shared fallback store: every call must build a fresh one,
// or two concurrent requests would share a locale.
vi.mock('$app/environment', () => ({ browser: false }))

import { flushSync, mount, unmount } from 'svelte'
import Harness from './i18n.harness.svelte'
import { createAppI18n, setDefaultI18nStore, type I18nStore } from './i18n.svelte'

let mounted: { instance: ReturnType<typeof mount>; target: HTMLDivElement }[] = []

/** Read the provider-less fallback store through a component. */
function readFallback(): I18nStore {
  let read: I18nStore | null = null
  const target = document.createElement('div')
  document.body.appendChild(target)
  const instance = mount(Harness, {
    target,
    props: { store: createAppI18n(), provide: false, onRead: (store: I18nStore) => (read = store) },
  })
  flushSync()
  mounted.push({ instance, target })
  if (!read) throw new Error('the harness did not read a store')
  return read
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  setDefaultI18nStore(() => createAppI18n())
})

afterEach(async () => {
  for (const { instance, target } of mounted) {
    await unmount(instance)
    target.remove()
  }
  mounted = []
  vi.restoreAllMocks()
})

describe('the server fallback store', () => {
  it('builds a fresh store per call, so requests cannot share a locale', () => {
    const first = readFallback()
    const second = readFallback()
    expect(first).not.toBe(second)

    first.setLocale('zh-CN')
    expect(first.locale).toBe('zh-CN')
    expect(second.locale).toBe('en')
  })
})
