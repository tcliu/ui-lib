import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildDateRangePickerSnippet } from './demo-snippet'

describe('buildDateRangePickerSnippet', () => {
  it('seeds the range as script-local state inside the resizable stage', () => {
    const source = buildDateRangePickerSnippet({ from: '', to: '' })
    expect(source).toContain('<Resizable')
    expect(source).toContain('width={stageWidth}')
    expect(source).not.toContain('stageHeight')
    expect(source).toContain('let from = $state("")')
    expect(source).toContain('let to = $state("")')
    expect(source).toContain('from={from}')
    expect(source).toContain('to={to}')
  })

  it('seeds literal dates as valid script state', () => {
    const source = buildDateRangePickerSnippet({ from: '2026-09-01', to: '2026-09-19' })
    expect(source).toContain('let from = $state("2026-09-01")')
    expect(source).toContain('let to = $state("2026-09-19")')
  })

  it('compiles the generated stage snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildDateRangePickerSnippet({ from: '', to: '' }), {})
    expect(typeof component).toBe('function')
  })
})
