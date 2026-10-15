import { describe, expect, it } from 'vitest'
import { STYLED_CLASS, buildTooltipSnippet } from './demo-snippet'

describe('buildTooltipSnippet', () => {
  it('omits align and class while unset', () => {
    const source = buildTooltipSnippet({ label: '', align: '', alignOn: false, className: '', classNameOn: false })
    expect(source).toContain('<Tooltip trigger={explicitTrigger}>{applyLabel}</Tooltip>')
  })

  it('emits the chosen align', () => {
    const source = buildTooltipSnippet({ label: '', align: 'left', alignOn: true, className: '', classNameOn: false })
    expect(source).toContain('<Tooltip trigger={explicitTrigger} align="left">{applyLabel}</Tooltip>')
  })

  it('emits a custom label as a script-local', () => {
    const source = buildTooltipSnippet({ label: 'Save now', align: '', alignOn: false, className: '', classNameOn: false })
    expect(source).toContain('let label = $state("Save now")')
    expect(source).toContain('<Tooltip trigger={explicitTrigger}>{label}</Tooltip>')
    expect(source).not.toContain('{applyLabel}')
  })

  it('omits the component default (the Value column prefills it)', () => {
    const source = buildTooltipSnippet({ label: '', align: 'center', alignOn: true, className: '', classNameOn: false })
    expect(source).toContain('<Tooltip trigger={explicitTrigger}>{applyLabel}</Tooltip>')
    expect(source).not.toContain('align=')
  })

  it('emits the styled class', () => {
    const source = buildTooltipSnippet({ label: '', align: '', alignOn: false, className: STYLED_CLASS, classNameOn: true })
    expect(source).toContain('className="border-cyan-500/40 text-cyan-200"')
  })

  it('omits the staged class while its eye is off and emits it when on', () => {
    const off = buildTooltipSnippet({ label: '', align: '', alignOn: false, className: STYLED_CLASS, classNameOn: false })
    expect(off).not.toContain('className=')
    const on = buildTooltipSnippet({ label: '', align: '', alignOn: false, className: STYLED_CLASS, classNameOn: true })
    expect(on).toContain('className="border-cyan-500/40 text-cyan-200"')
  })

  it('omits the staged align while its eye is off', () => {
    const off = buildTooltipSnippet({ label: '', align: 'left', alignOn: false, className: '', classNameOn: false })
    expect(off).not.toContain('align=')
  })
})
