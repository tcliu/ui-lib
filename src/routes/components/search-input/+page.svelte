<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import { onMount } from 'svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SearchInput from '$lib/components/SearchInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { enumField, textField, boolField, sizeField, snippetToggle, resetToggle } from '$lib/showcase/snippet-field'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { STYLED_INPUT, STYLED_WRAPPER, buildSearchInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // Style is a preset that fills the wrapper/input class fields below.
  const INITIAL = {
    query: '',
    queryOn: true,
    ariaLabel: 'Apply',
    ariaLabelOn: true,
    placeholder: 'Search...',
    placeholderOn: false,
    size: 'md',
    sizeOn: false,
    styled: '',
    wrapperClass: '',
    wrapperClassOn: false,
    inputClass: '',
    inputClassOn: false,
    clearable: 'no' as TriState,
    clearableOn: false,
    clearLabel: 'Clear',
    clearLabelOn: false,
    clearPlacement: 'auto',
    clearPlacementOn: false,
    defaultValue: '',
    defaultValueOn: false,
  }
  let pg = $state(structuredClone(INITIAL))
  let demoInputRef = $state<HTMLInputElement | null>(null)

  onMount(() => {
    demoInputRef?.focus()
  })

  const styledOptions = [{ value: 'yes', label: 'Styled' }]

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const demoAriaLabel = $derived(pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : i18n.t('common.apply'))
  const clearable = $derived(pg.clearableOn ? flagOn(pg.clearable) : undefined)
  const demoClearLabel = $derived(pg.clearLabelOn && pg.clearLabel ? pg.clearLabel : undefined)
  const demoClearPlacement = $derived(
    pg.clearPlacementOn
      ? ((pg.clearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pg.defaultValueOn && pg.defaultValue ? pg.defaultValue : undefined)
  const demoPlaceholder = $derived(pg.placeholderOn && pg.placeholder ? pg.placeholder : undefined)
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const demoWrapperClass = $derived(pg.wrapperClassOn && pg.wrapperClass ? pg.wrapperClass : undefined)
  const demoInputClass = $derived(pg.inputClassOn && pg.inputClass ? pg.inputClass : undefined)

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      pg.query = ''
    }
  }

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildSearchInputSnippet({
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      query: pg.query,
      placeholder: pg.placeholder,
      placeholderOn: pg.placeholderOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      wrapperClass: pg.wrapperClass,
      wrapperClassOn: pg.wrapperClassOn,
      inputClass: pg.inputClass,
      inputClassOn: pg.inputClassOn,
      clearable: pg.clearable,
      clearableOn: pg.clearableOn,
      clearLabel: pg.clearLabel,
      clearLabelOn: pg.clearLabelOn,
      clearPlacement: pg.clearPlacement,
      clearPlacementOn: pg.clearPlacementOn,
      defaultValue: pg.defaultValue,
      defaultValueOn: pg.defaultValueOn,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // SelectDropdown's committed value.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.', editor: 'text', clearable: true, value: pg.ariaLabel, onChange: value => { pg.ariaLabel = value; pg.ariaLabelOn = true; }, toggle: snippetToggle(pg.ariaLabelOn, enabled => (pg.ariaLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', value: pg.clearLabel, onChange: v => (pg.clearLabel = v), editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', enabled: pg.clearLabelOn, setEnabled: v => (pg.clearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto stays inside (no trailing adornment).', options: clearPlacementOptions, value: pg.clearPlacement, onChange: v => (pg.clearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pg.clearPlacementOn, setEnabled: v => (pg.clearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pg.clearable, onChange: v => (pg.clearable = v as TriState), enabled: pg.clearableOn, setEnabled: v => (pg.clearableOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', value: pg.defaultValue, onChange: v => (pg.defaultValue = v), editorDefaultValue: '', clearable: true, enabled: pg.defaultValueOn, setEnabled: v => (pg.defaultValueOn = v) }),
    textField({ name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default input classes.', value: pg.inputClass, onChange: v => (pg.inputClass = v), clearable: true, enabled: pg.inputClassOn, setEnabled: v => (pg.inputClassOn = v) }),
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input.' },
    textField({ name: 'placeholder', type: 'string?', defaultValue: "'Search...'", note: 'Native placeholder.', value: pg.placeholder, onChange: v => (pg.placeholder = v), editorDefaultValue: 'Search...', clearable: true, placeholder: 'Search...', enabled: pg.placeholderOn, setEnabled: v => (pg.placeholderOn = v) }),
    sizeField({ note: 'Box, text, and icon scale together; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable search text; the eye resets it to empty.', editor: 'text', clearable: true, value: pg.query, onChange: value => { pg.query = value; pg.queryOn = true; }, toggle: resetToggle(pg.queryOn, enabled => (pg.queryOn = enabled), () => (pg.query = '')), sync: { kind: 'script', attr: 'query' } },
    textField({ name: 'wrapperClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the outer wrapper.', value: pg.wrapperClass, onChange: v => (pg.wrapperClass = v), editorDefaultValue: '', clearable: true, enabled: pg.wrapperClassOn, setEnabled: v => (pg.wrapperClassOn = v) }),
    { name: 'onClear', type: '() => void', defaultValue: 'clears value', note: 'Clear handler; falls back to clearing the bound value when omitted.' },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'onfocus', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Focus callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback; Escape clears in this demo.' },
  ])

</script>

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; the style
    preset below drives two props at once (a composite preset), so it stays
    here. -->
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Style">
      <SelectDropdown
        buttonLabel={pg.styled ? 'Styled' : 'Default'}
        activeValue={pg.styled}
        ariaLabel="Style"
        options={styledOptions}
        onSelect={value => {
          pg.styled = value
          pg.wrapperClass = STYLED_WRAPPER
          pg.wrapperClassOn = true
          pg.inputClass = STYLED_INPUT
          pg.inputClassOn = true
        }}
        clearable
        clearLabel="Clear style"
        onClear={() => {
          pg.styled = ''
          pg.wrapperClass = ''
          pg.wrapperClassOn = false
          pg.inputClass = ''
          pg.inputClassOn = false
        }} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.size}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => {
          pg.size = value
          pg.sizeOn = true
        }}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size = 'md'
          pg.sizeOn = false
        }} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage
    {fields}
    title="SearchInput"
    {code}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{ applyLabel: i18n.t('common.apply'), handleKeydown }}

    sync={{ tag: 'SearchInput' }}
  >
    <div class="flex flex-col gap-1">
      <SearchInput
        bind:value={pg.query}
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
      <span class="text-sm text-slate-400">value: {pg.query || '—'}</span>
    </div>
  </ShowcasePage>
