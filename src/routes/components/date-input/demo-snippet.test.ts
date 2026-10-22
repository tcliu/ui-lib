import { describe, expect, it } from 'vitest'
import { DEFAULT_DATE_FORMAT } from '$lib/components/date-input-core'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildDateInputSnippet } from './demo-snippet'

const base = {
  value: '',
  from: '',
  to: '',
  range: '' as const,
  time: '' as const,
  format: '',
  formatOn: false,
  placeholder: '',
  placeholderOn: false,
  closeOnSelect: '' as const,
  highlightRange: '' as const,
  size: '',
  sizeOn: false,
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
    expect(source).not.toContain('format=')
  })

  it('seeds literal dates as valid script state', () => {
    expect(buildDateInputSnippet({ ...base, value: '2026-09-19' })).toContain('let value = $state("2026-09-19")')
    const range = buildDateInputSnippet({ ...base, range: 'yes', from: '2026-09-01', to: '2026-09-19' })
    expect(range).toContain('let from = $state("2026-09-01")')
    expect(range).toContain('let to = $state("2026-09-19")')
  })

  it('renders the range pair only while range is on, with an explicit off', () => {
    const single = buildDateInputSnippet(base)
    expect(single).not.toContain('from={from}')
    expect(single).not.toContain('range={false}')

    const off = buildDateInputSnippet({ ...base, range: 'no' })
    expect(off).toContain('range={false}')
    expect(off).toContain('value={value}')

    const pair = buildDateInputSnippet({ ...base, range: 'yes' })
    expect(pair).toContain('  range')
    expect(pair).toContain('from={from}')
    expect(pair).toContain('to={to}')
    expect(pair).toContain('onFrom={next => (from = next)}')
    expect(pair).toContain('onTo={next => (to = next)}')
    expect(pair).not.toContain('value={value}')
  })

  it('emits the time flag in both forms', () => {
    expect(buildDateInputSnippet({ ...base, time: 'yes' })).toContain('  time')
    expect(buildDateInputSnippet({ ...base, time: 'no' })).toContain('time={false}')
    expect(buildDateInputSnippet({ ...base, time: '' })).not.toContain('time')
    expect(buildDateInputSnippet({ ...base, range: 'yes', time: 'yes' })).toContain('  time')
  })

  it('emits closeOnSelect only when overridden', () => {
    expect(buildDateInputSnippet({ ...base, closeOnSelect: 'yes' })).toContain('  closeOnSelect')
    expect(buildDateInputSnippet({ ...base, closeOnSelect: 'no' })).toContain('closeOnSelect={false}')
    expect(buildDateInputSnippet({ ...base, closeOnSelect: '' })).not.toContain('closeOnSelect')
    expect(buildDateInputSnippet({ ...base, range: 'yes', closeOnSelect: 'no' })).toContain('closeOnSelect={false}')
  })

  it('emits the range highlight flag in both forms', () => {
    expect(buildDateInputSnippet({ ...base, highlightRange: 'yes' })).toContain('  highlightRange')
    expect(buildDateInputSnippet({ ...base, highlightRange: 'no' })).toContain('highlightRange={false}')
    expect(buildDateInputSnippet({ ...base, highlightRange: '' })).not.toContain('highlightRange')
    expect(buildDateInputSnippet({ ...base, range: 'yes', highlightRange: 'yes' })).toContain('  highlightRange')
  })

  it('emits a non-default size and omits the md default', () => {
    expect(buildDateInputSnippet({ ...base, size: 'lg', sizeOn: true })).toContain(' size="lg"')
    expect(buildDateInputSnippet({ ...base, size: '18', sizeOn: true })).toContain(' size={18}')
    expect(buildDateInputSnippet({ ...base, size: 'md', sizeOn: true })).not.toContain('size=')
    expect(buildDateInputSnippet({ ...base, size: 'lg', sizeOn: false })).not.toContain('size=')
  })

  it('emits a non-default format and omits the default', () => {
    expect(buildDateInputSnippet({ ...base, format: 'MMM D, YYYY', formatOn: true })).toContain(' format="MMM D, YYYY"')
    expect(buildDateInputSnippet({ ...base, format: DEFAULT_DATE_FORMAT, formatOn: true })).not.toContain('format=')
    expect(buildDateInputSnippet({ ...base, format: 'MMM D, YYYY', formatOn: false })).not.toContain('format=')
  })

  it('emits a placeholder only for the single field', () => {
    expect(buildDateInputSnippet({ ...base, placeholder: 'Pick a day', placeholderOn: true })).toContain(' placeholder="Pick a day"')
    expect(buildDateInputSnippet({ ...base, placeholder: 'Pick a day', placeholderOn: false })).not.toContain('placeholder=')
    expect(buildDateInputSnippet({ ...base, placeholder: '', placeholderOn: true })).not.toContain('placeholder=')
    // A range pair names its own ends, so the single-field prompt never rides it.
    expect(buildDateInputSnippet({ ...base, range: 'yes', placeholder: 'Pick a day', placeholderOn: true })).not.toContain('placeholder=')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildDateInputSnippet(base), {})
    expect(typeof component).toBe('function')
    const pair = await createSnippetComponent(buildDateInputSnippet({ ...base, range: 'yes' }), {})
    expect(typeof pair).toBe('function')
  })
})
