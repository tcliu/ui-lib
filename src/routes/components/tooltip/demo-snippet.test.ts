import { describe, expect, it } from 'vitest'
import { staged } from '#showcase/playground/staged.js'
import { STYLED_CLASS, buildTooltipSnippet } from './demo-snippet'

// The curated props this builder reads, all eyes off and no label.
const IDLE = { label: staged(''), align: staged(''), className: staged(''), size: staged('') }

describe('buildTooltipSnippet', () => {
  it('omits align and class while unset', () => {
    const source = buildTooltipSnippet(IDLE)
    expect(source).toContain('<Tooltip trigger={explicitTrigger}>{applyLabel}</Tooltip>')
  })

  it('emits the chosen align', () => {
    const source = buildTooltipSnippet({ ...IDLE, align: staged('left', true) })
    expect(source).toContain('<Tooltip trigger={explicitTrigger} align="left">{applyLabel}</Tooltip>')
  })

  it('emits a custom label as a script-local', () => {
    const source = buildTooltipSnippet({ ...IDLE, label: staged('Save now') })
    expect(source).toContain('let label = $state("Save now")')
    expect(source).toContain('<Tooltip trigger={explicitTrigger}>{label}</Tooltip>')
    expect(source).not.toContain('{applyLabel}')
  })

  it('omits the component default (the Value column prefills it)', () => {
    const source = buildTooltipSnippet({ ...IDLE, align: staged('center', true) })
    expect(source).toContain('<Tooltip trigger={explicitTrigger}>{applyLabel}</Tooltip>')
    expect(source).not.toContain('align=')
  })

  it('emits the styled class', () => {
    const source = buildTooltipSnippet({ ...IDLE, className: staged(STYLED_CLASS, true) })
    expect(source).toContain('className="border-cyan-500/40 text-cyan-200"')
  })

  it('emits a named size step and a pixel number', () => {
    expect(buildTooltipSnippet({ ...IDLE, size: staged('lg', true) })).toContain(' size="lg"')
    expect(buildTooltipSnippet({ ...IDLE, size: staged('22', true) })).toContain(' size={22}')
  })

  it('omits the size default and a size while its eye is off', () => {
    expect(buildTooltipSnippet({ ...IDLE, size: staged('md', true) })).not.toContain('size=')
    expect(buildTooltipSnippet({ ...IDLE, size: staged('lg') })).not.toContain('size=')
  })

  it('omits the staged class while its eye is off and emits it when on', () => {
    const off = buildTooltipSnippet({ ...IDLE, className: staged(STYLED_CLASS) })
    expect(off).not.toContain('className=')
    const on = buildTooltipSnippet({ ...IDLE, className: staged(STYLED_CLASS, true) })
    expect(on).toContain('className="border-cyan-500/40 text-cyan-200"')
  })

  it('omits the staged align while its eye is off', () => {
    const off = buildTooltipSnippet({ ...IDLE, align: staged('left') })
    expect(off).not.toContain('align=')
  })
})
