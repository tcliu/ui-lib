import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '#showcase/playground/snippet-playground.js'
import { staged } from '#showcase/playground/staged.js'
import { buildChipDropdownSnippet, DEFAULT_CHIP_DROPDOWN_ARIA_LABEL, type ChipDropdownSnippetState } from './demo-snippet'

function state(overrides: Partial<ChipDropdownSnippetState> = {}): ChipDropdownSnippetState {
  return {
    label: staged('', true),
    ariaLabel: staged('Set status', true),
    value: staged('active', true),
    defaultValue: staged('', true),
    size: staged('md'),
    variant: staged('', true),
    filterable: staged('', true),
    disabled: staged('', true),
    align: staged('', true),
    filterPlaceholder: staged('', true),
    filterLabel: staged('', true),
    buttonClass: staged('', true),
    emptyText: staged('', true),
    clearable: staged('', true),
    clearLabel: staged('', true),
    autoPlace: staged('', true),
    panelClass: staged('', true),
    ...overrides,
  }
}

describe('buildChipDropdownSnippet', () => {
  it('emits content-only markup and omits unset overrides', () => {
    const source = buildChipDropdownSnippet(state())
    // The resize harness is ShowcasePage-owned chrome, never in the snippet.
    expect(source).not.toContain('<Resizable')
    expect(source).not.toContain('stageWidth')
    expect(source).toContain('label={labelFor(options, value)}')
    expect(source).toContain('ariaLabel="Set status"')
    expect(source).not.toContain('variant=')
    expect(source).not.toContain('filterable')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('filterPlaceholder')
    expect(source).not.toContain('filterLabel')
  })

  it('emits a custom label literal and the curated overrides while set', () => {
    const source = buildChipDropdownSnippet(
      state({
        label: staged('Status', true),
        ariaLabel: staged('Pick a status', true),
        variant: staged('emerald', true),
        filterable: staged('yes', true),
        disabled: staged('yes', true),
        align: staged('right', true),
        filterPlaceholder: staged('Find a status', true),
        filterLabel: staged('Find a status', true),
        buttonClass: staged('w-40', true),
        emptyText: staged('Nothing here', true),
        clearable: staged('yes', true),
        clearLabel: staged('Clear it', true),
        autoPlace: staged('no', true),
        panelClass: staged('shadow-lg', true),
      }),
    )
    expect(source).toContain('label="Status"')
    expect(source).not.toContain('labelFor(options, value)')
    expect(source).toContain('ariaLabel="Pick a status"')
    expect(source).toContain('variant="emerald"')
    expect(source).toContain('  filterable\n')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('align="right"')
    expect(source).toContain('filterPlaceholder="Find a status"')
    expect(source).toContain('filterLabel="Find a status"')
    expect(source).toContain('buttonClass="w-40"')
    expect(source).toContain('emptyText="Nothing here"')
    expect(source).toContain('  clearable\n')
    expect(source).toContain('clearLabel="Clear it"')
    expect(source).toContain('  autoPlace={false}')
    expect(source).toContain('panelClass="shadow-lg"')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildChipDropdownSnippet(
      state({
        variant: staged('violet', true),
        filterable: staged('no', true),
        disabled: staged('no', true),
        align: staged('left', true),
        clearable: staged('no', true),
        autoPlace: staged('yes', true),
      }),
    )
    expect(source).not.toContain('variant=')
    expect(source).not.toContain('filterable')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('align=')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('autoPlace')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildChipDropdownSnippet(
      state({ variant: staged('emerald'), align: staged('right') }),
    )
    expect(off).not.toContain('variant=')
    expect(off).not.toContain('align=')
  })

  it('omits staged flags while their eyes are off', () => {
    const off = buildChipDropdownSnippet(
      state({ filterable: staged('yes'), disabled: staged('yes'), clearable: staged('yes'), autoPlace: staged('no') }),
    )
    expect(off).not.toContain('filterable')
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('clearable')
    expect(off).not.toContain('autoPlace')
  })

  it('falls back to the derived label, seed aria label, and no committed value while their eyes are off', () => {
    const off = buildChipDropdownSnippet(
      state({ label: staged('Status'), ariaLabel: staged('Pick a status'), value: staged('paused') }),
    )
    expect(off).not.toContain('label="Status"')
    expect(off).toContain('label={labelFor(options, value)}')
    expect(off).not.toContain('ariaLabel="Pick a status"')
    expect(off).toContain(`ariaLabel="${DEFAULT_CHIP_DROPDOWN_ARIA_LABEL}"`)
    expect(off).not.toContain('activeValue=')
    expect(off).toContain('let value = $state("paused")')
  })

  it('escapes quotes in free text', () => {
    const source = buildChipDropdownSnippet(state({ filterPlaceholder: staged('Say "hi"', true) }))
    expect(source).toContain('filterPlaceholder="Say &quot;hi&quot;"')
  })

  it('omits eye-gated overrides while their toggle is off and emits them while on', () => {
    const off = buildChipDropdownSnippet(state({ buttonClass: staged('w-40'), defaultValue: staged('active'), clearLabel: staged('Clear it') }))
    expect(off).not.toContain('buttonClass=')
    expect(off).not.toContain('defaultValue=')
    expect(off).not.toContain('clearLabel=')
    const on = buildChipDropdownSnippet(state({ buttonClass: staged('w-40', true), defaultValue: staged('active', true), clearLabel: staged('Clear it', true) }))
    expect(on).toContain('buttonClass="w-40"')
    expect(on).toContain('defaultValue="active"')
    expect(on).toContain('clearLabel="Clear it"')
  })

  it('emits a non-default size and omits the md default', () => {
    expect(buildChipDropdownSnippet(state({ size: staged('lg', true) }))).toContain('size="lg"')
    expect(buildChipDropdownSnippet(state({ size: staged('24', true) }))).toContain('size={24}')
    // The `md` default and an eye-off override both emit nothing.
    expect(buildChipDropdownSnippet(state({ size: staged('md', true) }))).not.toContain('size')
    expect(buildChipDropdownSnippet(state({ size: staged('lg') }))).not.toContain('size')
  })

  it('seeds the committed value as script-local state', () => {
    const source = buildChipDropdownSnippet(state({ value: staged('paused', true) }))
    expect(source).toContain('let value = $state("paused")')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildChipDropdownSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
