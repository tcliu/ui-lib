import { describe, expect, it } from 'vitest'
import {
  CHOOSER_LABEL,
  CHOOSER_RESET_LABEL,
  DEMO_COLUMNS,
  buildColumnChooserSnippet,
} from './demo-snippet'

const unset = { label: '', resetLabel: '' }

describe('buildColumnChooserSnippet', () => {
  it('declares the shared column list and feeds chooser entries from it', () => {
    const source = buildColumnChooserSnippet(unset)
    expect(source).toContain('  const columns = [')
    for (const column of DEMO_COLUMNS) {
      expect(source).toContain(`{ key: '${column.key}', header: '${column.header}' },`)
    }
    expect(source).toContain(
      'columns={columns.map(column => ({ key: column.key, header: column.header, checked: !hidden.has(column.key) }))}'
    )
  })

  it('routes the default labels through scope', () => {
    const source = buildColumnChooserSnippet(unset)
    expect(source).toContain('label={chooserLabel}')
    expect(source).toContain('resetLabel={resetLabel}')
    expect(source).not.toContain(CHOOSER_LABEL)
    expect(source).not.toContain(CHOOSER_RESET_LABEL)
  })

  it('bakes custom labels in as literals', () => {
    const source = buildColumnChooserSnippet({ label: 'Team columns', resetLabel: 'Show all' })
    expect(source).toContain('label="Team columns"')
    expect(source).toContain('resetLabel="Show all"')
  })

  it('escapes quotes in a custom label', () => {
    const source = buildColumnChooserSnippet({ label: 'A "quoted" label', resetLabel: '' })
    expect(source).toContain('label="A &quot;quoted&quot; label"')
  })

  it('wires the shared toggle and reset handlers', () => {
    const source = buildColumnChooserSnippet(unset)
    expect(source).toContain('onToggle={handleToggleColumn}')
    expect(source).toContain('onReset={handleResetColumns}')
  })

  it('renders the hidden-count readout from scope', () => {
    const source = buildColumnChooserSnippet(unset)
    expect(source).toContain('<span class="text-sm text-slate-400">hidden: {hidden.size}</span>')
  })
})
