import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './i18n.harness.svelte'
import { createAppI18n, createI18nStore, setDefaultI18nStore, type I18nStore } from './i18n.svelte'

// The fallback registration lives on the global symbol registry, not in this
// module: that is what lets the app's copy and the package's copy agree. The
// tests clear it so each case starts from the default factory.
const FALLBACK_KEY = Symbol.for('ui-lib:i18n-fallback')
const GLOBAL = globalThis as unknown as Record<symbol, unknown>

const dictionaries = {
  en: { greet: { hello: 'Hello {name}', bye: 'Bye' } },
  fr: { greet: { hello: 'Bonjour {name}' } },
}
type Key = 'greet.hello' | 'greet.bye'
type TestLocale = 'en' | 'fr'

function makeStore() {
  return createI18nStore<Key, TestLocale>(dictionaries, 'en', null)
}

let mounted: { instance: ReturnType<typeof mount>; target: HTMLDivElement }[] = []

/** Mount the harness and return the store it read through the context. */
function readContext(store: I18nStore, provide = true): { current: I18nStore | null } {
  const holder: { current: I18nStore | null } = { current: null }
  const target = document.createElement('div')
  document.body.appendChild(target)
  const instance = mount(Harness, {
    target,
    props: { store, provide, onRead: (read: I18nStore) => (holder.current = read) },
  })
  flushSync()
  mounted.push({ instance, target })
  return holder
}

beforeEach(() => {
  delete GLOBAL[FALLBACK_KEY]
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(async () => {
  for (const { instance, target } of mounted) {
    await unmount(instance)
    target.remove()
  }
  mounted = []
  vi.restoreAllMocks()
})

describe('createI18nStore', () => {
  it('resolves a dotted key, interpolates params, and falls back to the default locale', () => {
    const store = makeStore()
    expect(store.t('greet.hello', { name: 'Ada' })).toBe('Hello Ada')

    store.setLocale('fr')
    expect(store.locale).toBe('fr')
    expect(store.t('greet.hello', { name: 'Ada' })).toBe('Bonjour Ada')
    // A key the locale does not define falls back to the default locale.
    expect(store.t('greet.bye')).toBe('Bye')
    // An unknown key renders as itself rather than an empty string.
    expect(store.t('greet.missing' as Key)).toBe('greet.missing')
  })
})

describe('the i18n context', () => {
  it('hands a child the store its provider set', () => {
    const store = createAppI18n()
    const read = readContext(store)
    expect(read.current).toBe(store)
  })

  it('falls back to the registered factory outside a provider and replaces its cache on re-registration', () => {
    const first = createAppI18n()
    const second = createAppI18n()

    setDefaultI18nStore(() => first)
    expect(readContext(createAppI18n(), false).current).toBe(first)

    // A later registration must invalidate the cached fallback, not keep the
    // first store for the rest of the session.
    setDefaultI18nStore(() => second)
    expect(readContext(createAppI18n(), false).current).toBe(second)
  })

  it('registers the factory on the global symbol registry', () => {
    const factory = () => createAppI18n()
    setDefaultI18nStore(factory)
    // A second copy of this module reads the same global entry, which is the
    // whole reason the key is a registered symbol.
    expect(GLOBAL[FALLBACK_KEY]).toBe(factory)
  })
})
