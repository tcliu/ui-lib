import { describe, expect, it } from 'vitest'
import { STYLED_CLASS, buildTooltipSnippet } from './demo-snippet'

describe('buildTooltipSnippet', () => {
  it('omits align and class while unset', () => {
    const source = buildTooltipSnippet({ align: '', className: '' })
    expect(source).toContain('<Tooltip trigger={explicitTrigger}>{applyLabel}</Tooltip>')
  })

  it('emits the chosen align', () => {
    const source = buildTooltipSnippet({ align: 'left', className: '' })
    expect(source).toContain('<Tooltip trigger={explicitTrigger} align="left">{applyLabel}</Tooltip>')
  })

  it('emits the styled class', () => {
    const source = buildTooltipSnippet({ align: '', className: STYLED_CLASS })
    expect(source).toContain('class="border-cyan-500/40 text-cyan-200"')
  })
})
