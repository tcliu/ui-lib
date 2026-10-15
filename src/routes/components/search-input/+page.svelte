<script lang="ts">
  import { onMount } from 'svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SearchInput from '$lib/components/SearchInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { snippetToggle, resetToggle } from '$lib/showcase/snippet-field'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { STYLED_INPUT, STYLED_WRAPPER, buildSearchInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // Style is a preset that fills the wrapper/input class fields below.
  let pgQuery = $state('')
  let pgQueryOn = $state(true)
  let pgAriaLabel = $state('Apply')
  let pgAriaLabelOn = $state(true)
  let pgPlaceholder = $state('Search...')
  let pgPlaceholderOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgStyled = $state('')
  let pgWrapperClass = $state('')
  let pgWrapperClassOn = $state(false)
  let pgInputClass = $state('')
  let pgInputClassOn = $state(false)
  let pgClearable = $state<TriState>('no')
  let pgClearableOn = $state(false)
  let pgClearLabel = $state('Clear')
  let pgClearLabelOn = $state(false)
  let pgClearPlacement = $state('auto')
  let pgClearPlacementOn = $state(false)
  let pgDefaultValue = $state('')
  let pgDefaultValueOn = $state(false)
  let demoInputRef = $state<HTMLInputElement | null>(null)

  onMount(() => {
    demoInputRef?.focus()
  })

  const styledOptions = [{ value: 'yes', label: 'Styled' }]

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const demoAriaLabel = $derived(pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : i18n.t('common.apply'))
  const clearable = $derived(pgClearableOn ? flagOn(pgClearable) : undefined)
  const demoClearLabel = $derived(pgClearLabelOn && pgClearLabel ? pgClearLabel : undefined)
  const demoClearPlacement = $derived(
    pgClearPlacementOn
      ? ((pgClearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pgDefaultValueOn && pgDefaultValue ? pgDefaultValue : undefined)
  const demoPlaceholder = $derived(pgPlaceholderOn && pgPlaceholder ? pgPlaceholder : undefined)
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const demoWrapperClass = $derived(pgWrapperClassOn && pgWrapperClass ? pgWrapperClass : undefined)
  const demoInputClass = $derived(pgInputClassOn && pgInputClass ? pgInputClass : undefined)

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      pgQuery = ''
    }
  }

  function clearPlayground() {
    pgQuery = ''
    pgQueryOn = true
    pgAriaLabel = 'Apply'
    pgAriaLabelOn = true
    pgPlaceholder = 'Search...'
    pgPlaceholderOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgStyled = ''
    pgWrapperClass = ''
    pgWrapperClassOn = false
    pgInputClass = ''
    pgInputClassOn = false
    pgClearable = 'no'
    pgClearableOn = false
    pgClearLabel = 'Clear'
    pgClearLabelOn = false
    pgClearPlacement = 'auto'
    pgClearPlacementOn = false
    pgDefaultValue = ''
    pgDefaultValueOn = false
  }

  const code = $derived.by(() =>
    buildSearchInputSnippet({
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      query: pgQuery,
      placeholder: pgPlaceholder,
      placeholderOn: pgPlaceholderOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      wrapperClass: pgWrapperClass,
      wrapperClassOn: pgWrapperClassOn,
      inputClass: pgInputClass,
      inputClassOn: pgInputClassOn,
      clearable: pgClearable,
      clearableOn: pgClearableOn,
      clearLabel: pgClearLabel,
      clearLabelOn: pgClearLabelOn,
      clearPlacement: pgClearPlacement,
      clearPlacementOn: pgClearPlacementOn,
      defaultValue: pgDefaultValue,
      defaultValueOn: pgDefaultValueOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ applyLabel: i18n.t('common.apply'), handleKeydown }),
    sync: { tag: 'SearchInput', getFields: () => syncFields },
  })

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // SelectDropdown's committed value.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name; the eye stages the customization.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    { name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", editorDefaultValue: 'Clear', note: 'Accessible name for the clear button; the eye stages the customization.', editor: 'text', clearable: true, value: pgClearLabel, onChange: value => { pgClearLabel = value; pgClearLabelOn = true; }, toggle: snippetToggle(pgClearLabelOn, enabled => (pgClearLabelOn = enabled)), placeholder: 'Clear', sync: { kind: 'text' } },
    { name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto stays inside (no trailing adornment); the eye stages the customization.', editor: 'enum', options: clearPlacementOptions, value: pgClearPlacement, onChange: value => { pgClearPlacement = value; pgClearPlacementOn = true; }, placeholder: 'auto', clearLabel: 'Clear placement', toggle: snippetToggle(pgClearPlacementOn, enabled => (pgClearPlacementOn = enabled)), sync: { kind: 'text' } },
    { name: 'clearable', type: 'boolean', defaultValue: 'false', note: 'Appends a cross button that clears the value; the eye stages the customization.', editor: 'boolean', value: pgClearable, onChange: value => { pgClearable = value as TriState; pgClearableOn = true; }, toggle: snippetToggle(pgClearableOn, enabled => (pgClearableOn = enabled)), sync: { kind: 'tri' } },
    { name: 'defaultValue', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Baseline the clear button compares against; the cross hides while the value matches it; the eye stages the customization.', editor: 'text', clearable: true, value: pgDefaultValue, onChange: value => { pgDefaultValue = value; pgDefaultValueOn = true; }, toggle: snippetToggle(pgDefaultValueOn, enabled => (pgDefaultValueOn = enabled)), sync: { kind: 'text' } },
    { name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default input classes; the eye stages the customization.', editor: 'text', clearable: true, value: pgInputClass, onChange: value => { pgInputClass = value; pgInputClassOn = true; }, toggle: snippetToggle(pgInputClassOn, enabled => (pgInputClassOn = enabled)), sync: { kind: 'text' } },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input.' },
    { name: 'placeholder', type: 'string?', defaultValue: "'Search...'", editorDefaultValue: 'Search...', note: 'Native placeholder; the eye stages the customization.', editor: 'text', clearable: true, value: pgPlaceholder, onChange: value => { pgPlaceholder = value; pgPlaceholderOn = true; }, toggle: snippetToggle(pgPlaceholderOn, enabled => (pgPlaceholderOn = enabled)), placeholder: 'Search...', sync: { kind: 'text' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Box, text, and icon scale together; numbers are icon-scale pixels interpolated between the steps; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', placeholder: 'md', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'text' } },
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable search text; the eye resets it to empty.', editor: 'text', clearable: true, value: pgQuery, onChange: value => { pgQuery = value; pgQueryOn = true; }, toggle: resetToggle(pgQueryOn, enabled => (pgQueryOn = enabled), () => (pgQuery = '')), sync: { kind: 'script', attr: 'query' } },
    { name: 'wrapperClass', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the outer wrapper; the eye stages the customization.', editor: 'text', clearable: true, value: pgWrapperClass, onChange: value => { pgWrapperClass = value; pgWrapperClassOn = true; }, toggle: snippetToggle(pgWrapperClassOn, enabled => (pgWrapperClassOn = enabled)), sync: { kind: 'text' } },
    { name: 'onClear', type: '() => void', defaultValue: 'clears value', note: 'Clear handler; falls back to clearing the bound value when omitted.' },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'onfocus', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Focus callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback; Escape clears in this demo.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))
</script>

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; the style
    preset below drives two props at once (a composite preset), so it stays
    here. -->
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Style">
      <SelectDropdown
        buttonLabel={pgStyled ? 'Styled' : 'Default'}
        activeValue={pgStyled}
        ariaLabel="Style"
        options={styledOptions}
        onSelect={value => {
          pgStyled = value
          pgWrapperClass = STYLED_WRAPPER
          pgWrapperClassOn = true
          pgInputClass = STYLED_INPUT
          pgInputClassOn = true
        }}
        clearable
        clearLabel="Clear style"
        onClear={() => {
          pgStyled = ''
          pgWrapperClass = ''
          pgWrapperClassOn = false
          pgInputClass = ''
          pgInputClassOn = false
        }} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage
    {fields}
    title="SearchInput"
    {code}
    {preview}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{ applyLabel: i18n.t('common.apply'), handleKeydown }}
>
    <div class="flex flex-col gap-1">
      <SearchInput
        bind:value={pgQuery}
        bind:inputRef={demoInputRef}
        ariaLabel={demoAriaLabel}
        onkeydown={handleKeydown}
        placeholder={demoPlaceholder}
        size={demoSize}
        wrapperClass={demoWrapperClass}
        inputClass={demoInputClass}
        {clearable}
        clearLabel={demoClearLabel}
        clearPlacement={demoClearPlacement}
        defaultValue={demoDefaultValue} />
      <span class="text-sm text-slate-400">value: {pgQuery || '—'}</span>
    </div>
  </ShowcasePage>
