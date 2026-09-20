import { describe, expect, it } from 'vitest'
import { STACKED_CLASS, buildButtonsSnippet } from './demo-snippet'

describe('buildButtonsSnippet', () => {
  it('omits align and className while unset', () => {
    const source = buildButtonsSnippet({ align: '', className: '' })
    expect(source).toContain('<Buttons>')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('className=')
  })

  it('emits the chosen align', () => {
    const source = buildButtonsSnippet({ align: 'center', className: '' })
    expect(source).toContain('<Buttons align="center">')
  })

  it('drops align when className takes over', () => {
    const source = buildButtonsSnippet({ align: 'center', className: STACKED_CLASS })
    expect(source).not.toContain('align=')
    expect(source).toContain(`className="${STACKED_CLASS}"`)
  })

  it('emits the stacked class override', () => {
    const source = buildButtonsSnippet({ align: '', className: STACKED_CLASS })
    expect(source).toContain('className="flex flex-col items-start gap-1"')
  })
})
