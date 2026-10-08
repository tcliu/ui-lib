import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildChipDropdownSnippet, type ChipDropdownSnippetState } from './demo-snippet'

function state(overrides: Partial<ChipDropdownSnippetState> = {}): ChipDropdownSnippetState {
  return {
    label: '',
    ariaLabel: 'Set status',
    value: 'active',
    variant: '',
    filterable: '',
    disabled: '',
    align: '',
    filterPlaceholder: '',
    buttonClass: '',
    emptyText: '',
    autoPlace: '',
    panelClass: '',
    ...overrides,
  }
}

describe('buildChipDropdownSnippet', () => {
  it('wraps the demo in the width-only resizable stage and omits unset overrides', () => {
    const source = buildChipDropdownSnippet(state())
    expect(source).toContain('<Resizable')
    expect(source).toContain('width={stageWidth}')
    expect(source).not.toContain('stageHeight')
    expect(source).toContain('label={labelFor(options, value)}')
    expect(source).toContain('ariaLabel="Set status"')
    expect(source).not.toContain('variant=')
    expect(source).not.toContain('filterable')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('filterPlaceholder')
  })

  it('emits a custom label literal and the curated overrides while set', () => {
    const source = buildChipDropdownSnippet(
      state({
        label: 'Status',
        ariaLabel: 'Pick a status',
        variant: 'emerald',
        filterable: 'yes',
        disabled: 'no',
        align: 'right',
        filterPlaceholder: 'Find a status',
        buttonClass: 'w-40',
        emptyText: 'Nothing here',
        autoPlace: 'no',
        panelClass: 'shadow-lg',
      }),
    )
    expect(source).toContain('label="Status"')
    expect(source).not.toContain('labelFor(options, value)')
    expect(source).toContain('ariaLabel="Pick a status"')
    expect(source).toContain('variant="emerald"')
    expect(source).toContain('        filterable\n')
    expect(source).toContain('        disabled={false}')
    expect(source).toContain('align="right"')
    expect(source).toContain('filterPlaceholder="Find a status"')
    expect(source).toContain('buttonClass="w-40"')
    expect(source).toContain('emptyText="Nothing here"')
    expect(source).toContain('        autoPlace={false}')
    expect(source).toContain('panelClass="shadow-lg"')
  })

  it('escapes quotes in free text', () => {
    const source = buildChipDropdownSnippet(state({ filterPlaceholder: 'Say "hi"' }))
    expect(source).toContain('filterPlaceholder="Say &quot;hi&quot;"')
  })

  it('seeds the committed value as script-local state', () => {
    const source = buildChipDropdownSnippet(state({ value: 'paused' }))
    expect(source).toContain('let value = $state("paused")')
  })

  it('compiles the generated stage snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildChipDropdownSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
