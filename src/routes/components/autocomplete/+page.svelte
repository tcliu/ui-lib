<script lang="ts">
  import AutoComplete, { AUTOCOMPLETE_RATIOS } from '#lib/components/AutoComplete.svelte'
  import type { SelectOption } from '#lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import { parseOptionArrayJson } from '#showcase/playground/option-json.js'
  import { enumField, textField, boolField, sizeField, jsonField } from '#showcase/playground/snippet-field.js'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, stage, staged } from '#showcase/playground/staged.js'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import { appliedRatios, componentRatiosField } from '#showcase/playground/text-input-ratios.js'
  import type { AutoCompleteRatioOverrides } from '#lib/components/AutoComplete.svelte'
  import {
    buildAutoCompleteSnippet,
    AUTOCOMPLETE_STAGE_DEFAULT_WIDTH,
    AUTOCOMPLETE_STAGE_MIN_WIDTH,
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
    options: staged(DEFAULT_OPTIONS, true),
    value: staged('Two', true),
    ariaLabel: staged('default', true),
    size: staged('md'),
    ratios: staged({} as AutoCompleteRatioOverrides),
    placeholder: staged(''),
    disabled: staged('no' as TriState),
    variant: staged('bordered'),
    hideOutline: staged('no' as TriState),
    clearable: staged('no' as TriState),
    clearLabel: staged('Clear'),
    clearPlacement: staged('auto'),
    defaultValue: staged(''),
    align: staged('left'),
    autoPlace: staged('yes' as TriState),
    panelClass: staged(''),
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

  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoPlaceholder = $derived(applied(pg.placeholder) || undefined)
  const demoRatios = $derived(appliedRatios(pg.ratios))
  const disabled = $derived(appliedFlag(pg.disabled))
  const clearable = $derived(appliedFlag(pg.clearable))
  const demoClearLabel = $derived(applied(pg.clearLabel) || undefined)
  const demoClearPlacement = $derived(
    (applied(pg.clearPlacement) || undefined) as 'auto' | 'inside' | 'outside' | undefined,
  )
  const demoDefaultValue = $derived(applied(pg.defaultValue) || undefined)
  const autoPlace = $derived(appliedFlag(pg.autoPlace))
  const demoAlign = $derived((applied(pg.align) || undefined) as 'left' | 'right' | undefined)
  const demoPanelClass = $derived(applied(pg.panelClass) || undefined)
  const hideOutline = $derived(appliedFlag(pg.hideOutline))
  const demoVariant = $derived(
    (applied(pg.variant) || undefined) as 'bordered' | 'embedded' | undefined,
  )

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  const variantOptions = [
    { value: 'bordered', label: 'bordered' },
    { value: 'embedded', label: 'embedded' },
  ]

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildAutoCompleteSnippet({
      ariaLabel: pg.ariaLabel,
      value: pg.value,
      size: pg.size,
      ratios: pg.ratios,
      placeholder: pg.placeholder,
      disabled: pg.disabled,
      variant: pg.variant,
      hideOutline: pg.hideOutline,
      clearable: pg.clearable,
      clearLabel: pg.clearLabel,
      clearPlacement: pg.clearPlacement,
      defaultValue: pg.defaultValue,
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
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the field.', options: alignOptions, placeholder: 'left', clearLabel: 'Clear align', ...eye(pg.align) }),
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the combobox.', clearable: true, ...eye(pg.ariaLabel) }),
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', ...eyeFlag(pg.autoPlace) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', ...eye(pg.clearLabel) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto stays inside (no trailing adornment).', options: clearPlacementOptions, placeholder: 'auto', clearLabel: 'Clear placement', ...eye(pg.clearPlacement) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', ...eyeFlag(pg.clearable) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', editorDefaultValue: '', clearable: true, ...eye(pg.defaultValue) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field; the panel never opens.', ...eyeFlag(pg.disabled) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the bordered field’s border and focus border while keeping its surface, padding, and text metrics.', ...eyeFlag(pg.hideOutline) }),
    jsonField({
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      note: "Suggestion options; a bare string (or a missing label) displays as its own value. The eye resets to the default options.",
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
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', clearable: true, ...eye(pg.placeholder) }),
    componentRatiosField({ base: AUTOCOMPLETE_RATIOS, type: 'AutoCompleteRatioOverrides?', note: 'Partial override of the field and panel ratios; the panel line follows the font.', value: pg.ratios }),
    sizeField({ note: 'Field scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable input text; free-typed text persists; the eye resets to the default text.', editor: 'text', clearable: true, ...eye(pg.value), onChange: value => stage(pg.value, value), toggle: eyeResetToggle(pg.value, () => (pg.value.value = 'Two')), sync: { kind: 'script', attr: 'value' } },
    enumField({ name: 'variant', type: "'bordered' | 'embedded'", defaultValue: "'bordered'", note: 'Chrome variant; embedded drops the border, the background, and the focus ring for a field rendered inside another surface.', options: variantOptions, placeholder: 'bordered', clearLabel: 'Clear variant', ...eye(pg.variant) }),
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
    scope={{ options: pg.options.value }}
    stage={{ minWidth: AUTOCOMPLETE_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'AutoComplete' }}
    scopeRefresh={() => [pg.options.value]}
  >
    <AutoComplete
      bind:value={pg.value.value}
      ariaLabel={applied(pg.ariaLabel) || undefined}
      size={demoSize}
      ratios={demoRatios}
      placeholder={demoPlaceholder}
      disabled={disabled}
      hideOutline={hideOutline}
      align={demoAlign}
      autoPlace={autoPlace}
      variant={demoVariant}
      panelClass={demoPanelClass}
      clearable={clearable}
      clearLabel={demoClearLabel}
      clearPlacement={demoClearPlacement}
      defaultValue={demoDefaultValue}
      options={pg.options.value} />
    <span class="text-sm text-slate-400">value: {pg.value.value}</span>
  </ShowcasePage>
