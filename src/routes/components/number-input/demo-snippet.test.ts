import { describe, expect, it } from 'vitest'
import { STEPLESS_CLASS, buildNumberInputSnippet } from './demo-snippet'

describe('buildNumberInputSnippet', () => {
  it('omits numeric bounds and flags while unset', () => {
    const source = buildNumberInputSnippet({
      min: '',
      max: '',
      step: '',
      placeholder: '',
      disabled: '',
      showControls: '',
      className: '',
    })
    expect(source).toContain('<NumberInput bind:value ariaLabel={applyLabel}')
    expect(source).not.toContain('min=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('showControls=')
    expect(source).not.toContain('className=')
  })

  it('emits bounds, placeholder, disabled, and the stepless treatment', () => {
    const source = buildNumberInputSnippet({
      min: '0',
      max: '10',
      step: '0.5',
      placeholder: '0',
      disabled: 'yes',
      showControls: 'no',
      className: STEPLESS_CLASS,
    })
    expect(source).toContain('min={0}')
    expect(source).toContain('max={10}')
    expect(source).toContain('step={0.5}')
    expect(source).toContain('placeholder="0"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('showControls={false}')
    expect(source).toContain('className="w-24 px-3 py-2 text-sm"')
  })

  it('ignores non-numeric bounds', () => {
    const source = buildNumberInputSnippet({
      min: 'abc',
      max: '',
      step: '',
      placeholder: '',
      disabled: '',
      showControls: '',
      className: '',
    })
    expect(source).not.toContain('min=')
  })
})
