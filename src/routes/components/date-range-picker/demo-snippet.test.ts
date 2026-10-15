import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildDateRangePickerSnippet } from './demo-snippet'

describe('buildDateRangePickerSnippet', () => {
  it('emits content-only markup and omits unset overrides', () => {
    const source = buildDateRangePickerSnippet({ from: '', to: '' })
    // The resize harness is ShowcasePage-owned chrome, never in the snippet.
    expect(source).not.toContain('<Resizable')
    expect(source).not.toContain('stageWidth')
    expect(source).toContain('let from = $state("")')
    expect(source).toContain('let to = $state("")')
    expect(source).toContain('from={from}')
    expect(source).toContain('to={to}')
    expect(source).toContain('onFrom={value => (from = value)}')
    expect(source).toContain('onTo={value => (to = value)}')
  })

  it('seeds literal dates as valid script state', () => {
    const source = buildDateRangePickerSnippet({ from: '2026-09-01', to: '2026-09-19' })
    expect(source).toContain('let from = $state("2026-09-01")')
    expect(source).toContain('let to = $state("2026-09-19")')
  })

  it('omits component defaults (the Value column prefills the empty range)', () => {
    const source = buildDateRangePickerSnippet({ from: '', to: '' })
    expect(source).toContain('let from = $state("")')
    expect(source).toContain('let to = $state("")')
    expect(source).not.toContain('theme=')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildDateRangePickerSnippet({ from: '', to: '' }), {})
    expect(typeof component).toBe('function')
  })
})
