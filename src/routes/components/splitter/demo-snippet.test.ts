import { describe, expect, it } from 'vitest'
import { STAGE_PANE, STAGE_ROW } from '$lib/showcase/resizable-stage'
import { SPLITTER_MAIN, SPLITTER_PANE, SPLITTER_WRAPPER, buildSplitterSnippet, splitterPreset } from './demo-snippet'

const unset = { orientation: '', unit: '', ariaLabel: '' } as const

describe('buildSplitterSnippet', () => {
  it('renders the bounded stage while unset', () => {
    const source = buildSplitterSnippet(unset)
    expect(source).toContain(`<div class="${SPLITTER_WRAPPER}">`)
    expect(source).not.toContain('flex-col')
    // The demo Splitter omits orientation/unit/ariaLabel while unset, so only
    // its overrides must be absent.
    expect(source).not.toContain('orientation="horizontal"')
    expect(source).not.toContain('unit="px"')
    expect(source).not.toContain('ariaLabel="')
  })

  it('seeds local state so the live splitter is draggable', () => {
    const source = buildSplitterSnippet(unset)
    expect(source).toContain('  let split = $state(initialSplit)')
    expect(source).toContain('value={split}')
    expect(source).toContain('onChange={next => (split = next)}')
  })

  it('emits the vertical px preset', () => {
    const source = buildSplitterSnippet(unset)
    expect(source).toContain('min={120}')
    expect(source).toContain('max={320}')
    expect(source).toContain('style={`width:${split}px`}')
  })

  it('emits a horizontal split with the top/bottom preset', () => {
    const source = buildSplitterSnippet({ orientation: 'horizontal', unit: '', ariaLabel: '' })
    expect(source).toContain(`<div class="${SPLITTER_WRAPPER} flex-col">`)
    expect(source).toContain('orientation="horizontal"')
    expect(source).toContain('min={80}')
    expect(source).toContain('max={200}')
    expect(source).toContain('style={`height:${split}px`}')
  })

  it('emits the percent preset', () => {
    const source = buildSplitterSnippet({ orientation: '', unit: '%', ariaLabel: '' })
    expect(source).toContain('unit="%"')
    expect(source).toContain('min={20}')
    expect(source).toContain('max={80}')
    expect(source).toContain('style={`width:${split}%`}')
  })

  it('escapes the aria label', () => {
    const source = buildSplitterSnippet({ orientation: '', unit: '', ariaLabel: 'Resize "panel"' })
    expect(source).toContain('ariaLabel="Resize &quot;panel&quot;"')
  })

  it('keeps the pane classes literal', () => {
    const source = buildSplitterSnippet(unset)
    expect(source).toContain(SPLITTER_PANE)
    expect(source).toContain(SPLITTER_MAIN)
  })

  it('wraps the stage in the handle-less static container the page renders', () => {
    const source = buildSplitterSnippet(unset)
    expect(source).toContain(`<div class="${STAGE_ROW}">`)
    expect(source).toContain(`<div class="${STAGE_PANE} w-full">`)
    expect(source).not.toContain('stageWidth')
    expect(source).not.toContain('value={stageWidth}')
    expect(source).not.toContain('ariaLabel={resizeLabel}')
  })

  it('matches the preset helper', () => {
    expect(splitterPreset('vertical', 'px')).toEqual({ min: 120, max: 320, value: 160 })
    expect(splitterPreset('horizontal', 'px')).toEqual({ min: 80, max: 200, value: 120 })
    expect(splitterPreset('vertical', '%')).toEqual({ min: 20, max: 80, value: 40 })
  })
})
