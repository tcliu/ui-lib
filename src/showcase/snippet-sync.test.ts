import { describe, expect, it, vi } from 'vitest'
import { syncFieldsOf, syncSnippetToState, type SyncField } from './snippet-sync'

function run(
  source: string,
  tag: string | null,
  fields: SyncField[],
): { writes: [string, unknown][]; done: number } {
  const writes: [string, unknown][] = []
  const onDone = vi.fn()
  const wired = fields.map(field => ({
    ...field,
    set: field.set ?? ((value: string) => writes.push([field.attr, value])),
    setJson: field.setJson ?? ((value: unknown) => writes.push([field.attr, value])),
  }))
  syncSnippetToState(source, { tag, fields: wired, onDone })
  return { writes, done: onDone.mock.calls.length }
}

const TAG = '<Widget size="sm" disabled count={3} />'

describe('syncSnippetToState', () => {
  it('syncs text literals and unsets absent attributes', () => {
    const { writes, done } = run(TAG, 'Widget', [
      { attr: 'size', kind: 'text' },
      { attr: 'missing', kind: 'text' },
    ])
    expect(writes).toEqual([
      ['size', 'sm'],
      ['missing', ''],
    ])
    expect(done).toBe(1)
  })

  it('skips custom expressions for text and tri', () => {
    const { writes } = run('<Widget size={dynamic} disabled={flag} />', 'Widget', [
      { attr: 'size', kind: 'text' },
      { attr: 'disabled', kind: 'tri' },
    ])
    expect(writes).toEqual([])
  })

  it('maps bare and boolean flags to tri-state', () => {
    const { writes } = run('<Widget disabled pending={false} />', 'Widget', [
      { attr: 'disabled', kind: 'tri' },
      { attr: 'pending', kind: 'tri' },
      { attr: 'absent', kind: 'tri' },
    ])
    expect(writes).toEqual([
      ['disabled', 'yes'],
      ['pending', 'no'],
      ['absent', ''],
    ])
  })

  it('syncs numeric expressions and skips custom ones', () => {
    const { writes } = run('<Widget rows={4} min={bound} max={-1.5} str="7" />', 'Widget', [
      { attr: 'rows', kind: 'number', pattern: /^\d+$/ },
      { attr: 'min', kind: 'number' },
      { attr: 'max', kind: 'number' },
      { attr: 'str', kind: 'number' },
      { attr: 'absent', kind: 'number' },
    ])
    expect(writes).toEqual([
      ['rows', '4'],
      ['max', '-1.5'],
      ['absent', ''],
    ])
  })

  it('treats scope refs as unset for scopeText and set for scopeFlag', () => {
    const { writes } = run('<Widget ariaLabel={applyLabel} icon={checkIcon} />', 'Widget', [
      { attr: 'ariaLabel', kind: 'scopeText', scopeRef: 'applyLabel' },
      { attr: 'icon', kind: 'scopeFlag', scopeRef: 'checkIcon' },
      { attr: 'other', kind: 'scopeFlag', scopeRef: 'checkIcon' },
    ])
    expect(writes).toEqual([
      ['ariaLabel', ''],
      ['icon', 'yes'],
      ['other', ''],
    ])
  })

  it('sets scopeText literals and skips foreign expressions', () => {
    const { writes } = run('<Widget ariaLabel="Hi" other={label} />', 'Widget', [
      { attr: 'ariaLabel', kind: 'scopeText', scopeRef: 'applyLabel' },
      { attr: 'other', kind: 'scopeText', scopeRef: 'applyLabel' },
    ])
    expect(writes).toEqual([['ariaLabel', 'Hi']])
  })

  it('skips foreign expressions and literals for scopeFlag', () => {
    const { writes } = run('<Widget icon={other} other="x" />', 'Widget', [
      { attr: 'icon', kind: 'scopeFlag', scopeRef: 'checkIcon' },
      { attr: 'other', kind: 'scopeFlag', scopeRef: 'checkIcon' },
    ])
    expect(writes).toEqual([])
  })

  it('never sets for scopeReset, even on literals', () => {
    const { writes } = run('<Widget palette="custom" other={altPalette} />', 'Widget', [
      { attr: 'palette', kind: 'scopeReset', scopeRef: 'altPalette' },
      { attr: 'other', kind: 'scopeReset', scopeRef: 'altPalette' },
      { attr: 'missing', kind: 'scopeReset', scopeRef: 'altPalette' },
    ])
    expect(writes).toEqual([
      ['other', ''],
      ['missing', ''],
    ])
  })

  it('maps listed literals back to unset', () => {
    const { writes } = run('<Widget placeholder="Add a tag" />', 'Widget', [
      { attr: 'placeholder', kind: 'text', unsetValues: ['Add a tag'] },
    ])
    expect(writes).toEqual([['placeholder', '']])
  })

  it('reads seeded script state and prefers a literal attribute', () => {
    const source = '<script>\n  let value = $state("two")\n</script>\n<Widget />'
    const literalFirst = run(source, 'Widget', [{ attr: 'value', kind: 'script', literalAttr: 'activeValue' }])
    expect(literalFirst.writes).toEqual([['value', 'two']])

    const withLiteral = run(
      '<script>\n  let value = $state("two")\n</script>\n<Widget activeValue="three" />',
      'Widget',
      [{ attr: 'value', kind: 'script', literalAttr: 'activeValue' }],
    )
    expect(withLiteral.writes).toEqual([['value', 'three']])

    // A custom expression at the literal attribute falls through to the seed.
    const withCustom = run(
      '<script>\n  let value = $state("two")\n</script>\n<Widget activeValue={picked} />',
      'Widget',
      [{ attr: 'value', kind: 'script', literalAttr: 'activeValue' }],
    )
    expect(withCustom.writes).toEqual([['value', 'two']])
  })

  it('validates script arrays before setting', () => {
    const good = '<script>\n  let columns = $state([{"key":"a"}])\n</script>\n<Widget />'
    const { writes } = run(good, 'Widget', [
      {
        attr: 'columns',
        kind: 'scriptJson',
        parseJson: raw => (Array.isArray(raw) ? raw : null),
      },
    ])
    expect(writes).toEqual([['columns', [{ key: 'a' }]]])

    const bad = '<script>\n  let columns = $state("nope")\n</script>\n<Widget />'
    expect(run(bad, 'Widget', [{ attr: 'columns', kind: 'scriptJson', parseJson: () => null }]).writes).toEqual(
      [],
    )

    // A missing declaration validates nothing and skips.
    const missing = '<script>\n  let other = $state(1)\n</script>\n<Widget />'
    expect(
      run(missing, 'Widget', [
        { attr: 'columns', kind: 'scriptJson', parseJson: raw => (Array.isArray(raw) ? raw : null) },
      ]).writes,
    ).toEqual([])
  })

  it('delegates bespoke reads to custom', () => {
    const { writes } = run('<Widget />', 'Widget', [
      { attr: 'first', kind: 'custom', read: () => 'Edit' },
      { attr: 'empty', kind: 'custom', read: () => '' },
      { attr: 'skip', kind: 'custom', read: () => undefined },
      { attr: 'nil', kind: 'custom', read: () => null },
    ])
    expect(writes).toEqual([
      ['first', 'Edit'],
      ['empty', ''],
    ])
  })

  it('unsets script state when requested and the declaration is gone', () => {
    const source = '<script>\n  let other = $state("x")\n</script>\n<Widget />'
    const { writes } = run(source, 'Widget', [
      { attr: 'value', kind: 'script', unsetAbsent: true },
      { attr: 'other', kind: 'script' },
    ])
    expect(writes).toEqual([
      ['value', ''],
      ['other', 'x'],
    ])
  })

  it('leaves everything alone without a complete demo tag', () => {
    const { writes, done } = run('free-form experiment', 'Widget', [{ attr: 'size', kind: 'text' }])
    expect(writes).toEqual([])
    expect(done).toBe(0)
  })

  it('syncs script-only pages with a null tag', () => {
    const source = '<script>\n  let from = $state("2026-01-01")\n</script>\n<p>no tag</p>'
    const { writes, done } = run(source, null, [
      { attr: 'from', kind: 'script' },
      { attr: 'to', kind: 'script' },
    ])
    expect(writes).toEqual([['from', '2026-01-01']])
    expect(done).toBe(1)
  })
})

describe('syncFieldsOf', () => {
  it('derives the sync table from combined field declarations', () => {
    const seen: string[] = []
    const fields = syncFieldsOf([
      { name: 'variant', type: 'string', defaultValue: "''", note: '', editor: 'text', value: '', onChange: value => seen.push(`variant:${value}`), sync: { kind: 'text' } },
      { name: 'disabled', type: 'boolean', defaultValue: 'false', note: '', editor: 'boolean', value: '', onChange: value => seen.push(`disabled:${value}`), sync: { kind: 'tri' } },
      { name: 'onClick', type: '() => void', defaultValue: '—', note: '' },
    ])
    expect(fields.map(field => [field.attr, field.kind])).toEqual([
      ['variant', 'text'],
      ['disabled', 'tri'],
    ])
    // The derived setters delegate to the row's onChange.
    fields[0].set?.('primary')
    fields[1].set?.('yes')
    expect(seen).toEqual(['variant:primary', 'disabled:yes'])
  })

  it('overrides the attribute and setter per row', () => {
    const seen: string[] = []
    const fields = syncFieldsOf([
      { name: 'children', type: 'Snippet', defaultValue: '—', note: '', sync: { kind: 'script', attr: 'label', unsetAbsent: true, set: value => seen.push(value) } },
    ])
    expect(fields).toHaveLength(1)
    expect(fields[0].attr).toBe('label')
    expect(fields[0].kind).toBe('script')
    expect(fields[0].unsetAbsent).toBe(true)
    syncSnippetToState('<script>\n  let label = $state("Hi")\n</script>\n<Widget />', {
      tag: 'Widget',
      fields,
      onDone: () => {},
    })
    expect(seen).toEqual(['Hi'])
  })

  it('keeps rows without an onChange setterless unless setJson applies', () => {
    const fields = syncFieldsOf([
      { name: 'value', type: 'string[]', defaultValue: '[]', note: '', editor: 'options-json', sync: { kind: 'scriptJson', parseJson: raw => (Array.isArray(raw) ? raw : null), setJson: () => {} } },
    ])
    expect(fields[0].set).toBeUndefined()
    expect(fields[0].setJson).toBeTypeOf('function')
  })

  it('resolves an empty write to the row literal default', () => {
    const seen: string[] = []
    const fields = syncFieldsOf([
      { name: 'position', type: 'string', defaultValue: "'bottom-right'", placeholder: 'bottom-right', note: '', editor: 'enum', value: 'bottom-right', onChange: value => seen.push(`position:${value}`), sync: { kind: 'text' } },
      { name: 'qty', type: 'number?', defaultValue: '480', editorDefaultValue: '480', note: '', editor: 'number', value: '480', onChange: value => seen.push(`qty:${value}`), sync: { kind: 'number' } },
      // No literal default (a marker default): an absent attribute unsets.
      { name: 'className', type: 'string?', defaultValue: '—', note: '', editor: 'text', value: '', onChange: value => seen.push(`class:${value}`), sync: { kind: 'text' } },
    ])
    // An absent attribute writes '' ; the derived setter restores the literal
    // default so the Value column keeps showing what the builder omits.
    syncSnippetToState('<Widget />', { tag: 'Widget', fields, onDone: () => {} })
    expect(seen).toEqual(['position:bottom-right', 'qty:480', 'class:'])
  })

  it('resolves an empty write to the row boolean default for tri rows', () => {
    const seen: string[] = []
    const fields = syncFieldsOf([
      { name: 'focusRing', type: 'boolean', defaultValue: 'true', note: '', editor: 'boolean', value: 'yes', onChange: value => seen.push(`focusRing:${value}`), sync: { kind: 'tri' } },
      { name: 'disabled', type: 'boolean', defaultValue: 'false', note: '', editor: 'boolean', value: 'no', onChange: value => seen.push(`disabled:${value}`), sync: { kind: 'tri' } },
      // No boolean default (interaction state): an absent flag stays unset.
      { name: 'allSelected', type: 'boolean', defaultValue: '—', note: '', editor: 'boolean', value: '', onChange: value => seen.push(`allSelected:${value}`), sync: { kind: 'tri' } },
    ])
    syncSnippetToState('<Widget />', { tag: 'Widget', fields, onDone: () => {} })
    expect(seen).toEqual(['focusRing:yes', 'disabled:no', 'allSelected:'])
  })

  it('leaves a non-empty write and an explicit setter alone', () => {
    const seen: string[] = []
    const fields = syncFieldsOf([
      { name: 'position', type: 'string', defaultValue: "'bottom-right'", placeholder: 'bottom-right', note: '', editor: 'enum', value: 'top-right', onChange: value => seen.push(`derived:${value}`), sync: { kind: 'text' } },
      // An explicit setter is the escape hatch: it receives the raw write.
      { name: 'size', type: 'string', defaultValue: "'md'", placeholder: 'md', note: '', editor: 'size', value: 'md', onChange: () => {}, sync: { kind: 'text', set: value => seen.push(`explicit:${value}`) } },
    ])
    syncSnippetToState('<Widget position="top-right" />', { tag: 'Widget', fields, onDone: () => {} })
    expect(seen).toEqual(['derived:top-right', 'explicit:'])
  })

  it('keeps an eye row current on an absent attribute, never resetting or staging', () => {
    const writes: string[] = []
    const toggles: boolean[] = []
    const fields = syncFieldsOf([
      { name: 'size', type: "'md' | 'lg'", defaultValue: "'md'", placeholder: 'md', note: '', editor: 'size', value: 'lg', onChange: value => writes.push(`size:${value}`), toggle: { enabled: true, onToggle: enabled => toggles.push(enabled) }, sync: { kind: 'text' } },
    ])
    syncSnippetToState('<Widget />', { tag: 'Widget', fields, onDone: () => {} })
    expect(writes).toEqual(['size:lg'])
    expect(toggles).toEqual([])
  })

  it('unstages an eye row when the compiled value is its literal default', () => {
    const writes: string[] = []
    const toggles: boolean[] = []
    const fields = syncFieldsOf([
      { name: 'size', type: "'md' | 'lg'", defaultValue: "'md'", placeholder: 'md', note: '', editor: 'size', value: 'lg', onChange: value => writes.push(`size:${value}`), toggle: { enabled: true, onToggle: enabled => toggles.push(enabled) }, sync: { kind: 'text' } },
    ])
    syncSnippetToState('<Widget size="md" />', { tag: 'Widget', fields, onDone: () => {} })
    expect(writes).toEqual(['size:md'])
    expect(toggles).toEqual([false])
  })

  it('keeps an eye tri row current on an absent attribute', () => {
    const writes: string[] = []
    const toggles: boolean[] = []
    const fields = syncFieldsOf([
      { name: 'disabled', type: 'boolean', defaultValue: 'false', note: '', editor: 'boolean', value: 'yes', onChange: value => writes.push(`disabled:${value}`), toggle: { enabled: true, onToggle: enabled => toggles.push(enabled) }, sync: { kind: 'tri' } },
    ])
    syncSnippetToState('<Widget />', { tag: 'Widget', fields, onDone: () => {} })
    expect(writes).toEqual(['disabled:yes'])
    expect(toggles).toEqual([])
  })
})
