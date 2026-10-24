import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useColumnWidthStorage } from './column-width-storage'

const PREFIX = 'ui-lib:column-widths:'
// The module's fallback for a width it cannot use: one fixed column width.
const DEFAULT_WIDTH = 128

function store(key: string): string | null {
  return localStorage.getItem(PREFIX + key)
}

describe('column-width-storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('round-trips saved widths per key', () => {
    useColumnWidthStorage().save('orders', [120, 200, 60])

    expect(store('orders')).toBe('[120,200,60]')
    expect(useColumnWidthStorage().load('orders')).toEqual([120, 200, 60])
    // Keys are namespaced, so another table never reads these widths.
    expect(useColumnWidthStorage().load('invoices')).toBeNull()
  })

  it('returns null when nothing was saved', () => {
    expect(useColumnWidthStorage().load('orders')).toBeNull()
  })

  it('rejects unparsable storage and reports the failure', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(PREFIX + 'orders', '{not json')

    expect(useColumnWidthStorage().load('orders')).toBeNull()
    expect(error).toHaveBeenCalledWith('Failed to load column widths from localStorage', {
      key: 'orders',
      error: expect.any(SyntaxError),
    })
  })

  it('rejects a payload that is not an array', () => {
    localStorage.setItem(PREFIX + 'orders', '{"0": 120}')

    expect(useColumnWidthStorage().load('orders')).toBeNull()
  })

  it('drops entries that are not widths', () => {
    localStorage.setItem(PREFIX + 'orders', '[120, "wide", null, 200]')

    expect(useColumnWidthStorage().load('orders')).toEqual([120, 200])
  })

  it('clamps a negative or non-finite width to the fallback', () => {
    localStorage.setItem(PREFIX + 'orders', '[-40, 120]')
    expect(useColumnWidthStorage().load('orders')).toEqual([DEFAULT_WIDTH, 120])

    useColumnWidthStorage().save('invoices', [Number.NaN, Number.POSITIVE_INFINITY, 90])
    expect(useColumnWidthStorage().load('invoices')).toEqual([DEFAULT_WIDTH, DEFAULT_WIDTH, 90])
  })

  it('saves whole pixels', () => {
    useColumnWidthStorage().save('orders', [120.4, 199.6])

    expect(store('orders')).toBe('[120,200]')
  })

  it('clears only the requested key', () => {
    useColumnWidthStorage().save('orders', [120])
    useColumnWidthStorage().save('invoices', [200])

    useColumnWidthStorage().clear('orders')

    expect(useColumnWidthStorage().load('orders')).toBeNull()
    expect(useColumnWidthStorage().load('invoices')).toEqual([200])
  })
})

describe('column-width prefixes', () => {
  beforeEach(() => localStorage.clear())

  it('writes to the first configured prefix and falls back to the canonical one', () => {
    useColumnWidthStorage(['app:column-widths:']).save('grid', [40, 60])
    expect(localStorage.getItem('app:column-widths:grid')).not.toBeNull()
    expect(localStorage.getItem('ui-lib:column-widths:grid')).toBeNull()
  })

  it('reads the first existing entry and migrates it to the primary prefix', () => {
    localStorage.setItem('ui-lib:column-widths:grid', JSON.stringify([30, 70]))
    expect(useColumnWidthStorage(['app:column-widths:']).load('grid')).toEqual([30, 70])
    expect(localStorage.getItem('app:column-widths:grid')).not.toBeNull()
    expect(localStorage.getItem('ui-lib:column-widths:grid')).toBeNull()
  })

  it('clears every prefix so a legacy entry cannot resurface', () => {
    localStorage.setItem('app:column-widths:grid', JSON.stringify([10, 90]))
    localStorage.setItem('ui-lib:column-widths:grid', JSON.stringify([20, 80]))
    useColumnWidthStorage(['app:column-widths:']).clear('grid')
    expect(localStorage.getItem('app:column-widths:grid')).toBeNull()
    expect(localStorage.getItem('ui-lib:column-widths:grid')).toBeNull()
  })
})

describe('useColumnWidthStorage', () => {
  beforeEach(() => localStorage.clear())

  it('stores parsed widths under the passed prefix', () => {
    const store = useColumnWidthStorage(['app:column-widths:'])
    store.save('grid', [40, 60])
    expect(JSON.parse(localStorage.getItem('app:column-widths:grid') ?? 'null')).toEqual([40, 60])
    expect(store.load('grid')).toEqual([40, 60])
    expect(store.load('missing')).toBeNull()
  })

  it('clamps and drops invalid widths', () => {
    const store = useColumnWidthStorage()
    store.save('grid', [40.4, -1, Number.NaN])
    expect(store.load('grid')).toEqual([40, 128, 128])
  })

  it('returns a new store from addPrefixes and clears every prefix', () => {
    const base = useColumnWidthStorage(['app:column-widths:'])
    const extended = base.addPrefixes('legacy:column-widths:')
    expect(base.prefixes).toEqual(['app:column-widths:', 'ui-lib:column-widths:'])
    expect(extended.prefixes[1]).toBe('legacy:column-widths:')
    localStorage.setItem('legacy:column-widths:grid', JSON.stringify([20, 80]))
    expect(extended.load('grid')).toEqual([20, 80])
    extended.clear('grid')
    expect(localStorage.getItem('app:column-widths:grid')).toBeNull()
    expect(localStorage.getItem('legacy:column-widths:grid')).toBeNull()
    expect(localStorage.getItem('ui-lib:column-widths:grid')).toBeNull()
  })
})
