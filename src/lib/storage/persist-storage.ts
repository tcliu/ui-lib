/**
 * A keyed `localStorage` store with an ordered prefix chain. The first prefix is
 * the write target; later prefixes are read-only fallbacks left by an earlier
 * key scheme. Reading a fallback migrates the entry to the primary prefix, and
 * removing clears every prefix, so a legacy entry never resurfaces.
 *
 * The store is synchronous and environment-guarded: outside a browser (SSR, the
 * build) reads return `null` and writes are no-ops.
 */
export interface PersistStore {
  /** Write prefix first, read fallbacks after it. */
  readonly prefixes: readonly string[]
  /** Append read fallbacks, returning a new store; the write target is unchanged. */
  addPrefixes(...prefixes: string[]): PersistStore
  getItem(key: string): string | null
  putItem(key: string, value: string): void
  removeItem(key: string): void
}

function uniquePrefixes(prefixes: string[]): string[] {
  return [...new Set(prefixes.filter(prefix => prefix.length > 0))]
}

export function createPersistStore(...prefixes: string[]): PersistStore {
  const chain = uniquePrefixes(prefixes)
  if (chain.length === 0) {
    throw new Error('createPersistStore needs at least one key prefix')
  }
  const [primary, ...fallbacks] = chain

  return {
    prefixes: chain,
    addPrefixes(...next) {
      return createPersistStore(...chain, ...next)
    },
    getItem(key) {
      try {
        if (typeof localStorage === 'undefined') return null
        const own = localStorage.getItem(primary + key)
        if (own !== null) return own
        for (const prefix of fallbacks) {
          const legacy = localStorage.getItem(prefix + key)
          if (legacy === null) continue
          localStorage.setItem(primary + key, legacy)
          for (const stale of fallbacks) localStorage.removeItem(stale + key)
          return legacy
        }
        return null
      } catch (error) {
        console.error('Failed to read a persisted value', { key, error })
        return null
      }
    },
    putItem(key, value) {
      try {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(primary + key, value)
      } catch (error) {
        console.error('Failed to persist a value', { key, error })
      }
    },
    removeItem(key) {
      try {
        if (typeof localStorage === 'undefined') return
        for (const prefix of chain) localStorage.removeItem(prefix + key)
      } catch (error) {
        console.error('Failed to remove a persisted value', { key, error })
      }
    },
  }
}
