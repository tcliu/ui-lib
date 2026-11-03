import { describe, expect, it } from 'vitest'
import { STAGE_PANE, STAGE_ROW } from '#showcase/shell/resizable-stage.js'
import { staged } from '#showcase/playground/staged.js'
import { SPLITTER_MAIN, SPLITTER_PANE, SPLITTER_WRAPPER, buildSplitterSnippet, parseSplitterBound, splitterPreset, type SplitterSnippetState } from './demo-snippet'

const unset: SplitterSnippetState = { orientation: staged('', true), unit: staged('', true), ariaLabel: staged('', true), className: staged('', true), lineClass: staged('', true), invert: staged(''), min: staged('', true), max: staged('', true) }

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
    expect(source).not.toContain('className="')
    expect(source).not.toContain('lineClass="')
    expect(source).not.toContain('invert')
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
    const source = buildSplitterSnippet({ ...unset, orientation: staged('horizontal', true) })
    expect(source).toContain(`<div class="${SPLITTER_WRAPPER} flex-col">`)
    expect(source).toContain('orientation="horizontal"')
    expect(source).toContain('min={80}')
    expect(source).toContain('max={200}')
    expect(source).toContain('style={`height:${split}px`}')
  })

  it('emits the percent preset', () => {
    const source = buildSplitterSnippet({ ...unset, unit: staged('%', true) })
    expect(source).toContain('unit="%"')
    expect(source).toContain('min={20}')
    expect(source).toContain('max={80}')
    expect(source).toContain('style={`width:${split}%`}')
  })

  it('omits staged orientation and unit while their eyes are off', () => {
    const source = buildSplitterSnippet({ ...unset, orientation: staged('horizontal'), unit: staged('%') })
    expect(source).not.toContain('orientation=')
    expect(source).not.toContain('unit="%"')
  })

  it('escapes the aria label', () => {
    const source = buildSplitterSnippet({ ...unset, ariaLabel: staged('Resize "panel"', true) })
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

  it('emits class and line classes when set', () => {
    const source = buildSplitterSnippet({ ...unset, className: staged('handle-x', true), lineClass: staged('line-y', true) })
    expect(source).toContain('className="handle-x"')
    expect(source).toContain('lineClass="line-y"')
  })

  it('escapes class names', () => {
    const source = buildSplitterSnippet({ ...unset, className: staged('a"b', true) })
    expect(source).toContain('className="a&quot;b"')
  })

  it('emits the invert flag tri-state', () => {
    expect(buildSplitterSnippet({ ...unset, invert: staged('yes', true) })).toContain('\n        invert\n')
    expect(buildSplitterSnippet({ ...unset, invert: staged('') })).not.toContain('invert')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildSplitterSnippet({ ...unset, orientation: staged('vertical', true), unit: staged('px', true), invert: staged('no', true) })
    expect(source).not.toContain('orientation=')
    expect(source).not.toContain('unit=')
    expect(source).not.toContain('invert')
    // The required bounds still resolve to the vertical px preset.
    expect(source).toContain('min={120}')
    expect(source).toContain('max={320}')
  })

  it('falls back to the preset bounds while unset', () => {
    const source = buildSplitterSnippet(unset)
    expect(source).toContain('min={120}')
    expect(source).toContain('max={320}')
  })

  it('emits bound overrides when set', () => {
    const source = buildSplitterSnippet({ ...unset, min: staged('100', true), max: staged('400', true) })
    expect(source).toContain('min={100}')
    expect(source).toContain('max={400}')
  })

  it('ignores invalid bounds and keeps the preset', () => {
    const source = buildSplitterSnippet({ ...unset, min: staged('wide', true), max: staged('-40', true) })
    expect(source).toContain('min={120}')
    expect(source).toContain('max={320}')
  })

  it('omits the staged invert while its eye is off and emits it when on', () => {
    expect(buildSplitterSnippet({ ...unset, invert: staged('yes') })).not.toContain('invert')
    expect(buildSplitterSnippet({ ...unset, invert: staged('yes', true) })).toContain('\n        invert\n')
  })

  it('omits the staged bounds while their eyes are off', () => {
    const source = buildSplitterSnippet({ ...unset, min: staged('100'), max: staged('400') })
    expect(source).not.toContain('min=')
    expect(source).not.toContain('max=')
  })

  it('omits the staged labels while their eyes are off and emits them when on', () => {
    const off = buildSplitterSnippet({ ...unset, ariaLabel: staged('Resize'), className: staged('handle-x'), lineClass: staged('line-y') })
    expect(off).not.toContain('ariaLabel=')
    expect(off).not.toContain('className=')
    expect(off).not.toContain('lineClass=')
    const on = buildSplitterSnippet({ ...unset, ariaLabel: staged('Resize', true), className: staged('handle-x', true), lineClass: staged('line-y', true) })
    expect(on).toContain('ariaLabel="Resize"')
    expect(on).toContain('className="handle-x"')
    expect(on).toContain('lineClass="line-y"')
  })

  it('keeps the divider value scope-driven', () => {
    const source = buildSplitterSnippet({ ...unset, min: staged('100', true), max: staged('400', true) })
    expect(source).toContain('value={split}')
    expect(source).not.toContain('value={100}')
  })
})

describe('parseSplitterBound', () => {
  it('treats empty and non-numeric text as unset', () => {
    expect(parseSplitterBound('')).toBeNull()
    expect(parseSplitterBound('   ')).toBeNull()
    expect(parseSplitterBound('wide')).toBeNull()
    expect(parseSplitterBound('-40')).toBeNull()
  })

  it('parses non-negative numbers', () => {
    expect(parseSplitterBound('0')).toBe(0)
    expect(parseSplitterBound('240')).toBe(240)
    expect(parseSplitterBound('12.5')).toBe(12.5)
  })

  it('emits bounds as numeric expressions the number sync reads back', () => {
    const source = buildSplitterSnippet({ ...unset, min: staged('100', true), max: staged('400', true) })
    expect(source).toMatch(/min=\{\d+\}/)
    expect(source).toMatch(/max=\{\d+\}/)
  })
})
