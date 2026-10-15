<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import SelectDropdown, { type SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { parseOptionArrayJson } from '$lib/showcase/option-json'
  import { enumField, textField, boolField, sizeField, jsonField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import {
    buildSelectDropdownSnippet,
    SELECT_STAGE_DEFAULT_WIDTH,
    SELECT_STAGE_MIN_WIDTH,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  const DEFAULT_OPTIONS: SelectOption[] = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
    { value: 'three', label: 'Three' },
    { value: 'four', label: 'Four' },
    { value: 'five', label: 'Five' },
    { value: 'six', label: 'Six' },
    { value: 'seven', label: 'Seven' },
    { value: 'eight', label: 'Eight' },
    { value: 'nine', label: 'Nine' },
    { value: 'ten', label: 'Ten' },
    { value: 'eleven', label: 'Eleven' },
    { value: 'twelve', label: 'Twelve' },
    { value: 'thirteen', label: 'Thirteen' },
    { value: 'fourteen', label: 'Fourteen' },
    { value: 'fifteen', label: 'Fifteen' },
    { value: 'sixteen', label: 'Sixteen' },
    { value: 'seventeen', label: 'Seventeen' },
    { value: 'eighteen', label: 'Eighteen' },
    { value: 'nineteen', label: 'Nineteen' },
    { value: 'twenty', label: 'Twenty' },
  ]

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // Options are committed state edited through the JSON dialog below. The
  // component requires options, so the eye resets to the defaults instead of
  // omitting; committing re-applies.
  let pgOptions = $state(DEFAULT_OPTIONS)
  let pgOptionsEnabled = $state(true)
  let pgValue = $state('two')
  let pgValueOn = $state(true)
  let pgDefaultValue = $state('')
  let pgDefaultValueOn = $state(false)
  let pgAriaLabel = $state('default')
  let pgAriaLabelOn = $state(true)
  let pgButtonLabel = $state('')
  let pgButtonLabelOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgFilterable = $state<TriState>('no')
  let pgFilterableOn = $state(false)
  let pgAllowCustomValue = $state<TriState>('no')
  let pgAllowCustomValueOn = $state(false)
  let pgButtonClass = $state('')
  let pgButtonClassOn = $state(false)
  let pgControlClass = $state('')
  let pgControlClassOn = $state(false)
  let pgOptionClass = $state('')
  let pgOptionClassOn = $state(false)
  let pgEmptyLabel = $state('')
  let pgEmptyLabelOn = $state(false)
  let pgClearable = $state<TriState>('no')
  let pgClearableOn = $state(false)
  let pgClearLabel = $state('Clear selection')
  let pgClearLabelOn = $state(false)
  let pgAlign = $state('left')
  let pgAlignOn = $state(false)
  let pgAutoPlace = $state<TriState>('yes')
  let pgAutoPlaceOn = $state(true)
  let pgPanelClass = $state('')
  let pgPanelClassOn = $state(false)
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(SELECT_STAGE_DEFAULT_WIDTH)

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

  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const filterable = $derived(pgFilterableOn ? flagOn(pgFilterable) : undefined)
  const allowCustomValue = $derived(pgAllowCustomValueOn ? flagOn(pgAllowCustomValue) : undefined)
  const clearable = $derived(pgClearableOn ? flagOn(pgClearable) : undefined)
  const autoPlace = $derived(pgAutoPlaceOn ? flagOn(pgAutoPlace) : undefined)
  const demoAlign = $derived(pgAlignOn ? ((pgAlign || undefined) as 'left' | 'right' | undefined) : undefined)
  const demoButtonClass = $derived(pgButtonClassOn && pgButtonClass ? pgButtonClass : undefined)
  const demoControlClass = $derived(pgControlClassOn && pgControlClass ? pgControlClass : undefined)
  const demoOptionClass = $derived(pgOptionClassOn && pgOptionClass ? pgOptionClass : undefined)
  const demoEmptyLabel = $derived(pgEmptyLabelOn && pgEmptyLabel ? pgEmptyLabel : undefined)
  const demoDefaultValue = $derived(pgDefaultValueOn && pgDefaultValue ? pgDefaultValue : undefined)
  const demoClearLabel = $derived(pgClearLabelOn && pgClearLabel ? pgClearLabel : undefined)
  const demoPanelClass = $derived(pgPanelClassOn && pgPanelClass ? pgPanelClass : undefined)

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  function clearPlayground() {
    pgOptions = DEFAULT_OPTIONS
    pgOptionsEnabled = true
    pgValue = 'two'
    pgValueOn = true
    pgDefaultValue = ''
    pgDefaultValueOn = false
    pgAriaLabel = 'default'
    pgAriaLabelOn = true
    pgButtonLabel = ''
    pgButtonLabelOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgFilterable = 'no'
    pgFilterableOn = false
    pgAllowCustomValue = 'no'
    pgAllowCustomValueOn = false
    pgButtonClass = ''
    pgButtonClassOn = false
    pgControlClass = ''
    pgControlClassOn = false
    pgOptionClass = ''
    pgOptionClassOn = false
    pgEmptyLabel = ''
    pgEmptyLabelOn = false
    pgClearable = 'no'
    pgClearableOn = false
    pgClearLabel = 'Clear selection'
    pgClearLabelOn = false
    pgAlign = 'left'
    pgAlignOn = false
    pgAutoPlace = 'yes'
    pgAutoPlaceOn = true
    pgPanelClass = ''
    pgPanelClassOn = false
    pgStageWidth = SELECT_STAGE_DEFAULT_WIDTH
  }

  const code = $derived.by(() =>
    buildSelectDropdownSnippet({
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      buttonLabel: pgButtonLabel,
      buttonLabelOn: pgButtonLabelOn,
      value: pgValue,
      valueOn: pgValueOn,
      defaultValue: pgDefaultValue,
      defaultValueOn: pgDefaultValueOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      filterable: pgFilterable,
      filterableOn: pgFilterableOn,
      allowCustomValue: pgAllowCustomValue,
      allowCustomValueOn: pgAllowCustomValueOn,
      buttonClass: pgButtonClass,
      buttonClassOn: pgButtonClassOn,
      controlClass: pgControlClass,
      controlClassOn: pgControlClassOn,
      optionClass: pgOptionClass,
      optionClassOn: pgOptionClassOn,
      emptyLabel: pgEmptyLabel,
      emptyLabelOn: pgEmptyLabelOn,
      clearable: pgClearable,
      clearableOn: pgClearableOn,
      clearLabel: pgClearLabel,
      clearLabelOn: pgClearLabelOn,
      align: pgAlign,
      alignOn: pgAlignOn,
      autoPlace: pgAutoPlace,
      autoPlaceOn: pgAutoPlaceOn,
      panelClass: pgPanelClass,
      panelClassOn: pgPanelClassOn,
    }),
  )

  
  // The seed covers every override except the options array (the snippet reads
  // it from scope), so only options edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). Snippet edits map the same way through the preview's sync table.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'activeValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Committed option value (not its label); marked in the panel.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: snippetToggle(pgValueOn, enabled => (pgValueOn = enabled)), sync: { kind: 'script', attr: 'value', literalAttr: 'activeValue' } },
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.', options: alignOptions, value: pgAlign, onChange: v => (pgAlign = v), placeholder: 'left', clearLabel: 'Clear align', enabled: pgAlignOn, setEnabled: v => (pgAlignOn = v) }),
    boolField({ name: 'allowCustomValue', defaultValue: 'false', note: 'Enter commits typed text that matches no option (filterable only).', value: pgAllowCustomValue, onChange: v => (pgAllowCustomValue = v as TriState), enabled: pgAllowCustomValueOn, setEnabled: v => (pgAllowCustomValueOn = v) }),
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the control.', value: pgAriaLabel, onChange: v => (pgAriaLabel = v), clearable: true, enabled: pgAriaLabelOn, setEnabled: v => (pgAriaLabelOn = v) }),
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', value: pgAutoPlace, onChange: v => (pgAutoPlace = v as TriState), enabled: pgAutoPlaceOn, setEnabled: v => (pgAutoPlaceOn = v) }),
    textField({ name: 'buttonClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the trigger button box classes.', value: pgButtonClass, onChange: v => (pgButtonClass = v), clearable: true, enabled: pgButtonClassOn, setEnabled: v => (pgButtonClassOn = v) }),
    {
      name: 'buttonLabel',
      type: 'string?',
      defaultValue: 'derived',
      note: "Overrides the trigger label; omit it and the trigger shows the committed option's label (or the raw value).", editor: 'text', clearable: true, value: pgButtonLabel, onChange: value => { pgButtonLabel = value; pgButtonLabelOn = true; }, toggle: snippetToggle(pgButtonLabelOn, enabled => (pgButtonLabelOn = enabled)), sync: { kind: 'text' } },
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear selection'", note: 'Accessible name for the clear button.', value: pgClearLabel, onChange: v => (pgClearLabel = v), editorDefaultValue: 'Clear selection', clearable: true, placeholder: 'Clear selection', enabled: pgClearLabelOn, setEnabled: v => (pgClearLabelOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pgClearable, onChange: v => (pgClearable = v as TriState), enabled: pgClearableOn, setEnabled: v => (pgClearableOn = v) }),
    textField({ name: 'controlClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the filterable trigger box classes.', value: pgControlClass, onChange: v => (pgControlClass = v), clearable: true, enabled: pgControlClassOn, setEnabled: v => (pgControlClassOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against: the option value (not its label); the cross hides while the committed value matches it.', value: pgDefaultValue, onChange: v => (pgDefaultValue = v), editorDefaultValue: '', clearable: true, enabled: pgDefaultValueOn, setEnabled: v => (pgDefaultValueOn = v) }),
    textField({ name: 'emptyLabel', type: 'string?', defaultValue: '—', note: 'Shown when the filtered list is empty.', value: pgEmptyLabel, onChange: v => (pgEmptyLabel = v), clearable: true, enabled: pgEmptyLabelOn, setEnabled: v => (pgEmptyLabelOn = v) }),
    boolField({ name: 'filterable', defaultValue: 'false', note: 'Renders a combobox input with filtering.', value: pgFilterable, onChange: v => (pgFilterable = v as TriState), enabled: pgFilterableOn, setEnabled: v => (pgFilterableOn = v) }),
    textField({ name: 'optionClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the option row classes.', value: pgOptionClass, onChange: v => (pgOptionClass = v), clearable: true, enabled: pgOptionClassOn, setEnabled: v => (pgOptionClassOn = v) }),
    jsonField({
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      note: "Selectable options; a bare string (or a missing label) displays as its own value. The eye resets to the default options.",
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
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    {
      name: 'onClear',
      type: '() => void',
      defaultValue: "onSelect(default)",
      note: 'Clear handler; selects the default value when omitted.',
    },
    { name: 'onSelect', type: '(value: string) => void', defaultValue: '—', note: 'Called with the chosen value.' }
  ])

</script>

<ShowcasePage
    {fields}
    title="SelectDropdown"
    {code}
    onReset={clearPlayground}
    scope={{ options: pgOptions }}
    stage={{ minWidth: SELECT_STAGE_MIN_WIDTH }}
    bind:stageWidth={pgStageWidth}

    sync={{ tag: 'SelectDropdown' }}
    scopeRefresh={() => [pgOptions]}
  >
    <SelectDropdown
      buttonLabel={pgButtonLabelOn && pgButtonLabel ? pgButtonLabel : undefined}
      activeValue={pgValueOn && pgValue ? pgValue : undefined}
      defaultValue={demoDefaultValue}
      ariaLabel={pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : undefined}
      size={demoSize}
      {filterable}
      {allowCustomValue}
      buttonClass={demoButtonClass}
      controlClass={demoControlClass}
      optionClass={demoOptionClass}
      emptyLabel={demoEmptyLabel}
      {clearable}
      clearLabel={demoClearLabel}
      align={demoAlign}
      {autoPlace}
      panelClass={demoPanelClass}
      options={pgOptions}
      onSelect={next => (pgValue = next)} />
    <span class="text-sm text-slate-400">value: {pgValue}</span>
  </ShowcasePage>
