import { describe, expect, it } from 'vitest'
import { buildButtonSnippet } from './demo-snippet'

describe('buildButtonSnippet', () => {
  it('omits every option while unset', () => {
    const source = buildButtonSnippet({
      variant: '',
      accent: '',
      size: '',
      disabled: '',
      pending: '',
      icon: '',
      badge: '',
      className: '',
    })
    expect(source).toContain('<Button')
    expect(source).toContain('onClick={() => (clicks += 1)}>{label} ({clicks})')
    expect(source).not.toContain('variant=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('icon=')
    expect(source).not.toContain('className=')
  })

  it('emits variant, accent, size, flags, icon, badge, and className', () => {
    const source = buildButtonSnippet({
      variant: 'primary',
      accent: 'emerald',
      size: 'sm',
      disabled: 'no',
      pending: 'yes',
      icon: 'yes',
      badge: 'new',
      className: 'ml-2',
    })
    expect(source).toContain('variant="primary"')
    expect(source).toContain('accent="emerald"')
    expect(source).toContain('size="sm"')
    expect(source).toContain('disabled={false}')
    expect(source).toContain('  pending\n')
    expect(source).toContain('icon={checkIcon}')
    expect(source).toContain('badge="new"')
    expect(source).toContain('className="ml-2"')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    const numeric = buildButtonSnippet({
      variant: '',
      accent: '',
      size: '14',
      disabled: '',
      pending: '',
      icon: '',
      badge: '',
      className: '',
    })
    expect(numeric).toContain('size={14}')
    const invalid = buildButtonSnippet({
      variant: '',
      accent: '',
      size: 'huge',
      disabled: '',
      pending: '',
      icon: '',
      badge: '',
      className: '',
    })
    expect(invalid).not.toContain('size=')
  })
})
