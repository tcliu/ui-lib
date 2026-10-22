import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearColumnWidths, loadColumnWidths, saveColumnWidths } from './column-width-storage'

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
    saveColumnWidths('orders', [120, 200, 60])

    expect(store('orders')).toBe('[120,200,60]')
    expect(loadColumnWidths('orders')).toEqual([120, 200, 60])
    // Keys are namespaced, so another table never reads these widths.
    expect(loadColumnWidths('invoices')).toBeNull()
  })

  it('returns null when nothing was saved', () => {
    expect(loadColumnWidths('orders')).toBeNull()
  })

  it('rejects unparsable storage and reports the failure', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(PREFIX + 'orders', '{not json')

    expect(loadColumnWidths('orders')).toBeNull()
    expect(error).toHaveBeenCalledWith('Failed to load column widths from localStorage', {
      key: 'orders',
      error: expect.any(SyntaxError),
    })
  })

  it('rejects a payload that is not an array', () => {
    localStorage.setItem(PREFIX + 'orders', '{"0": 120}')

    expect(loadColumnWidths('orders')).toBeNull()
  })

  it('drops entries that are not widths', () => {
    localStorage.setItem(PREFIX + 'orders', '[120, "wide", null, 200]')

    expect(loadColumnWidths('orders')).toEqual([120, 200])
  })

  it('clamps a negative or non-finite width to the fallback', () => {
    localStorage.setItem(PREFIX + 'orders', '[-40, 120]')
    expect(loadColumnWidths('orders')).toEqual([DEFAULT_WIDTH, 120])

    saveColumnWidths('invoices', [Number.NaN, Number.POSITIVE_INFINITY, 90])
    expect(loadColumnWidths('invoices')).toEqual([DEFAULT_WIDTH, DEFAULT_WIDTH, 90])
  })

  it('saves whole pixels', () => {
    saveColumnWidths('orders', [120.4, 199.6])

    expect(store('orders')).toBe('[120,200]')
  })

  it('clears only the requested key', () => {
    saveColumnWidths('orders', [120])
    saveColumnWidths('invoices', [200])

    clearColumnWidths('orders')

    expect(loadColumnWidths('orders')).toBeNull()
    expect(loadColumnWidths('invoices')).toEqual([200])
  })
})
