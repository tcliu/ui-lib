<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import AutoComplete from '$lib/components/AutoComplete.svelte'
  import type { SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { parseOptionArrayJson } from '$lib/showcase/option-json'
  import { enumField, textField, boolField, sizeField, jsonField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import {
    buildAutoCompleteSnippet,
    AUTOCOMPLETE_STAGE_DEFAULT_WIDTH,
    AUTOCOMPLETE_STAGE_MIN_WIDTH,
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
  // unsets it; Reset restores the defaults below. `ariaLabel` is the one
  // always-present value, seeded to the demo's accessible name.
  let pgOptions = $state(DEFAULT_OPTIONS)
  // The component requires options, so the eye resets to the defaults
  // instead of omitting; committing re-applies.
  let pgOptionsEnabled = $state(true)
  let pgValue = $state('Two')
  let pgValueOn = $state(true)
  let pgAriaLabel = $state('default')
  let pgAriaLabelOn = $state(true)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgPlaceholder = $state('')
  let pgPlaceholderOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgClearable = $state<TriState>('no')
  let pgClearableOn = $state(false)
  let pgClearLabel = $state('Clear')
  let pgClearLabelOn = $state(false)
  let pgClearPlacement = $state('auto')
  let pgClearPlacementOn = $state(false)
  let pgDefaultValue = $state('')
  let pgDefaultValueOn = $state(false)
  let pgAlign = $state('left')
  let pgAlignOn = $state(false)
  let pgAutoPlace = $state<TriState>('yes')
  let pgAutoPlaceOn = $state(true)
  let pgPanelClass = $state('')
  let pgPanelClassOn = $state(false)
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(AUTOCOMPLETE_STAGE_DEFAULT_WIDTH)

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const demoPlaceholder = $derived(pgPlaceholderOn && pgPlaceholder ? pgPlaceholder : undefined)
  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const clearable = $derived(pgClearableOn ? flagOn(pgClearable) : undefined)
  const demoClearLabel = $derived(pgClearLabelOn && pgClearLabel ? pgClearLabel : undefined)
  const demoClearPlacement = $derived(
    pgClearPlacementOn
      ? ((pgClearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pgDefaultValueOn && pgDefaultValue ? pgDefaultValue : undefined)
  const autoPlace = $derived(pgAutoPlaceOn ? flagOn(pgAutoPlace) : undefined)
  const demoAlign = $derived(pgAlignOn ? ((pgAlign || undefined) as 'left' | 'right' | undefined) : undefined)
  const demoPanelClass = $derived(pgPanelClassOn && pgPanelClass ? pgPanelClass : undefined)

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  function clearPlayground() {
    pgOptions = DEFAULT_OPTIONS
    pgOptionsEnabled = true
    pgValue = 'Two'
    pgValueOn = true
    pgAriaLabel = 'default'
    pgAriaLabelOn = true
    pgSize = 'md'
    pgSizeOn = false
    pgPlaceholder = ''
    pgPlaceholderOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgClearable = 'no'
    pgClearableOn = false
    pgClearLabel = 'Clear'
    pgClearLabelOn = false
    pgClearPlacement = 'auto'
    pgClearPlacementOn = false
    pgDefaultValue = ''
    pgDefaultValueOn = false
    pgAlign = 'left'
    pgAlignOn = false
    pgAutoPlace = 'yes'
    pgAutoPlaceOn = true
    pgPanelClass = ''
    pgPanelClassOn = false
    pgStageWidth = AUTOCOMPLETE_STAGE_DEFAULT_WIDTH
  }

  const code = $derived.by(() =>
    buildAutoCompleteSnippet({
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      value: pgValue,
      size: pgSize,
      sizeOn: pgSizeOn,
      placeholder: pgPlaceholder,
      placeholderOn: pgPlaceholderOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      clearable: pgClearable,
      clearableOn: pgClearableOn,
      clearLabel: pgClearLabel,
      clearLabelOn: pgClearLabelOn,
      clearPlacement: pgClearPlacement,
      clearPlacementOn: pgClearPlacementOn,
      defaultValue: pgDefaultValue,
      defaultValueOn: pgDefaultValueOn,
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
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the field.', options: alignOptions, value: pgAlign, onChange: v => (pgAlign = v), placeholder: 'left', clearLabel: 'Clear align', enabled: pgAlignOn, setEnabled: v => (pgAlignOn = v) }),
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the combobox.', value: pgAriaLabel, onChange: v => (pgAriaLabel = v), clearable: true, enabled: pgAriaLabelOn, setEnabled: v => (pgAriaLabelOn = v) }),
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', value: pgAutoPlace, onChange: v => (pgAutoPlace = v as TriState), enabled: pgAutoPlaceOn, setEnabled: v => (pgAutoPlaceOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', value: pgClearLabel, onChange: v => (pgClearLabel = v), editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', enabled: pgClearLabelOn, setEnabled: v => (pgClearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto stays inside (no trailing adornment).', options: clearPlacementOptions, value: pgClearPlacement, onChange: v => (pgClearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pgClearPlacementOn, setEnabled: v => (pgClearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pgClearable, onChange: v => (pgClearable = v as TriState), enabled: pgClearableOn, setEnabled: v => (pgClearableOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', value: pgDefaultValue, onChange: v => (pgDefaultValue = v), editorDefaultValue: '', clearable: true, enabled: pgDefaultValueOn, setEnabled: v => (pgDefaultValueOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field; the panel never opens.', value: pgDisabled, onChange: v => (pgDisabled = v as TriState), enabled: pgDisabledOn, setEnabled: v => (pgDisabledOn = v) }),
    jsonField({
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      note: "Suggestion options; a bare string (or a missing label) displays as its own value. The eye resets to the default options.",
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
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', value: pgPlaceholder, onChange: v => (pgPlaceholder = v), clearable: true, enabled: pgPlaceholderOn, setEnabled: v => (pgPlaceholderOn = v) }),
    sizeField({ note: 'Field scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable input text; free-typed text persists; the eye resets to the default text.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: resetToggle(pgValueOn, enabled => (pgValueOn = enabled), () => (pgValue = 'Two')), sync: { kind: 'script', attr: 'value' } },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input element.' },
    { name: 'onClear', type: '() => void', defaultValue: 'clears value', note: 'Clear handler; falls back to clearing the bound value when omitted.' },
    { name: 'onSelect', type: '(value: string) => void', defaultValue: '—', note: "Called with the chosen option's value when an option is picked." }
  ])

</script>

<ShowcasePage
    {fields}
    title="AutoComplete"
    {code}
    onReset={clearPlayground}
    scope={{ options: pgOptions }}
    stage={{ minWidth: AUTOCOMPLETE_STAGE_MIN_WIDTH }}
    bind:stageWidth={pgStageWidth}

    sync={{ tag: 'AutoComplete' }}
    scopeRefresh={() => [pgOptions]}
  >
    <AutoComplete
      bind:value={pgValue}
      ariaLabel={pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : undefined}
      size={demoSize}
      placeholder={demoPlaceholder}
      disabled={disabled}
      align={demoAlign}
      autoPlace={autoPlace}
      panelClass={demoPanelClass}
      clearable={clearable}
      clearLabel={demoClearLabel}
      clearPlacement={demoClearPlacement}
      defaultValue={demoDefaultValue}
      options={pgOptions} />
    <span class="text-sm text-slate-400">value: {pgValue}</span>
  </ShowcasePage>
