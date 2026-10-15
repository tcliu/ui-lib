<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import ChipDropdown from '$lib/components/ChipDropdown.svelte'
  import { type SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseOptionArrayJson } from '$lib/showcase/option-json'
  import { enumField, textField, boolField, jsonField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
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
  let pgOptions = $state(DEFAULT_OPTIONS)
  // The component requires options, so the eye resets to the defaults
  // instead of omitting; committing re-applies.
  let pgOptionsEnabled = $state(true)
  let pgValue = $state('active')
  let pgValueOn = $state(true)
  let pgDefaultValue = $state('')
  let pgDefaultValueOn = $state(false)
  let pgLabel = $state('')
  let pgLabelOn = $state(false)
  let pgAriaLabel = $state(DEFAULT_CHIP_DROPDOWN_ARIA_LABEL)
  let pgAriaLabelOn = $state(true)
  let pgVariant = $state('violet')
  let pgVariantOn = $state(false)
  let pgFilterable = $state<TriState>('no')
  let pgFilterableOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgAlign = $state('left')
  let pgAlignOn = $state(false)
  let pgFilterPlaceholder = $state('Search…')
  let pgFilterPlaceholderOn = $state(false)
  let pgButtonClass = $state('')
  let pgButtonClassOn = $state(false)
  let pgEmptyText = $state('No results.')
  let pgEmptyTextOn = $state(false)
  let pgClearable = $state<TriState>('no')
  let pgClearableOn = $state(false)
  let pgClearLabel = $state('Clear selection')
  let pgClearLabelOn = $state(false)
  let pgAutoPlace = $state<TriState>('yes')
  let pgAutoPlaceOn = $state(true)
  let pgPanelClass = $state('')
  let pgPanelClassOn = $state(false)
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(CHIP_STAGE_DEFAULT_WIDTH)

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
    pgVariantOn
      ? ((pgVariant || undefined) as 'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald' | undefined)
      : undefined,
  )
  const filterable = $derived(pgFilterableOn ? flagOn(pgFilterable) : undefined)
  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const clearable = $derived(pgClearableOn ? flagOn(pgClearable) : undefined)
  const demoClearLabel = $derived(pgClearLabelOn && pgClearLabel ? pgClearLabel : undefined)
  const demoDefaultValue = $derived(pgDefaultValueOn && pgDefaultValue ? pgDefaultValue : undefined)
  const autoPlace = $derived(pgAutoPlaceOn ? flagOn(pgAutoPlace) : undefined)
  const demoAlign = $derived(pgAlignOn ? ((pgAlign || undefined) as 'left' | 'right' | undefined) : undefined)
  const demoButtonClass = $derived(pgButtonClassOn && pgButtonClass ? pgButtonClass : undefined)
  const demoFilterPlaceholder = $derived(pgFilterPlaceholderOn && pgFilterPlaceholder ? pgFilterPlaceholder : undefined)
  const demoEmptyText = $derived(pgEmptyTextOn && pgEmptyText ? pgEmptyText : undefined)
  const demoPanelClass = $derived(pgPanelClassOn && pgPanelClass ? pgPanelClass : undefined)

  const variantOptions = ['sky', 'violet', 'amber', 'fuchsia', 'emerald'].map(value => ({ value, label: value }))
  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  function clearPlayground() {
    pgOptions = DEFAULT_OPTIONS
    pgOptionsEnabled = true
    pgValue = 'active'
    pgValueOn = true
    pgDefaultValue = ''
    pgDefaultValueOn = false
    pgLabel = ''
    pgLabelOn = false
    pgAriaLabel = DEFAULT_CHIP_DROPDOWN_ARIA_LABEL
    pgAriaLabelOn = true
    pgVariant = 'violet'
    pgVariantOn = false
    pgFilterable = 'no'
    pgFilterableOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgAlign = 'left'
    pgAlignOn = false
    pgFilterPlaceholder = 'Search…'
    pgFilterPlaceholderOn = false
    pgButtonClass = ''
    pgButtonClassOn = false
    pgEmptyText = 'No results.'
    pgEmptyTextOn = false
    pgClearable = 'no'
    pgClearableOn = false
    pgClearLabel = 'Clear selection'
    pgClearLabelOn = false
    pgAutoPlace = 'yes'
    pgAutoPlaceOn = true
    pgPanelClass = ''
    pgPanelClassOn = false
    pgStageWidth = CHIP_STAGE_DEFAULT_WIDTH
  }

  // Options JSON editor: FieldTable owns the dialog; this row seeds it from
  // `value` and commits through `onChange`.
  const code = $derived.by(() =>
    buildChipDropdownSnippet({
      label: pgLabel,
      labelOn: pgLabelOn,
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      value: pgValue,
      valueOn: pgValueOn,
      defaultValue: pgDefaultValue,
      defaultValueOn: pgDefaultValueOn,
      variant: pgVariant,
      variantOn: pgVariantOn,
      filterable: pgFilterable,
      filterableOn: pgFilterableOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      align: pgAlign,
      alignOn: pgAlignOn,
      filterPlaceholder: pgFilterPlaceholder,
      filterPlaceholderOn: pgFilterPlaceholderOn,
      buttonClass: pgButtonClass,
      buttonClassOn: pgButtonClassOn,
      emptyText: pgEmptyText,
      emptyTextOn: pgEmptyTextOn,
      clearable: pgClearable,
      clearableOn: pgClearableOn,
      clearLabel: pgClearLabel,
      clearLabelOn: pgClearLabelOn,
      autoPlace: pgAutoPlace,
      autoPlaceOn: pgAutoPlaceOn,
      panelClass: pgPanelClass,
      panelClassOn: pgPanelClassOn,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'activeValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Committed option value (not its label); marked in the panel.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: snippetToggle(pgValueOn, enabled => (pgValueOn = enabled)), sync: { kind: 'script', attr: 'value', literalAttr: 'activeValue' } },
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.', options: alignOptions, value: pgAlign, onChange: v => (pgAlign = v), placeholder: 'left', clearLabel: 'Clear align', enabled: pgAlignOn, setEnabled: v => (pgAlignOn = v) }),
    textField({ name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger.', value: pgAriaLabel, onChange: v => (pgAriaLabel = v), clearable: true, enabled: pgAriaLabelOn, setEnabled: v => (pgAriaLabelOn = v) }),
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', value: pgAutoPlace, onChange: v => (pgAutoPlace = v as TriState), enabled: pgAutoPlaceOn, setEnabled: v => (pgAutoPlaceOn = v) }),
    textField({ name: 'buttonClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the trigger chip classes.', value: pgButtonClass, onChange: v => (pgButtonClass = v), clearable: true, enabled: pgButtonClassOn, setEnabled: v => (pgButtonClassOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear selection'", note: 'Accessible name for the clear button.', value: pgClearLabel, onChange: v => (pgClearLabel = v), editorDefaultValue: 'Clear selection', clearable: true, placeholder: 'Clear selection', enabled: pgClearLabelOn, setEnabled: v => (pgClearLabelOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that selects the default value.', value: pgClearable, onChange: v => (pgClearable = v as TriState), enabled: pgClearableOn, setEnabled: v => (pgClearableOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against: the option value (not its label); the cross hides while the committed value matches it.', value: pgDefaultValue, onChange: v => (pgDefaultValue = v), editorDefaultValue: '', clearable: true, enabled: pgDefaultValueOn, setEnabled: v => (pgDefaultValueOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the trigger.', value: pgDisabled, onChange: v => (pgDisabled = v as TriState), enabled: pgDisabledOn, setEnabled: v => (pgDisabledOn = v) }),
    textField({ name: 'emptyText', type: 'string?', defaultValue: "'No results.'", note: 'Shown when the filtered panel is empty.', value: pgEmptyText, onChange: v => (pgEmptyText = v), editorDefaultValue: 'No results.', clearable: true, placeholder: 'No results.', enabled: pgEmptyTextOn, setEnabled: v => (pgEmptyTextOn = v) }),
    textField({ name: 'filterPlaceholder', type: 'string?', defaultValue: "'Search…'", note: 'Search input placeholder.', value: pgFilterPlaceholder, onChange: v => (pgFilterPlaceholder = v), editorDefaultValue: 'Search…', clearable: true, placeholder: 'Search…', enabled: pgFilterPlaceholderOn, setEnabled: v => (pgFilterPlaceholderOn = v) }),
    boolField({ name: 'filterable', defaultValue: 'false', note: 'Adds a search field to the panel.', value: pgFilterable, onChange: v => (pgFilterable = v as TriState), enabled: pgFilterableOn, setEnabled: v => (pgFilterableOn = v) }),
    textField({ name: 'label', type: 'string', defaultValue: '—', note: 'Trigger chip text; usually the selected label.', value: pgLabel, onChange: v => (pgLabel = v), clearable: true, enabled: pgLabelOn, setEnabled: v => (pgLabelOn = v) }),
    jsonField({
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      note: "Selectable chips; a bare string (or a missing label) displays as its own value. The eye resets to the default chips.",
      value: JSON.stringify(pgOptions, null, 2),
      onChange: (draft: string) => {
        const parsed = parseOptionArrayJson(draft)
        if (parsed) {
          pgOptions = parsed
          pgOptionsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseOptionArrayJson(draft) != null, invalidMessage: 'Invalid options JSON. Use an array of strings or { value, label? } objects.' },
      toggle: resetToggle(
        pgOptionsEnabled,
        enabled => (pgOptionsEnabled = enabled),
        () => (pgOptions = DEFAULT_OPTIONS),
      ),
    }),
    textField({ name: 'panelClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the floating panel classes.', value: pgPanelClass, onChange: v => (pgPanelClass = v), clearable: true, enabled: pgPanelClassOn, setEnabled: v => (pgPanelClassOn = v) }),
    enumField({ name: 'variant', type: "'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald'", defaultValue: "'violet'", note: 'Chip color scheme.', options: variantOptions, value: pgVariant, onChange: v => (pgVariant = v), placeholder: 'violet', clearLabel: 'Clear variant', enabled: pgVariantOn, setEnabled: v => (pgVariantOn = v) }),
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
    scope={{ options: pgOptions, labelFor }}
    stage={{ minWidth: CHIP_STAGE_MIN_WIDTH }}
    bind:stageWidth={pgStageWidth}

    sync={{ tag: 'ChipDropdown' }}
    scopeRefresh={() => [pgOptions]}
  >
    <ChipDropdown
      label={pgLabelOn && pgLabel ? pgLabel : labelFor(pgOptions, pgValue)}
      activeValue={pgValueOn && pgValue ? pgValue : undefined}
      defaultValue={demoDefaultValue}
      ariaLabel={pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : DEFAULT_CHIP_DROPDOWN_ARIA_LABEL}
      variant={demoVariant}
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
      options={pgOptions}
      onSelect={next => (pgValue = next)} />
    <span class="text-sm text-slate-400">value: {pgValue}</span>
  </ShowcasePage>
