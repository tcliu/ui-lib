import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPersistStore } from './persist-storage'

describe('createPersistStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('writes to the first prefix only', () => {
    createPersistStore('app:', 'legacy:').putItem('theme', 'dark')
    expect(localStorage.getItem('app:theme')).toBe('dark')
    expect(localStorage.getItem('legacy:theme')).toBeNull()
  })

  it('reads a fallback entry and migrates it to the primary prefix', () => {
    localStorage.setItem('legacy:theme', 'light')
    const store = createPersistStore('app:', 'legacy:')
    expect(store.getItem('theme')).toBe('light')
    expect(localStorage.getItem('app:theme')).toBe('light')
    expect(localStorage.getItem('legacy:theme')).toBeNull()
  })

  it('prefers its own prefix over a fallback', () => {
    localStorage.setItem('app:theme', 'dark')
    localStorage.setItem('legacy:theme', 'light')
    expect(createPersistStore('app:', 'legacy:').getItem('theme')).toBe('dark')
  })

  it('removes every prefix so a legacy entry cannot resurface', () => {
    localStorage.setItem('app:theme', 'dark')
    localStorage.setItem('legacy:theme', 'light')
    createPersistStore('app:', 'legacy:').removeItem('theme')
    expect(localStorage.getItem('app:theme')).toBeNull()
    expect(localStorage.getItem('legacy:theme')).toBeNull()
  })

  it('appends fallbacks without mutating the original store', () => {
    const base = createPersistStore('app:')
    const extended = base.addPrefixes('legacy:')
    expect(base.prefixes).toEqual(['app:'])
    expect(extended.prefixes).toEqual(['app:', 'legacy:'])
    localStorage.setItem('legacy:theme', 'light')
    // The original store knows only its own prefix, so it misses the legacy entry.
    expect(base.getItem('theme')).toBeNull()
    expect(extended.getItem('theme')).toBe('light')
    // After the migration the shared primary prefix holds it, so both stores see it.
    expect(base.getItem('theme')).toBe('light')
  })

  it('rejects an empty prefix chain', () => {
    expect(() => createPersistStore()).toThrow('at least one key prefix')
  })
})
