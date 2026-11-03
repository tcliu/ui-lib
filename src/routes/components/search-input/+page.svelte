<script lang="ts">
  import { onMount } from 'svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SearchInput, { SEARCH_INPUT_RATIOS } from '$lib/components/SearchInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/playground/size-input'
  import { enumField, textField, boolField, sizeField } from '$showcase/playground/snippet-field'
  import { appliedRatios, componentRatiosField } from '$showcase/playground/text-input-ratios'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { type TriState } from '$showcase/playground/snippet-build'
  import type { SearchInputRatioOverrides } from '$lib/components/SearchInput.svelte'
  import { STYLED_INPUT, STYLED_WRAPPER, buildSearchInputSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // Style is a preset that fills the wrapper/input class fields below.
  const INITIAL = {
    query: staged('', true),
    ariaLabel: staged('Apply', true),
    placeholder: staged('Search...'),
    size: staged('md'),
    ratios: staged({} as SearchInputRatioOverrides),
    styled: '',
    wrapperClass: staged(''),
    inputClass: staged(''),
    clearable: staged('no' as TriState),
    clearLabel: staged('Clear'),
    clearPlacement: staged('auto'),
    defaultValue: staged(''),
    hideOutline: staged('no' as TriState),
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

  const demoAriaLabel = $derived(applied(pg.ariaLabel) || i18n.t('common.apply'))
  const clearable = $derived(appliedFlag(pg.clearable))
  const demoClearLabel = $derived(applied(pg.clearLabel) || undefined)
  const demoClearPlacement = $derived(
    (applied(pg.clearPlacement) || undefined) as 'auto' | 'inside' | 'outside' | undefined,
  )
  const demoDefaultValue = $derived(applied(pg.defaultValue) || undefined)
  const hideOutline = $derived(appliedFlag(pg.hideOutline))
  const demoPlaceholder = $derived(applied(pg.placeholder) || undefined)
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoRatios = $derived(appliedRatios(pg.ratios))
  const demoWrapperClass = $derived(applied(pg.wrapperClass) || undefined)
  const demoInputClass = $derived(applied(pg.inputClass) || undefined)

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      pg.query.value = ''
    }
  }

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildSearchInputSnippet({
      ariaLabel: pg.ariaLabel,
      query: pg.query,
      placeholder: pg.placeholder,
      size: pg.size,
      ratios: pg.ratios,
      wrapperClass: pg.wrapperClass,
      inputClass: pg.inputClass,
      clearable: pg.clearable,
      clearLabel: pg.clearLabel,
      clearPlacement: pg.clearPlacement,
      defaultValue: pg.defaultValue,
      hideOutline: pg.hideOutline,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // SelectDropdown's committed value.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.', editor: 'text', clearable: true, ...eye(pg.ariaLabel), onChange: value => stage(pg.ariaLabel, value), toggle: eyeToggle(pg.ariaLabel), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', ...eye(pg.clearLabel) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto stays inside (no trailing adornment).', options: clearPlacementOptions, placeholder: 'auto', clearLabel: 'Clear placement', ...eye(pg.clearPlacement) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', ...eyeFlag(pg.clearable) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', editorDefaultValue: '', clearable: true, ...eye(pg.defaultValue) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the field’s border and focus border while keeping its surface, padding, and text metrics.', ...eyeFlag(pg.hideOutline) }),
    textField({ name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default input classes.', clearable: true, ...eye(pg.inputClass) }),
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input.' },
    textField({ name: 'placeholder', type: 'string?', defaultValue: "'Search...'", note: 'Native placeholder.', editorDefaultValue: 'Search...', clearable: true, placeholder: 'Search...', ...eye(pg.placeholder) }),
    componentRatiosField({ base: SEARCH_INPUT_RATIOS, type: 'SearchInputRatioOverrides?', note: 'Partial override of the field and search-icon ratios; the gutter derives from the icon inset, glyph, and gap.', value: pg.ratios }),
    sizeField({ note: 'Box, text, and icon scale together; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable search text; the eye resets it to empty.', editor: 'text', clearable: true, ...eye(pg.query), onChange: value => stage(pg.query, value), toggle: eyeResetToggle(pg.query, () => (pg.query.value = '')), sync: { kind: 'script', attr: 'query' } },
    textField({ name: 'wrapperClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the outer wrapper.', editorDefaultValue: '', clearable: true, ...eye(pg.wrapperClass) }),
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
          stage(pg.wrapperClass, STYLED_WRAPPER)
          stage(pg.inputClass, STYLED_INPUT)
        }}
        clearable
        clearLabel="Clear style"
        onClear={() => {
          pg.styled = ''
          pg.wrapperClass.value = ''
          pg.wrapperClass.on = false
          pg.inputClass.value = ''
          pg.inputClass.on = false
        }} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.size.value}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => {
          stage(pg.size, value)
        }}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size.value = 'md'
          pg.size.on = false
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
        bind:value={pg.query.value}
        bind:inputRef={demoInputRef}
        ariaLabel={demoAriaLabel}
        onkeydown={handleKeydown}
        placeholder={demoPlaceholder}
        size={demoSize}
        ratios={demoRatios}
        wrapperClass={demoWrapperClass}
        inputClass={demoInputClass}
        hideOutline={hideOutline}
        {clearable}
        clearLabel={demoClearLabel}
        clearPlacement={demoClearPlacement}
        defaultValue={demoDefaultValue} />
      <span class="text-sm text-slate-400">value: {pg.query.value || '—'}</span>
    </div>
  </ShowcasePage>
