import { describe, expect, it } from 'vitest'
import {
  APP_SHELL_DEFAULT_WIDTH,
  APP_SHELL_MAX_WIDTH,
  APP_SHELL_MIN_WIDTH,
  APP_SHELL_RAIL_WIDTH,
  APP_SHELL_SIZE_RATIOS,
  clampPaneWidth,
  collapsesToRail,
  combineNestingOverlay,
  loadPaneSize,
  resolveDrawerFloating,
  savePaneSize,
  shouldSuppressFloatingPane,
} from './app-shell'
import { SIZE_PX, type SizeInput } from './size-scale'

// The component resolves the ratios through `dimensionMetrics`; mirroring that
// one multiplication here keeps the anchors the component must reproduce.
function shellMetrics(size: SizeInput): Record<string, number> {
  const dimension = typeof size === 'number' ? size : SIZE_PX[size]
  return Object.fromEntries(Object.entries(APP_SHELL_SIZE_RATIOS).map(([key, ratio]) => [key, dimension * ratio]))
}

describe('APP_SHELL_SIZE_RATIOS', () => {
  it('reproduces the pre-size chrome at md', () => {
    expect(shellMetrics('md')).toEqual({ pad: 12, gap: 16, titleGap: 8, title: 18 })
  })

  it('scales every metric from one dimension', () => {
    expect(shellMetrics('lg')).toEqual({ pad: 13.5, gap: 18, titleGap: 9, title: 20.25 })
    expect(shellMetrics(20)).toEqual({ pad: 15, gap: 20, titleGap: 10, title: 22.5 })
  })
})

describe('clampPaneWidth', () => {
  it('rounds and clamps into range', () => {
    expect(clampPaneWidth(200.6, APP_SHELL_MIN_WIDTH, APP_SHELL_MAX_WIDTH, APP_SHELL_DEFAULT_WIDTH)).toBe(201)
    expect(clampPaneWidth(50, APP_SHELL_MIN_WIDTH, APP_SHELL_MAX_WIDTH, APP_SHELL_DEFAULT_WIDTH)).toBe(
      APP_SHELL_MIN_WIDTH,
    )
    expect(clampPaneWidth(900, APP_SHELL_MIN_WIDTH, APP_SHELL_MAX_WIDTH, APP_SHELL_DEFAULT_WIDTH)).toBe(
      APP_SHELL_MAX_WIDTH,
    )
  })

  it('falls back on non-finite input', () => {
    expect(clampPaneWidth(Number.NaN, APP_SHELL_MIN_WIDTH, APP_SHELL_MAX_WIDTH, APP_SHELL_DEFAULT_WIDTH)).toBe(
      APP_SHELL_DEFAULT_WIDTH,
    )
  })
})

describe('collapsesToRail', () => {
  it('collapses at or below the rail width', () => {
    expect(collapsesToRail(APP_SHELL_RAIL_WIDTH, APP_SHELL_RAIL_WIDTH)).toBe(true)
    expect(collapsesToRail(APP_SHELL_RAIL_WIDTH + 1, APP_SHELL_RAIL_WIDTH)).toBe(false)
  })
})

describe('resolveDrawerFloating', () => {
  it('pins explicit modes regardless of layout', () => {
    expect(resolveDrawerFloating('docked', false)).toBe(false)
    expect(resolveDrawerFloating('docked', true)).toBe(false)
    expect(resolveDrawerFloating('floating', false)).toBe(true)
    expect(resolveDrawerFloating('floating', true)).toBe(true)
  })

  it('floats below the desktop breakpoint in auto mode', () => {
    expect(resolveDrawerFloating('auto', false)).toBe(true)
    expect(resolveDrawerFloating('auto', true)).toBe(false)
  })
})

describe('shouldSuppressFloatingPane', () => {
  it('suppresses only a floating pane under an open ancestor overlay', () => {
    expect(shouldSuppressFloatingPane(true, true)).toBe(true)
    expect(shouldSuppressFloatingPane(true, false)).toBe(false)
    expect(shouldSuppressFloatingPane(false, true)).toBe(false)
    expect(shouldSuppressFloatingPane(false, false)).toBe(false)
  })
})

describe('combineNestingOverlay', () => {
  it('publishes self or ancestor openness so suppression chains', () => {
    expect(combineNestingOverlay(false, false)).toBe(false)
    expect(combineNestingOverlay(true, false)).toBe(true)
    expect(combineNestingOverlay(false, true)).toBe(true)
    expect(combineNestingOverlay(true, true)).toBe(true)
  })
})

describe('pane persistence without a storage key', () => {
  it('loads the fallback and never touches storage', () => {
    expect(loadPaneSize(undefined, APP_SHELL_DEFAULT_WIDTH, APP_SHELL_MIN_WIDTH, APP_SHELL_MAX_WIDTH)).toBe(
      APP_SHELL_DEFAULT_WIDTH,
    )
  })

  it('saves as a no-op without a storage key', () => {
    expect(() => savePaneSize(undefined, 300)).not.toThrow()
  })
})
