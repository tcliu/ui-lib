<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import ChipDropdown from '$lib/components/ChipDropdown.svelte'
  import { type SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseOptionArrayJson } from '$lib/showcase/option-json'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { enumField, textField, boolField, sizeField, jsonField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import {
    buildChipDropdownSnippet,
    CHIP_STAGE_DEFAULT_WIDTH,
    CHIP_STAGE_MIN_WIDTH,
    DEFAULT_CHIP_DROPDOWN_ARIA_LABEL,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  const DEFAULT_OPTIONS: SelectOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'archived', label: 'Archived' },
  ]

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. `ariaLabel` is seeded to
  // the demo's accessible name. Options are committed state edited
  // through the JSON dialog below.
  const INITIAL = {
    options: DEFAULT_OPTIONS,
    optionsEnabled: true,
    value: 'active',
    valueOn: true,
    defaultValue: '',
    defaultValueOn: false,
    label: '',
    labelOn: false,
    ariaLabel: DEFAULT_CHIP_DROPDOWN_ARIA_LABEL,
    ariaLabelOn: true,
    variant: 'violet',
    variantOn: false,
    filterable: 'no' as TriState,
    filterableOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    align: 'left',
    alignOn: false,
    filterPlaceholder: 'Search…',
    filterPlaceholderOn: false,
    buttonClass: '',
    buttonClassOn: false,
    emptyText: 'No results.',
    emptyTextOn: false,
    clearable: 'no' as TriState,
    clearableOn: false,
    clearLabel: 'Clear selection',
    clearLabelOn: false,
    autoPlace: 'yes' as TriState,
    autoPlaceOn: true,
    panelClass: '',
    panelClassOn: false,
    size: 'md',
    sizeOn: false,
    stageWidth: CHIP_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires options, so the eye resets to the defaults
  // instead of omitting; committing re-applies.
  // Stage width is interaction state, not a curated option; Reset restores it.

  function labelFor(list: SelectOption[], current: string): string {
    for (const option of list) {
      if (typeof option === 'string') {
        if (option === current) return option
      } else if (option.value === current) {
        return option.label ?? option.value
      }
    }
    return current
  }

  const demoVariant = $derived(
    pg.variantOn
      ? ((pg.variant || undefined) as 'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald' | undefined)
      : undefined,
  )
  const filterable = $derived(pg.filterableOn ? flagOn(pg.filterable) : undefined)
  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  const clearable = $derived(pg.clearableOn ? flagOn(pg.clearable) : undefined)
  const demoClearLabel = $derived(pg.clearLabelOn && pg.clearLabel ? pg.clearLabel : undefined)
  const demoDefaultValue = $derived(pg.defaultValueOn && pg.defaultValue ? pg.defaultValue : undefined)
  const autoPlace = $derived(pg.autoPlaceOn ? flagOn(pg.autoPlace) : undefined)
  const demoAlign = $derived(pg.alignOn ? ((pg.align || undefined) as 'left' | 'right' | undefined) : undefined)
  const demoButtonClass = $derived(pg.buttonClassOn && pg.buttonClass ? pg.buttonClass : undefined)
  const demoFilterPlaceholder = $derived(pg.filterPlaceholderOn && pg.filterPlaceholder ? pg.filterPlaceholder : undefined)
  const demoEmptyText = $derived(pg.emptyTextOn && pg.emptyText ? pg.emptyText : undefined)
  const demoPanelClass = $derived(pg.panelClassOn && pg.panelClass ? pg.panelClass : undefined)
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)

  const variantOptions = ['sky', 'violet', 'amber', 'fuchsia', 'emerald'].map(value => ({ value, label: value }))
  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  // Options JSON editor: FieldTable owns the dialog; this row seeds it from
  // `value` and commits through `onChange`.
  const code = $derived.by(() =>
    buildChipDropdownSnippet({
      label: pg.label,
      labelOn: pg.labelOn,
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      value: pg.value,
      valueOn: pg.valueOn,
      defaultValue: pg.defaultValue,
      defaultValueOn: pg.defaultValueOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      variant: pg.variant,
      variantOn: pg.variantOn,
      filterable: pg.filterable,
      filterableOn: pg.filterableOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      align: pg.align,
      alignOn: pg.alignOn,
      filterPlaceholder: pg.filterPlaceholder,
      filterPlaceholderOn: pg.filterPlaceholderOn,
      buttonClass: pg.buttonClass,
      buttonClassOn: pg.buttonClassOn,
      emptyText: pg.emptyText,
      emptyTextOn: pg.emptyTextOn,
      clearable: pg.clearable,
      clearableOn: pg.clearableOn,
      clearLabel: pg.clearLabel,
      clearLabelOn: pg.clearLabelOn,
      autoPlace: pg.autoPlace,
      autoPlaceOn: pg.autoPlaceOn,
      panelClass: pg.panelClass,
      panelClassOn: pg.panelClassOn,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'activeValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Committed option value (not its label); marked in the panel.', editor: 'text', clearable: true, value: pg.value, onChange: value => { pg.value = value; pg.valueOn = true; }, toggle: snippetToggle(pg.valueOn, enabled => (pg.valueOn = enabled)), sync: { kind: 'script', attr: 'value', literalAttr: 'activeValue' } },
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.', options: alignOptions, value: pg.align, onChange: v => (pg.align = v), placeholder: 'left', clearLabel: 'Clear align', enabled: pg.alignOn, setEnabled: v => (pg.alignOn = v) }),
    textField({ name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger.', value: pg.ariaLabel, onChange: v => (pg.ariaLabel = v), clearable: true, enabled: pg.ariaLabelOn, setEnabled: v => (pg.ariaLabelOn = v) }),
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', value: pg.autoPlace, onChange: v => (pg.autoPlace = v as TriState), enabled: pg.autoPlaceOn, setEnabled: v => (pg.autoPlaceOn = v) }),
    textField({ name: 'buttonClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the trigger chip classes.', value: pg.buttonClass, onChange: v => (pg.buttonClass = v), clearable: true, enabled: pg.buttonClassOn, setEnabled: v => (pg.buttonClassOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear selection'", note: 'Accessible name for the clear button.', value: pg.clearLabel, onChange: v => (pg.clearLabel = v), editorDefaultValue: 'Clear selection', clearable: true, placeholder: 'Clear selection', enabled: pg.clearLabelOn, setEnabled: v => (pg.clearLabelOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that selects the default value.', value: pg.clearable, onChange: v => (pg.clearable = v as TriState), enabled: pg.clearableOn, setEnabled: v => (pg.clearableOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against: the option value (not its label); the cross hides while the committed value matches it.', value: pg.defaultValue, onChange: v => (pg.defaultValue = v), editorDefaultValue: '', clearable: true, enabled: pg.defaultValueOn, setEnabled: v => (pg.defaultValueOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the trigger.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    textField({ name: 'emptyText', type: 'string?', defaultValue: "'No results.'", note: 'Shown when the filtered panel is empty.', value: pg.emptyText, onChange: v => (pg.emptyText = v), editorDefaultValue: 'No results.', clearable: true, placeholder: 'No results.', enabled: pg.emptyTextOn, setEnabled: v => (pg.emptyTextOn = v) }),
    textField({ name: 'filterPlaceholder', type: 'string?', defaultValue: "'Search…'", note: 'Search input placeholder.', value: pg.filterPlaceholder, onChange: v => (pg.filterPlaceholder = v), editorDefaultValue: 'Search…', clearable: true, placeholder: 'Search…', enabled: pg.filterPlaceholderOn, setEnabled: v => (pg.filterPlaceholderOn = v) }),
    boolField({ name: 'filterable', defaultValue: 'false', note: 'Adds a search field to the panel.', value: pg.filterable, onChange: v => (pg.filterable = v as TriState), enabled: pg.filterableOn, setEnabled: v => (pg.filterableOn = v) }),
    textField({ name: 'label', type: 'string', defaultValue: '—', note: 'Trigger chip text; usually the selected label.', value: pg.label, onChange: v => (pg.label = v), clearable: true, enabled: pg.labelOn, setEnabled: v => (pg.labelOn = v) }),
    jsonField({
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      note: "Selectable chips; a bare string (or a missing label) displays as its own value. The eye resets to the default chips.",
      value: JSON.stringify(pg.options, null, 2),
      onChange: (draft: string) => {
        const parsed = parseOptionArrayJson(draft)
        if (parsed) {
          pg.options = parsed
          pg.optionsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseOptionArrayJson(draft) != null, invalidMessage: 'Invalid options JSON. Use an array of strings or { value, label? } objects.' },
      toggle: resetToggle(
        pg.optionsEnabled,
        enabled => (pg.optionsEnabled = enabled),
        () => (pg.options = DEFAULT_OPTIONS),
      ),
    }),
    textField({ name: 'panelClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the floating panel classes.', value: pg.panelClass, onChange: v => (pg.panelClass = v), clearable: true, enabled: pg.panelClassOn, setEnabled: v => (pg.panelClassOn = v) }),
    sizeField({ note: 'Chip scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    enumField({ name: 'variant', type: "'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald'", defaultValue: "'violet'", note: 'Chip color scheme.', options: variantOptions, value: pg.variant, onChange: v => (pg.variant = v), placeholder: 'violet', clearLabel: 'Clear variant', enabled: pg.variantOn, setEnabled: v => (pg.variantOn = v) }),
    {
      name: 'onClear',
      type: '() => void',
      defaultValue: 'onSelect(default)',
      note: 'Clear handler; selects the default value when omitted.',
    },
    { name: 'onSelect', type: '(value: string) => void', defaultValue: '—', note: 'Called with the chosen value.' }
  ])

  // Snippet write-backs derive from the field rows above; `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text.

  // The seed covers every override except the options array (the snippet reads
  // it from scope), so only options edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  </script>

<ShowcasePage
    {fields}
    title="ChipDropdown"
    {code}
    onReset={clearPlayground}
    scope={{ options: pg.options, labelFor }}
    stage={{ minWidth: CHIP_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'ChipDropdown' }}
    scopeRefresh={() => [pg.options]}
  >
    <ChipDropdown
      label={pg.labelOn && pg.label ? pg.label : labelFor(pg.options, pg.value)}
      activeValue={pg.valueOn && pg.value ? pg.value : undefined}
      defaultValue={demoDefaultValue}
      ariaLabel={pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : DEFAULT_CHIP_DROPDOWN_ARIA_LABEL}
      variant={demoVariant}
      size={demoSize}
      {filterable}
      {disabled}
      {clearable}
      clearLabel={demoClearLabel}
      align={demoAlign}
      buttonClass={demoButtonClass}
      filterPlaceholder={demoFilterPlaceholder}
      emptyText={demoEmptyText}
      {autoPlace}
      panelClass={demoPanelClass}
      options={pg.options}
      onSelect={next => (pg.value = next)} />
    <span class="text-sm text-slate-400">value: {pg.value}</span>
  </ShowcasePage>
