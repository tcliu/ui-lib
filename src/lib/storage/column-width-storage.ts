// Column widths persist per table in localStorage. The module is shared: a
// caller supplies key prefixes (most specific first) and the canonical prefix
// stays the last fallback, so a standalone app needs no configuration.
import { createPersistStore } from './persist-storage'

const DEFAULT_STORAGE_KEY_PREFIX = 'ui-lib:column-widths:'
const DEFAULT_WIDTH = 128

/** The column-width surface: parsed widths over a prefixed persist store. */
export interface ColumnWidthStore {
  /** Write prefix first, read fallbacks after it. */
  readonly prefixes: readonly string[]
  /** Append read fallbacks, returning a new store; the write target is unchanged. */
  addPrefixes(...prefixes: string[]): ColumnWidthStore
  load(key: string): number[] | null
  save(key: string, widths: number[]): void
  clear(key: string): void
}

function clampWidths(widths: number[]): number[] {
  return widths.map(w => {
    if (!Number.isFinite(w) || w < 0) {
      return DEFAULT_WIDTH
    }
    return Math.round(w)
  })
}

function parse(raw: string): number[] | null {
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) return null
  return clampWidths(parsed.filter((w): w is number => typeof w === 'number'))
}

/**
 * The column-width store. The first prefix is the write target, later ones are
 * read fallbacks; the canonical prefix is always the last fallback.
 */
export function useColumnWidthStorage(prefixes: string[] = []): ColumnWidthStore {
  const store = createPersistStore(...prefixes, DEFAULT_STORAGE_KEY_PREFIX)
  return {
    prefixes: store.prefixes,
    addPrefixes(...next) {
      return useColumnWidthStorage([...prefixes, ...next])
    },
    load(key) {
      const raw = store.getItem(key)
      if (raw === null) return null
      try {
        return parse(raw)
      } catch (error) {
        console.error('Failed to load column widths from localStorage', { key, error })
        return null
      }
    },
    save(key, widths) {
      store.putItem(key, JSON.stringify(clampWidths(widths)))
    },
    clear(key) {
      store.removeItem(key)
    },
  }
}
