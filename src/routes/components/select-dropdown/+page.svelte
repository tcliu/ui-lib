<script lang="ts">
  import SelectDropdown, { type SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/playground/size-input'
  import { parseOptionArrayJson } from '$showcase/playground/option-json'
  import { enumField, textField, boolField, sizeField, jsonField } from '$showcase/playground/snippet-field'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { type TriState } from '$showcase/playground/snippet-build'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import {
    buildSelectDropdownSnippet,
    SELECT_STAGE_DEFAULT_WIDTH,
    SELECT_STAGE_MIN_WIDTH,
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
    options: staged(DEFAULT_OPTIONS, true),
    value: staged('two', true),
    defaultValue: staged(''),
    ariaLabel: staged('default', true),
    buttonLabel: staged(''),
    size: staged('md'),
    filterable: staged('no' as TriState),
    allowCustomValue: staged('no' as TriState),
    buttonClass: staged(''),
    controlClass: staged(''),
    optionClass: staged(''),
    emptyLabel: staged(''),
    clearable: staged('no' as TriState),
    clearLabel: staged('Clear selection'),
    align: staged('left'),
    autoPlace: staged('yes' as TriState),
    panelClass: staged(''),
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

  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const filterable = $derived(appliedFlag(pg.filterable))
  const allowCustomValue = $derived(appliedFlag(pg.allowCustomValue))
  const clearable = $derived(appliedFlag(pg.clearable))
  const autoPlace = $derived(appliedFlag(pg.autoPlace))
  const demoAlign = $derived((applied(pg.align) || undefined) as 'left' | 'right' | undefined)
  const demoButtonClass = $derived(applied(pg.buttonClass) || undefined)
  const demoControlClass = $derived(applied(pg.controlClass) || undefined)
  const demoOptionClass = $derived(applied(pg.optionClass) || undefined)
  const demoEmptyLabel = $derived(applied(pg.emptyLabel) || undefined)
  const demoDefaultValue = $derived(applied(pg.defaultValue) || undefined)
  const demoClearLabel = $derived(applied(pg.clearLabel) || undefined)
  const demoPanelClass = $derived(applied(pg.panelClass) || undefined)

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
      buttonLabel: pg.buttonLabel,
      value: pg.value,
      defaultValue: pg.defaultValue,
      size: pg.size,
      filterable: pg.filterable,
      allowCustomValue: pg.allowCustomValue,
      buttonClass: pg.buttonClass,
      controlClass: pg.controlClass,
      optionClass: pg.optionClass,
      emptyLabel: pg.emptyLabel,
      clearable: pg.clearable,
      clearLabel: pg.clearLabel,
      align: pg.align,
      autoPlace: pg.autoPlace,
      panelClass: pg.panelClass,
    }),
  )

  
  // The seed covers every override except the options array (the snippet reads
  // it from scope), so only options edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). Snippet edits map the same way through the preview's sync table.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'activeValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Committed option value (not its label); marked in the panel.', editor: 'text', clearable: true, ...eye(pg.value), onChange: value => stage(pg.value, value), toggle: eyeToggle(pg.value), sync: { kind: 'script', attr: 'value', literalAttr: 'activeValue' } },
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.', options: alignOptions, placeholder: 'left', clearLabel: 'Clear align', ...eye(pg.align) }),
    boolField({ name: 'allowCustomValue', defaultValue: 'false', note: 'Enter commits typed text that matches no option (filterable only).', ...eyeFlag(pg.allowCustomValue) }),
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the control.', clearable: true, ...eye(pg.ariaLabel) }),
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', ...eyeFlag(pg.autoPlace) }),
    textField({ name: 'buttonClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the trigger button box classes.', clearable: true, ...eye(pg.buttonClass) }),
    textField({ name: 'buttonLabel', type: 'string?', defaultValue: 'derived', note: "Overrides the trigger label; omit it and the trigger shows the committed option's label (or the raw value).", clearable: true, ...eye(pg.buttonLabel) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear selection'", note: 'Accessible name for the clear button.', editorDefaultValue: 'Clear selection', clearable: true, placeholder: 'Clear selection', ...eye(pg.clearLabel) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', ...eyeFlag(pg.clearable) }),
    textField({ name: 'controlClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the filterable trigger box classes.', clearable: true, ...eye(pg.controlClass) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against: the option value (not its label); the cross hides while the committed value matches it.', editorDefaultValue: '', clearable: true, ...eye(pg.defaultValue) }),
    textField({ name: 'emptyLabel', type: 'string?', defaultValue: '—', note: 'Shown when the filtered list is empty.', clearable: true, ...eye(pg.emptyLabel) }),
    boolField({ name: 'filterable', defaultValue: 'false', note: 'Renders a combobox input with filtering.', ...eyeFlag(pg.filterable) }),
    textField({ name: 'optionClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the option row classes.', clearable: true, ...eye(pg.optionClass) }),
    jsonField({
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      note: "Selectable options; a bare string (or a missing label) displays as its own value. The eye resets to the default options.",
      value: JSON.stringify(pg.options.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseOptionArrayJson(draft)
        if (parsed) {
          stage(pg.options, parsed)
        }
      },
      dialog: { valid: (draft: string) => parseOptionArrayJson(draft) != null, invalidMessage: 'Invalid options JSON. Use an array of strings or { value, label? } objects.' },
      toggle: eyeResetToggle(pg.options, () => (pg.options.value = DEFAULT_OPTIONS)),
    }),
    textField({ name: 'panelClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the floating panel classes.', clearable: true, ...eye(pg.panelClass) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
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
    scope={{ options: pg.options.value }}
    stage={{ minWidth: SELECT_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'SelectDropdown' }}
    scopeRefresh={() => [pg.options.value]}
  >
    <SelectDropdown
      buttonLabel={applied(pg.buttonLabel) || undefined}
      activeValue={applied(pg.value) || undefined}
      defaultValue={demoDefaultValue}
      ariaLabel={applied(pg.ariaLabel) || undefined}
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
      options={pg.options.value}
      onSelect={next => (pg.value.value = next)} />
    <span class="text-sm text-slate-400">value: {pg.value.value}</span>
  </ShowcasePage>
