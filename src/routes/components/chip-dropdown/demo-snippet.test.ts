import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/snippet-playground'
import { buildChipDropdownSnippet, DEFAULT_CHIP_DROPDOWN_ARIA_LABEL, type ChipDropdownSnippetState } from './demo-snippet'

function state(overrides: Partial<ChipDropdownSnippetState> = {}): ChipDropdownSnippetState {
  return {
    label: '',
    labelOn: true,
    ariaLabel: 'Set status',
    ariaLabelOn: true,
    value: 'active',
    valueOn: true,
    defaultValue: '',
    defaultValueOn: true,
    size: 'md',
    sizeOn: false,
    variant: '',
    variantOn: true,
    filterable: '',
    filterableOn: true,
    disabled: '',
    disabledOn: true,
    align: '',
    alignOn: true,
    filterPlaceholder: '',
    filterPlaceholderOn: true,
    filterLabel: '',
    filterLabelOn: true,
    buttonClass: '',
    buttonClassOn: true,
    emptyText: '',
    emptyTextOn: true,
    clearable: '',
    clearableOn: true,
    clearLabel: '',
    clearLabelOn: true,
    autoPlace: '',
    autoPlaceOn: true,
    panelClass: '',
    panelClassOn: true,
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
        label: 'Status',
        ariaLabel: 'Pick a status',
        variant: 'emerald',
        variantOn: true,
        filterable: 'yes',
        disabled: 'yes',
        align: 'right',
        alignOn: true,
        filterPlaceholder: 'Find a status',
        filterLabel: 'Find a status',
        buttonClass: 'w-40',
        emptyText: 'Nothing here',
        clearable: 'yes',
        clearLabel: 'Clear it',
        autoPlace: 'no',
        panelClass: 'shadow-lg',
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
        variant: 'violet',
        variantOn: true,
        filterable: 'no',
        disabled: 'no',
        align: 'left',
        alignOn: true,
        clearable: 'no',
        autoPlace: 'yes',
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
      state({ variant: 'emerald', variantOn: false, align: 'right', alignOn: false }),
    )
    expect(off).not.toContain('variant=')
    expect(off).not.toContain('align=')
  })

  it('omits staged flags while their eyes are off', () => {
    const off = buildChipDropdownSnippet(
      state({ filterable: 'yes', filterableOn: false, disabled: 'yes', disabledOn: false, clearable: 'yes', clearableOn: false, autoPlace: 'no', autoPlaceOn: false }),
    )
    expect(off).not.toContain('filterable')
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('clearable')
    expect(off).not.toContain('autoPlace')
  })

  it('falls back to the derived label, seed aria label, and no committed value while their eyes are off', () => {
    const off = buildChipDropdownSnippet(
      state({ label: 'Status', labelOn: false, ariaLabel: 'Pick a status', ariaLabelOn: false, value: 'paused', valueOn: false }),
    )
    expect(off).not.toContain('label="Status"')
    expect(off).toContain('label={labelFor(options, value)}')
    expect(off).not.toContain('ariaLabel="Pick a status"')
    expect(off).toContain(`ariaLabel="${DEFAULT_CHIP_DROPDOWN_ARIA_LABEL}"`)
    expect(off).not.toContain('activeValue=')
    expect(off).toContain('let value = $state("paused")')
  })

  it('escapes quotes in free text', () => {
    const source = buildChipDropdownSnippet(state({ filterPlaceholder: 'Say "hi"' }))
    expect(source).toContain('filterPlaceholder="Say &quot;hi&quot;"')
  })

  it('omits eye-gated overrides while their toggle is off and emits them while on', () => {
    const off = buildChipDropdownSnippet(state({ buttonClass: 'w-40', buttonClassOn: false, defaultValue: 'active', defaultValueOn: false, clearLabel: 'Clear it', clearLabelOn: false }))
    expect(off).not.toContain('buttonClass=')
    expect(off).not.toContain('defaultValue=')
    expect(off).not.toContain('clearLabel=')
    const on = buildChipDropdownSnippet(state({ buttonClass: 'w-40', buttonClassOn: true, defaultValue: 'active', defaultValueOn: true, clearLabel: 'Clear it', clearLabelOn: true }))
    expect(on).toContain('buttonClass="w-40"')
    expect(on).toContain('defaultValue="active"')
    expect(on).toContain('clearLabel="Clear it"')
  })

  it('emits a non-default size and omits the md default', () => {
    expect(buildChipDropdownSnippet(state({ size: 'lg', sizeOn: true }))).toContain('size="lg"')
    expect(buildChipDropdownSnippet(state({ size: '24', sizeOn: true }))).toContain('size={24}')
    // The `md` default and an eye-off override both emit nothing.
    expect(buildChipDropdownSnippet(state({ size: 'md', sizeOn: true }))).not.toContain('size')
    expect(buildChipDropdownSnippet(state({ size: 'lg', sizeOn: false }))).not.toContain('size')
  })

  it('seeds the committed value as script-local state', () => {
    const source = buildChipDropdownSnippet(state({ value: 'paused' }))
    expect(source).toContain('let value = $state("paused")')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildChipDropdownSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
