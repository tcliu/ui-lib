<script lang="ts">
  import ChipDropdown from '$lib/components/ChipDropdown.svelte'
  import { type SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { parseOptionArrayJson } from '$lib/showcase/option-json'
  import { jsonField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
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

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
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

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ options: pgOptions, labelFor }),
    sync: { tag: 'ChipDropdown', getFields: () => syncFields },
  })

  const fields: SyncableFieldConfig[] = $derived([
    { name: 'activeValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Committed option value (not its label); marked in the panel; the eye stages the customization.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: snippetToggle(pgValueOn, enabled => (pgValueOn = enabled)), sync: { kind: 'script', attr: 'value', literalAttr: 'activeValue' } },
    { name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger; the eye stages the customization.', editor: 'enum', options: alignOptions, value: pgAlign, onChange: value => { pgAlign = value; pgAlignOn = true; }, placeholder: 'left', clearLabel: 'Clear align', toggle: snippetToggle(pgAlignOn, enabled => (pgAlignOn = enabled)), sync: { kind: 'text' } },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger; the eye stages the customization.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'autoPlace', type: 'boolean', defaultValue: 'true', note: 'Flips the panel when crowded; the eye stages the customization.', editor: 'boolean', value: pgAutoPlace, onChange: value => { pgAutoPlace = value as TriState; pgAutoPlaceOn = true; }, toggle: snippetToggle(pgAutoPlaceOn, enabled => (pgAutoPlaceOn = enabled)), sync: { kind: 'tri' } },
    { name: 'buttonClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the trigger chip classes; the eye stages the customization.', editor: 'text', clearable: true, value: pgButtonClass, onChange: value => { pgButtonClass = value; pgButtonClassOn = true; }, toggle: snippetToggle(pgButtonClassOn, enabled => (pgButtonClassOn = enabled)), sync: { kind: 'text' } },
    {
      name: 'clearLabel',
      type: 'string?',
      defaultValue: "'Clear selection'",
      editorDefaultValue: 'Clear selection',
      note: 'Accessible name for the clear button; the eye stages the customization.', editor: 'text', clearable: true, value: pgClearLabel, onChange: value => { pgClearLabel = value; pgClearLabelOn = true; }, toggle: snippetToggle(pgClearLabelOn, enabled => (pgClearLabelOn = enabled)), placeholder: 'Clear selection', sync: { kind: 'text' } },
    {
      name: 'clearable',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Appends a cross button that selects the default value; the eye stages the customization.', editor: 'boolean', value: pgClearable, onChange: value => { pgClearable = value as TriState; pgClearableOn = true; }, toggle: snippetToggle(pgClearableOn, enabled => (pgClearableOn = enabled)), sync: { kind: 'tri' } },
    {
      name: 'defaultValue',
      type: 'string?',
      defaultValue: "''",
      editorDefaultValue: '',
      note: 'Baseline the clear button compares against: the option value (not its label); the cross hides while the committed value matches it; the eye stages the customization.', editor: 'text', clearable: true, value: pgDefaultValue, onChange: value => { pgDefaultValue = value; pgDefaultValueOn = true; }, toggle: snippetToggle(pgDefaultValueOn, enabled => (pgDefaultValueOn = enabled)), sync: { kind: 'text' } },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the trigger; the eye stages the customization.', editor: 'boolean', value: pgDisabled, onChange: value => { pgDisabled = value as TriState; pgDisabledOn = true; }, toggle: snippetToggle(pgDisabledOn, enabled => (pgDisabledOn = enabled)), sync: { kind: 'tri' } },
    {
      name: 'emptyText',
      type: 'string?',
      defaultValue: "'No results.'",
      editorDefaultValue: 'No results.',
      note: 'Shown when the filtered panel is empty; the eye stages the customization.', editor: 'text', clearable: true, value: pgEmptyText, onChange: value => { pgEmptyText = value; pgEmptyTextOn = true; }, toggle: snippetToggle(pgEmptyTextOn, enabled => (pgEmptyTextOn = enabled)), placeholder: 'No results.', sync: { kind: 'text' } },
    {
      name: 'filterPlaceholder',
      type: 'string?',
      defaultValue: "'Search…'",
      editorDefaultValue: 'Search…',
      note: 'Search input placeholder; the eye stages the customization.', editor: 'text', clearable: true, value: pgFilterPlaceholder, onChange: value => { pgFilterPlaceholder = value; pgFilterPlaceholderOn = true; }, toggle: snippetToggle(pgFilterPlaceholderOn, enabled => (pgFilterPlaceholderOn = enabled)), placeholder: 'Search…', sync: { kind: 'text' } },
    { name: 'filterable', type: 'boolean', defaultValue: 'false', note: 'Adds a search field to the panel; the eye stages the customization.', editor: 'boolean', value: pgFilterable, onChange: value => { pgFilterable = value as TriState; pgFilterableOn = true; }, toggle: snippetToggle(pgFilterableOn, enabled => (pgFilterableOn = enabled)), sync: { kind: 'tri' } },
    { name: 'label', type: 'string', defaultValue: '—', note: 'Trigger chip text; usually the selected label; the eye stages the customization.', editor: 'text', clearable: true, value: pgLabel, onChange: value => { pgLabel = value; pgLabelOn = true; }, toggle: snippetToggle(pgLabelOn, enabled => (pgLabelOn = enabled)), sync: { kind: 'text' } },
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
    { name: 'panelClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the floating panel classes; the eye stages the customization.', editor: 'text', clearable: true, value: pgPanelClass, onChange: value => { pgPanelClass = value; pgPanelClassOn = true; }, toggle: snippetToggle(pgPanelClassOn, enabled => (pgPanelClassOn = enabled)), sync: { kind: 'text' } },
    {
      name: 'variant',
      type: "'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald'",
      defaultValue: "'violet'",
      note: 'Chip color scheme; the eye stages the customization.', editor: 'enum', options: variantOptions, value: pgVariant, onChange: value => { pgVariant = value; pgVariantOn = true; }, placeholder: 'violet', clearLabel: 'Clear variant', toggle: snippetToggle(pgVariantOn, enabled => (pgVariantOn = enabled)), sync: { kind: 'text' } },
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
  const syncFields = $derived(syncFieldsOf(fields))

  // The seed covers every override except the options array (the snippet reads
  // it from scope), so only options edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  useScopeRefresh(preview, () => [pgOptions])
</script>

<ShowcasePage
    {fields}
    title="ChipDropdown"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ options: pgOptions, labelFor }}
    stage={{ minWidth: CHIP_STAGE_MIN_WIDTH }}
    bind:stageWidth={pgStageWidth}
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
