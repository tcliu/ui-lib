import { describe, expect, it } from 'vitest'
import { buildDateRangePickerSnippet } from './demo-snippet'

describe('buildDateRangePickerSnippet', () => {
  it('binds scope state while unset', () => {
    const source = buildDateRangePickerSnippet({ from: '', to: '' })
    expect(source).toContain('from={from}')
    expect(source).toContain('to={to}')
    expect(source).toContain('onFrom={value => (from = value)}')
    expect(source).toContain('onTo={value => (to = value)}')
  })

  it('emits literal dates when set', () => {
    const source = buildDateRangePickerSnippet({ from: '2026-09-01', to: '2026-09-19' })
    expect(source).toContain('from={"2026-09-01"}')
    expect(source).toContain('to={"2026-09-19"}')
  })
})
