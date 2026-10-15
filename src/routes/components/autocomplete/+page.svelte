<script lang="ts">
  import AutoComplete from '$lib/components/AutoComplete.svelte'
  import type { SelectOption } from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { parseOptionArrayJson } from '$lib/showcase/option-json'
  import { jsonField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
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

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

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

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ options: pgOptions }),
    sync: { tag: 'AutoComplete', getFields: () => syncFields },
  })

  // The seed covers every override except the options array (the snippet reads
  // it from scope), so only options edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  useScopeRefresh(preview, () => [pgOptions])

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). Snippet edits map the same way through the preview's sync table.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the field; the eye stages the customization.', editor: 'enum', options: alignOptions, value: pgAlign, onChange: value => { pgAlign = value; pgAlignOn = true; }, placeholder: 'left', clearLabel: 'Clear align', toggle: snippetToggle(pgAlignOn, enabled => (pgAlignOn = enabled)), sync: { kind: 'text' } },
    { name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the combobox; the eye stages the customization.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'text' } },
    {
      name: 'autoPlace',
      type: 'boolean',
      defaultValue: 'true',
      note: 'Flips the panel when crowded; the eye stages the customization.', editor: 'boolean', value: pgAutoPlace, onChange: value => { pgAutoPlace = value as TriState; pgAutoPlaceOn = true; }, toggle: snippetToggle(pgAutoPlaceOn, enabled => (pgAutoPlaceOn = enabled)), sync: { kind: 'tri' },
    },
    { name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", editorDefaultValue: 'Clear', note: 'Accessible name for the clear button; the eye stages the customization.', editor: 'text', clearable: true, value: pgClearLabel, onChange: value => { pgClearLabel = value; pgClearLabelOn = true; }, toggle: snippetToggle(pgClearLabelOn, enabled => (pgClearLabelOn = enabled)), placeholder: 'Clear', sync: { kind: 'text' } },
    { name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto stays inside (no trailing adornment); the eye stages the customization.', editor: 'enum', options: clearPlacementOptions, value: pgClearPlacement, onChange: value => { pgClearPlacement = value; pgClearPlacementOn = true; }, placeholder: 'auto', clearLabel: 'Clear placement', toggle: snippetToggle(pgClearPlacementOn, enabled => (pgClearPlacementOn = enabled)), sync: { kind: 'text' } },
    { name: 'clearable', type: 'boolean', defaultValue: 'false', note: 'Appends a cross button that clears the value; the eye stages the customization.', editor: 'boolean', value: pgClearable, onChange: value => { pgClearable = value as TriState; pgClearableOn = true; }, toggle: snippetToggle(pgClearableOn, enabled => (pgClearableOn = enabled)), sync: { kind: 'tri' } },
    { name: 'defaultValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Baseline the clear button compares against; the cross hides while the value matches it; the eye stages the customization.', editor: 'text', clearable: true, value: pgDefaultValue, onChange: value => { pgDefaultValue = value; pgDefaultValueOn = true; }, toggle: snippetToggle(pgDefaultValueOn, enabled => (pgDefaultValueOn = enabled)), sync: { kind: 'text' } },
    {
      name: 'disabled',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Disables the field; the panel never opens; the eye stages the customization.', editor: 'boolean', value: pgDisabled, onChange: value => { pgDisabled = value as TriState; pgDisabledOn = true; }, toggle: snippetToggle(pgDisabledOn, enabled => (pgDisabledOn = enabled)), sync: { kind: 'tri' },
    },
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
    { name: 'panelClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the floating panel classes; the eye stages the customization.', editor: 'text', clearable: true, value: pgPanelClass, onChange: value => { pgPanelClass = value; pgPanelClassOn = true; }, toggle: snippetToggle(pgPanelClassOn, enabled => (pgPanelClassOn = enabled)), sync: { kind: 'text' } },
    { name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder; the eye stages the customization.', editor: 'text', clearable: true, value: pgPlaceholder, onChange: value => { pgPlaceholder = value; pgPlaceholderOn = true; }, toggle: snippetToggle(pgPlaceholderOn, enabled => (pgPlaceholderOn = enabled)), sync: { kind: 'text' } },
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number",
      defaultValue: "'md'",
      note: 'Field scale; numbers are icon-scale pixels interpolated between the steps; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, placeholder: 'md', clearLabel: 'Clear size', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => {
        const attr = attrs?.get('size')
        // Absent restores the default, like the builder omitting the line;
        // string and numeric shapes set, anything else is custom code the
        // playground leaves alone.
        if (!attr) return 'md'
        if (attr.kind === 'string') return attr.value
        if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
        return undefined
      } },
    },
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable input text; free-typed text persists; the eye resets to the default text.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: resetToggle(pgValueOn, enabled => (pgValueOn = enabled), () => (pgValue = 'Two')), sync: { kind: 'script', attr: 'value' } },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input element.' },
    { name: 'onClear', type: '() => void', defaultValue: 'clears value', note: 'Clear handler; falls back to clearing the bound value when omitted.' },
    { name: 'onSelect', type: '(value: string) => void', defaultValue: '—', note: "Called with the chosen option's value when an option is picked." }
  ])

  const syncFields = $derived(syncFieldsOf(fields))
</script>

<ShowcasePage
    {fields}
    title="AutoComplete"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ options: pgOptions }}
    stage={{ minWidth: AUTOCOMPLETE_STAGE_MIN_WIDTH }}
    bind:stageWidth={pgStageWidth}
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
