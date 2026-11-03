import { describe, expect, it } from 'vitest'
import { DEFAULT_DATE_FORMAT } from '$lib/components/date-input-core'
import { createSnippetComponent } from '$showcase/playground/snippet-playground'
import type { TriState } from '$showcase/playground/snippet-build'
import { staged } from '$showcase/playground/staged'
import { buildDateInputSnippet } from './demo-snippet'

const base = {
  value: staged(''),
  from: staged(''),
  to: staged(''),
  range: staged('' as TriState),
  time: staged('' as TriState),
  format: staged(''),
  placeholder: staged(''),
  closeOnSelect: staged('' as TriState),
  highlightRange: staged('' as TriState),
  size: staged(''),
  ratios: staged({}),
}

describe('buildDateInputSnippet', () => {
  it('emits content-only markup with a seeded value', () => {
    const source = buildDateInputSnippet(base)
    // The resize harness is ShowcasePage-owned chrome, never in the snippet.
    expect(source).not.toContain('<Resizable')
    expect(source).not.toContain('stageWidth')
    expect(source).toContain('let value = $state("")')
    expect(source).toContain('value={value}')
    expect(source).toContain('onChange={next => (value = next)}')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('ratios=')
    expect(source).not.toContain('format=')
  })

  it('seeds literal dates as valid script state', () => {
    expect(buildDateInputSnippet({ ...base, value: staged('2026-09-19') })).toContain('let value = $state("2026-09-19")')
    const range = buildDateInputSnippet({ ...base, range: staged('yes', true), from: staged('2026-09-01'), to: staged('2026-09-19') })
    expect(range).toContain('let from = $state("2026-09-01")')
    expect(range).toContain('let to = $state("2026-09-19")')
  })

  it('renders the range pair only while range is on, with an explicit off', () => {
    const single = buildDateInputSnippet(base)
    expect(single).not.toContain('from={from}')
    expect(single).not.toContain('range={false}')

    const off = buildDateInputSnippet({ ...base, range: staged('no', true) })
    expect(off).toContain('range={false}')
    expect(off).toContain('value={value}')

    const pair = buildDateInputSnippet({ ...base, range: staged('yes', true) })
    expect(pair).toContain('  range')
    expect(pair).toContain('from={from}')
    expect(pair).toContain('to={to}')
    expect(pair).toContain('onFrom={next => (from = next)}')
    expect(pair).toContain('onTo={next => (to = next)}')
    expect(pair).not.toContain('value={value}')
  })

  it('emits the time flag in both forms', () => {
    expect(buildDateInputSnippet({ ...base, time: staged('yes', true) })).toContain('  time')
    expect(buildDateInputSnippet({ ...base, time: staged('no', true) })).toContain('time={false}')
    expect(buildDateInputSnippet({ ...base, time: staged('') })).not.toContain('time')
    expect(buildDateInputSnippet({ ...base, range: staged('yes', true), time: staged('yes', true) })).toContain('  time')
  })

  it('emits closeOnSelect only when overridden', () => {
    expect(buildDateInputSnippet({ ...base, closeOnSelect: staged('yes', true) })).toContain('  closeOnSelect')
    expect(buildDateInputSnippet({ ...base, closeOnSelect: staged('no', true) })).toContain('closeOnSelect={false}')
    expect(buildDateInputSnippet({ ...base, closeOnSelect: staged('') })).not.toContain('closeOnSelect')
    expect(buildDateInputSnippet({ ...base, range: staged('yes', true), closeOnSelect: staged('no', true) })).toContain('closeOnSelect={false}')
  })

  it('emits the range highlight flag in both forms', () => {
    expect(buildDateInputSnippet({ ...base, highlightRange: staged('yes', true) })).toContain('  highlightRange')
    expect(buildDateInputSnippet({ ...base, highlightRange: staged('no', true) })).toContain('highlightRange={false}')
    expect(buildDateInputSnippet({ ...base, highlightRange: staged('') })).not.toContain('highlightRange')
    expect(buildDateInputSnippet({ ...base, range: staged('yes', true), highlightRange: staged('yes', true) })).toContain('  highlightRange')
  })

  it('emits a non-default size and omits the md default', () => {
    expect(buildDateInputSnippet({ ...base, size: staged('lg', true) })).toContain(' size="lg"')
    expect(buildDateInputSnippet({ ...base, size: staged('18', true) })).toContain(' size={18}')
    expect(buildDateInputSnippet({ ...base, size: staged('md', true) })).not.toContain('size=')
    expect(buildDateInputSnippet({ ...base, size: staged('lg', false) })).not.toContain('size=')
  })

  it('emits a non-default format and omits the default', () => {
    expect(buildDateInputSnippet({ ...base, format: staged('MMM D, YYYY', true) })).toContain(' format="MMM D, YYYY"')
    expect(buildDateInputSnippet({ ...base, format: staged(DEFAULT_DATE_FORMAT, true) })).not.toContain('format=')
    expect(buildDateInputSnippet({ ...base, format: staged('MMM D, YYYY', false) })).not.toContain('format=')
  })

  it('emits a placeholder only for the single field', () => {
    expect(buildDateInputSnippet({ ...base, placeholder: staged('Pick a day', true) })).toContain(' placeholder="Pick a day"')
    expect(buildDateInputSnippet({ ...base, placeholder: staged('Pick a day', false) })).not.toContain('placeholder=')
    expect(buildDateInputSnippet({ ...base, placeholder: staged('', true) })).not.toContain('placeholder=')
    // A range pair names its own ends, so the single-field prompt never rides it.
    expect(buildDateInputSnippet({ ...base, range: staged('yes', true), placeholder: staged('Pick a day', true) })).not.toContain('placeholder=')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildDateInputSnippet(base), {})
    expect(typeof component).toBe('function')
    const pair = await createSnippetComponent(buildDateInputSnippet({ ...base, range: staged('yes', true) }), {})
    expect(typeof pair).toBe('function')
  })
})

describe('DateInput ratios snippet', () => {
  it('emits a partial override while its eye is on', () => {
    expect(
      buildDateInputSnippet({ ...base, ratios: staged({ padX: 0.75 }, true) }),
    ).toContain('ratios={{"padX":0.75}}')
  })
})
