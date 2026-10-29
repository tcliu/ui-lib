<script lang="ts">
  import { flagOn } from '$showcase/snippet-build'
  import AutoComplete from '$lib/components/AutoComplete.svelte'
  import type { SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { parseOptionArrayJson } from '$showcase/option-json'
  import { enumField, textField, boolField, sizeField, jsonField, resetToggle, snippetToggle } from '$showcase/snippet-field'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
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
  const INITIAL = {
    options: DEFAULT_OPTIONS,
    optionsEnabled: true,
    value: 'Two',
    valueOn: true,
    ariaLabel: 'default',
    ariaLabelOn: true,
    size: 'md',
    sizeOn: false,
    placeholder: '',
    placeholderOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    clearable: 'no' as TriState,
    clearableOn: false,
    clearLabel: 'Clear',
    clearLabelOn: false,
    clearPlacement: 'auto',
    clearPlacementOn: false,
    defaultValue: '',
    defaultValueOn: false,
    align: 'left',
    alignOn: false,
    autoPlace: 'yes' as TriState,
    autoPlaceOn: false,
    panelClass: '',
    panelClassOn: false,
    stageWidth: AUTOCOMPLETE_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires options, so the eye resets to the defaults
  // instead of omitting; committing re-applies.
  // Stage width is interaction state, not a curated option; Reset restores it.

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const demoPlaceholder = $derived(pg.placeholderOn && pg.placeholder ? pg.placeholder : undefined)
  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  const clearable = $derived(pg.clearableOn ? flagOn(pg.clearable) : undefined)
  const demoClearLabel = $derived(pg.clearLabelOn && pg.clearLabel ? pg.clearLabel : undefined)
  const demoClearPlacement = $derived(
    pg.clearPlacementOn
      ? ((pg.clearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pg.defaultValueOn && pg.defaultValue ? pg.defaultValue : undefined)
  const autoPlace = $derived(pg.autoPlaceOn ? flagOn(pg.autoPlace) : undefined)
  const demoAlign = $derived(pg.alignOn ? ((pg.align || undefined) as 'left' | 'right' | undefined) : undefined)
  const demoPanelClass = $derived(pg.panelClassOn && pg.panelClass ? pg.panelClass : undefined)

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildAutoCompleteSnippet({
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      value: pg.value,
      size: pg.size,
      sizeOn: pg.sizeOn,
      placeholder: pg.placeholder,
      placeholderOn: pg.placeholderOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      clearable: pg.clearable,
      clearableOn: pg.clearableOn,
      clearLabel: pg.clearLabel,
      clearLabelOn: pg.clearLabelOn,
      clearPlacement: pg.clearPlacement,
      clearPlacementOn: pg.clearPlacementOn,
      defaultValue: pg.defaultValue,
      defaultValueOn: pg.defaultValueOn,
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
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the field.', options: alignOptions, value: pg.align, onChange: v => (pg.align = v), placeholder: 'left', clearLabel: 'Clear align', enabled: pg.alignOn, setEnabled: v => (pg.alignOn = v) }),
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the combobox.', value: pg.ariaLabel, onChange: v => (pg.ariaLabel = v), clearable: true, enabled: pg.ariaLabelOn, setEnabled: v => (pg.ariaLabelOn = v) }),
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', value: pg.autoPlace, onChange: v => (pg.autoPlace = v as TriState), enabled: pg.autoPlaceOn, setEnabled: v => (pg.autoPlaceOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', value: pg.clearLabel, onChange: v => (pg.clearLabel = v), editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', enabled: pg.clearLabelOn, setEnabled: v => (pg.clearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto stays inside (no trailing adornment).', options: clearPlacementOptions, value: pg.clearPlacement, onChange: v => (pg.clearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pg.clearPlacementOn, setEnabled: v => (pg.clearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pg.clearable, onChange: v => (pg.clearable = v as TriState), enabled: pg.clearableOn, setEnabled: v => (pg.clearableOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', value: pg.defaultValue, onChange: v => (pg.defaultValue = v), editorDefaultValue: '', clearable: true, enabled: pg.defaultValueOn, setEnabled: v => (pg.defaultValueOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field; the panel never opens.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    jsonField({
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      note: "Suggestion options; a bare string (or a missing label) displays as its own value. The eye resets to the default options.",
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
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', value: pg.placeholder, onChange: v => (pg.placeholder = v), clearable: true, enabled: pg.placeholderOn, setEnabled: v => (pg.placeholderOn = v) }),
    sizeField({ note: 'Field scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable input text; free-typed text persists; the eye resets to the default text.', editor: 'text', clearable: true, value: pg.value, onChange: value => { pg.value = value; pg.valueOn = true; }, toggle: resetToggle(pg.valueOn, enabled => (pg.valueOn = enabled), () => (pg.value = 'Two')), sync: { kind: 'script', attr: 'value' } },
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
    scope={{ options: pg.options }}
    stage={{ minWidth: AUTOCOMPLETE_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'AutoComplete' }}
    scopeRefresh={() => [pg.options]}
  >
    <AutoComplete
      bind:value={pg.value}
      ariaLabel={pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : undefined}
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
      options={pg.options} />
    <span class="text-sm text-slate-400">value: {pg.value}</span>
  </ShowcasePage>
