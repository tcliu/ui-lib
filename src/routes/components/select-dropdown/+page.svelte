<script lang="ts">
  import { flagOn } from '$showcase/snippet-build'
  import SelectDropdown, { type SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { parseOptionArrayJson } from '$showcase/option-json'
  import { enumField, textField, boolField, sizeField, jsonField, resetToggle, snippetToggle } from '$showcase/snippet-field'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
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
  const INITIAL = {
    options: DEFAULT_OPTIONS,
    optionsEnabled: true,
    value: 'two',
    valueOn: true,
    defaultValue: '',
    defaultValueOn: false,
    ariaLabel: 'default',
    ariaLabelOn: true,
    buttonLabel: '',
    buttonLabelOn: false,
    size: 'md',
    sizeOn: false,
    filterable: 'no' as TriState,
    filterableOn: false,
    allowCustomValue: 'no' as TriState,
    allowCustomValueOn: false,
    buttonClass: '',
    buttonClassOn: false,
    controlClass: '',
    controlClassOn: false,
    optionClass: '',
    optionClassOn: false,
    emptyLabel: '',
    emptyLabelOn: false,
    clearable: 'no' as TriState,
    clearableOn: false,
    clearLabel: 'Clear selection',
    clearLabelOn: false,
    align: 'left',
    alignOn: false,
    autoPlace: 'yes' as TriState,
    autoPlaceOn: false,
    panelClass: '',
    panelClassOn: false,
    stageWidth: SELECT_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))
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

  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const filterable = $derived(pg.filterableOn ? flagOn(pg.filterable) : undefined)
  const allowCustomValue = $derived(pg.allowCustomValueOn ? flagOn(pg.allowCustomValue) : undefined)
  const clearable = $derived(pg.clearableOn ? flagOn(pg.clearable) : undefined)
  const autoPlace = $derived(pg.autoPlaceOn ? flagOn(pg.autoPlace) : undefined)
  const demoAlign = $derived(pg.alignOn ? ((pg.align || undefined) as 'left' | 'right' | undefined) : undefined)
  const demoButtonClass = $derived(pg.buttonClassOn && pg.buttonClass ? pg.buttonClass : undefined)
  const demoControlClass = $derived(pg.controlClassOn && pg.controlClass ? pg.controlClass : undefined)
  const demoOptionClass = $derived(pg.optionClassOn && pg.optionClass ? pg.optionClass : undefined)
  const demoEmptyLabel = $derived(pg.emptyLabelOn && pg.emptyLabel ? pg.emptyLabel : undefined)
  const demoDefaultValue = $derived(pg.defaultValueOn && pg.defaultValue ? pg.defaultValue : undefined)
  const demoClearLabel = $derived(pg.clearLabelOn && pg.clearLabel ? pg.clearLabel : undefined)
  const demoPanelClass = $derived(pg.panelClassOn && pg.panelClass ? pg.panelClass : undefined)

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildSelectDropdownSnippet({
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      buttonLabel: pg.buttonLabel,
      buttonLabelOn: pg.buttonLabelOn,
      value: pg.value,
      valueOn: pg.valueOn,
      defaultValue: pg.defaultValue,
      defaultValueOn: pg.defaultValueOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      filterable: pg.filterable,
      filterableOn: pg.filterableOn,
      allowCustomValue: pg.allowCustomValue,
      allowCustomValueOn: pg.allowCustomValueOn,
      buttonClass: pg.buttonClass,
      buttonClassOn: pg.buttonClassOn,
      controlClass: pg.controlClass,
      controlClassOn: pg.controlClassOn,
      optionClass: pg.optionClass,
      optionClassOn: pg.optionClassOn,
      emptyLabel: pg.emptyLabel,
      emptyLabelOn: pg.emptyLabelOn,
      clearable: pg.clearable,
      clearableOn: pg.clearableOn,
      clearLabel: pg.clearLabel,
      clearLabelOn: pg.clearLabelOn,
      align: pg.align,
      alignOn: pg.alignOn,
      autoPlace: pg.autoPlace,
      autoPlaceOn: pg.autoPlaceOn,
      panelClass: pg.panelClass,
      panelClassOn: pg.panelClassOn,
    }),
  )

  
  // The seed covers every override except the options array (the snippet reads
  // it from scope), so only options edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). Snippet edits map the same way through the preview's sync table.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'activeValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Committed option value (not its label); marked in the panel.', editor: 'text', clearable: true, value: pg.value, onChange: value => { pg.value = value; pg.valueOn = true; }, toggle: snippetToggle(pg.valueOn, enabled => (pg.valueOn = enabled)), sync: { kind: 'script', attr: 'value', literalAttr: 'activeValue' } },
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.', options: alignOptions, value: pg.align, onChange: v => (pg.align = v), placeholder: 'left', clearLabel: 'Clear align', enabled: pg.alignOn, setEnabled: v => (pg.alignOn = v) }),
    boolField({ name: 'allowCustomValue', defaultValue: 'false', note: 'Enter commits typed text that matches no option (filterable only).', value: pg.allowCustomValue, onChange: v => (pg.allowCustomValue = v as TriState), enabled: pg.allowCustomValueOn, setEnabled: v => (pg.allowCustomValueOn = v) }),
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the control.', value: pg.ariaLabel, onChange: v => (pg.ariaLabel = v), clearable: true, enabled: pg.ariaLabelOn, setEnabled: v => (pg.ariaLabelOn = v) }),
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', value: pg.autoPlace, onChange: v => (pg.autoPlace = v as TriState), enabled: pg.autoPlaceOn, setEnabled: v => (pg.autoPlaceOn = v) }),
    textField({ name: 'buttonClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the trigger button box classes.', value: pg.buttonClass, onChange: v => (pg.buttonClass = v), clearable: true, enabled: pg.buttonClassOn, setEnabled: v => (pg.buttonClassOn = v) }),
    textField({ name: 'buttonLabel', type: 'string?', defaultValue: 'derived', note: "Overrides the trigger label; omit it and the trigger shows the committed option's label (or the raw value).", value: pg.buttonLabel, onChange: v => (pg.buttonLabel = v), clearable: true, enabled: pg.buttonLabelOn, setEnabled: v => (pg.buttonLabelOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear selection'", note: 'Accessible name for the clear button.', value: pg.clearLabel, onChange: v => (pg.clearLabel = v), editorDefaultValue: 'Clear selection', clearable: true, placeholder: 'Clear selection', enabled: pg.clearLabelOn, setEnabled: v => (pg.clearLabelOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pg.clearable, onChange: v => (pg.clearable = v as TriState), enabled: pg.clearableOn, setEnabled: v => (pg.clearableOn = v) }),
    textField({ name: 'controlClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the filterable trigger box classes.', value: pg.controlClass, onChange: v => (pg.controlClass = v), clearable: true, enabled: pg.controlClassOn, setEnabled: v => (pg.controlClassOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against: the option value (not its label); the cross hides while the committed value matches it.', value: pg.defaultValue, onChange: v => (pg.defaultValue = v), editorDefaultValue: '', clearable: true, enabled: pg.defaultValueOn, setEnabled: v => (pg.defaultValueOn = v) }),
    textField({ name: 'emptyLabel', type: 'string?', defaultValue: '—', note: 'Shown when the filtered list is empty.', value: pg.emptyLabel, onChange: v => (pg.emptyLabel = v), clearable: true, enabled: pg.emptyLabelOn, setEnabled: v => (pg.emptyLabelOn = v) }),
    boolField({ name: 'filterable', defaultValue: 'false', note: 'Renders a combobox input with filtering.', value: pg.filterable, onChange: v => (pg.filterable = v as TriState), enabled: pg.filterableOn, setEnabled: v => (pg.filterableOn = v) }),
    textField({ name: 'optionClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the option row classes.', value: pg.optionClass, onChange: v => (pg.optionClass = v), clearable: true, enabled: pg.optionClassOn, setEnabled: v => (pg.optionClassOn = v) }),
    jsonField({
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      note: "Selectable options; a bare string (or a missing label) displays as its own value. The eye resets to the default options.",
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
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
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
    scope={{ options: pg.options }}
    stage={{ minWidth: SELECT_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'SelectDropdown' }}
    scopeRefresh={() => [pg.options]}
  >
    <SelectDropdown
      buttonLabel={pg.buttonLabelOn && pg.buttonLabel ? pg.buttonLabel : undefined}
      activeValue={pg.valueOn && pg.value ? pg.value : undefined}
      defaultValue={demoDefaultValue}
      ariaLabel={pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : undefined}
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
      options={pg.options}
      onSelect={next => (pg.value = next)} />
    <span class="text-sm text-slate-400">value: {pg.value}</span>
  </ShowcasePage>
