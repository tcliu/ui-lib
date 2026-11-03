<script lang="ts">
  import { onMount } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import TextInput from '#lib/components/TextInput.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { enumField, textField, boolField, sizeField, snippetField } from '#showcase/playground/snippet-field.js'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import { appliedRatios, componentRatiosField } from '#showcase/playground/text-input-ratios.js'
  import { TEXT_INPUT_RATIOS, type TextInputRatioOverrides } from '#lib/components/text-input-metrics.js'
  import {
    buildTextInputSnippet,
    adornmentClassName,
    LEADING_SPAN,
    TRAILING_SPAN,
    TRAILER_SPAN,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  const INITIAL = {
    value: staged('', true),
    ariaLabel: staged('Apply', true),
    placeholder: staged(''),
    size: staged('md'),
    ratios: staged({} as TextInputRatioOverrides),
    disabled: staged('no' as TriState),
    hideOutline: staged('no' as TriState),
    readonly: staged('no' as TriState),
    required: staged('no' as TriState),
    id: staged(''),
    inputClass: staged(''),
    variant: staged('bordered'),
    className: staged(''),
    clearable: staged('no' as TriState),
    clearLabel: staged('Clear'),
    clearPlacement: staged('auto'),
    defaultValue: staged(''),
    autocomplete: staged(''),
    inputmode: staged(''),
    name: staged(''),
    type: staged('text'),
    inputStyle: staged(''),
    wrapperStyle: staged(''),
    leading: staged('', true),
    trailing: staged('', true),
    trailer: staged('', true),
  }
  let pg = $state(structuredClone(INITIAL))
  let demoInputRef = $state<HTMLInputElement | null>(null)

  onMount(() => {
    demoInputRef?.focus()
  })

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const variantOptions = [
    { value: 'bordered', label: 'bordered' },
    { value: 'embedded', label: 'embedded' },
  ]

  const demoAriaLabel = $derived(applied(pg.ariaLabel) || i18n.t('common.apply'))
  const demoAutocomplete = $derived(
    (applied(pg.autocomplete) || undefined) as HTMLInputAttributes['autocomplete'],
  )
  const demoInputmode = $derived((applied(pg.inputmode) || undefined) as HTMLInputAttributes['inputmode'])
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoRatios = $derived(appliedRatios(pg.ratios))
  const disabled = $derived(appliedFlag(pg.disabled))
  const hideOutline = $derived(appliedFlag(pg.hideOutline))
  const readonly = $derived(appliedFlag(pg.readonly))
  const required = $derived(appliedFlag(pg.required))
  const clearable = $derived(appliedFlag(pg.clearable))
  const demoClearLabel = $derived(applied(pg.clearLabel) || undefined)
  const demoClearPlacement = $derived(
    (applied(pg.clearPlacement) || undefined) as 'auto' | 'inside' | 'outside' | undefined,
  )
  const demoDefaultValue = $derived(applied(pg.defaultValue) || undefined)
  const demoVariant = $derived(
    (applied(pg.variant) || undefined) as 'bordered' | 'embedded' | undefined,
  )
  const demoClassName = $derived(
    adornmentClassName(applied(pg.className) ?? '', applied(pg.leading) ?? '', applied(pg.trailing) ?? '') ||
      undefined,
  )

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildTextInputSnippet({
      ariaLabel: pg.ariaLabel,
      value: pg.value,
      placeholder: pg.placeholder,
      size: pg.size,
      ratios: pg.ratios,
      disabled: pg.disabled,
      hideOutline: pg.hideOutline,
      readonly: pg.readonly,
      required: pg.required,
      id: pg.id,
      inputClass: pg.inputClass,
      variant: pg.variant,
      className: pg.className,
      clearable: pg.clearable,
      clearLabel: pg.clearLabel,
      clearPlacement: pg.clearPlacement,
      defaultValue: pg.defaultValue,
      autocomplete: pg.autocomplete,
      inputmode: pg.inputmode,
      name: pg.name,
      type: pg.type,
      inputStyle: pg.inputStyle,
      wrapperStyle: pg.wrapperStyle,
      leading: pg.leading,
      trailing: pg.trailing,
      trailer: pg.trailer,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the remaining
  // non-editable props (the bound ref and the function props, A–Z). The bound
  // value edits through the Value column like the SelectDropdown's committed
  // value.
  const fields: SyncableFieldConfig[] = $derived([
    {
      name: 'ariaLabel',
      type: 'string?',
      defaultValue: '—',
      note: 'Accessible name; optional so wrappers can leave it to an external label.',
      editor: 'text',
      clearable: true,
      ...eye(pg.ariaLabel),
      onChange: value => stage(pg.ariaLabel, value),
      toggle: eyeToggle(pg.ariaLabel),
      sync: { kind: 'scopeText', scopeRef: 'applyLabel' },
    },
    textField({ name: 'autocomplete', type: 'string?', defaultValue: '—', note: 'Native autocomplete token.', clearable: true, ...eye(pg.autocomplete) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes appended to the input.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', ...eye(pg.clearLabel) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto picks outside when a trailing adornment is set.', options: clearPlacementOptions, placeholder: 'auto', clearLabel: 'Clear placement', ...eye(pg.clearPlacement) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', ...eyeFlag(pg.clearable) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', editorDefaultValue: '', clearable: true, ...eye(pg.defaultValue) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input.', ...eyeFlag(pg.disabled) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the bordered field’s border and focus border while keeping its surface, padding, and text metrics.', ...eyeFlag(pg.hideOutline) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', clearable: true, ...eye(pg.id) }),
    textField({ name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default input classes.', clearable: true, ...eye(pg.inputClass) }),
    textField({ name: 'inputStyle', type: 'string?', defaultValue: '—', note: 'Inline style appended after the size metrics; sizes the field at runtime.', clearable: true, ...eye(pg.inputStyle) }),
    textField({ name: 'inputmode', type: 'string?', defaultValue: '—', note: 'Native inputmode; NumberInput drives numeric/decimal.', clearable: true, ...eye(pg.inputmode) }),
    snippetField({
      name: 'leading',
      note: 'Adornment block rendered before the text, positioned inside the frame.',
      value: pg.leading.value,
      onChange: value => stage(pg.leading, value),
      toggle: eyeToggle(pg.leading),
    }),
    textField({ name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name.', clearable: true, ...eye(pg.name) }),
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', clearable: true, ...eye(pg.placeholder) }),
    componentRatiosField({
      base: TEXT_INPUT_RATIOS,
      type: 'TextInputRatioOverrides?',
      note: 'Partial override of the field’s tunable ratios (font, radius, paddings, the clear box and gutter, and the trailer gap); the editor opens on the shared defaults, omitted keys keep them, the line box follows the font, and the clear inset follows padX.',
      value: pg.ratios,
    }),
    boolField({ name: 'readonly', defaultValue: 'false', note: 'Read-only input.', ...eyeFlag(pg.readonly) }),
    boolField({ name: 'required', defaultValue: 'false', note: 'Native required flag.', ...eyeFlag(pg.required) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    snippetField({
      name: 'trailer',
      note: 'Content rendered outside the field, after it, in a size-scaled row.',
      value: pg.trailer.value,
      onChange: value => stage(pg.trailer, value),
      toggle: eyeToggle(pg.trailer),
    }),
    snippetField({
      name: 'trailing',
      note: 'Adornment block rendered after the text, positioned inside the frame.',
      value: pg.trailing.value,
      onChange: value => stage(pg.trailing, value),
      toggle: eyeToggle(pg.trailing),
    }),
    textField({ name: 'type', type: 'string?', defaultValue: "'text'", note: 'Native input type; PasswordInput and SearchInput drive it.', editorDefaultValue: 'text', clearable: true, placeholder: 'text', ...eye(pg.type) }),
    {
      name: 'value',
      type: 'string',
      defaultValue: '—',
      note: 'Bindable field value; the eye resets it to empty.',
      editor: 'text',
      clearable: true,
      ...eye(pg.value),
      onChange: value => stage(pg.value, value),
      toggle: eyeResetToggle(pg.value, () => (pg.value.value = '')),
      sync: { kind: 'script' },
    },
    enumField({ name: 'variant', type: "'bordered' | 'embedded'", defaultValue: "'bordered'", note: 'Chrome variant; embedded drops the border, the background, and the focus ring for a field rendered inside another surface.', options: variantOptions, placeholder: 'bordered', clearLabel: 'Clear variant', ...eye(pg.variant) }),
    textField({ name: 'wrapperStyle', type: 'string?', defaultValue: '—', note: 'Metric custom properties for the adornments, set on the wrapping frame.', clearable: true, ...eye(pg.wrapperStyle) }),
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input.' },
    {
      name: 'onClear',
      type: '() => void',
      defaultValue: 'clears value',
      note: 'Clear handler; falls back to clearing the bound value when omitted.',
    },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'onfocus', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Focus callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
    {
      name: 'onpointercancel',
      type: '(event: PointerEvent) => void',
      defaultValue: '—',
      note: 'Pointer-cancel callback.',
    },
    { name: 'onpointerdown', type: '(event: PointerEvent) => void', defaultValue: '—', note: 'Pointer-down callback.' },
    { name: 'onpointerup', type: '(event: PointerEvent) => void', defaultValue: '—', note: 'Pointer-up callback.' },
  ])

</script>

{#snippet demoLeading()}
  <span class={LEADING_SPAN}>{pg.leading.value}</span>
{/snippet}

{#snippet demoTrailing()}
  <span class={TRAILING_SPAN}>{pg.trailing.value}</span>
{/snippet}

{#snippet demoTrailer()}
  <span class={TRAILER_SPAN}>{pg.trailer.value}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="TextInput"
    {code}
    onReset={clearPlayground}
    scope={{ applyLabel: i18n.t('common.apply') }}

    sync={{ tag: 'TextInput' }}
  >
    <div class="flex flex-col gap-1">
      <TextInput
        bind:value={pg.value.value}
        bind:inputRef={demoInputRef}
        ariaLabel={demoAriaLabel}
        placeholder={applied(pg.placeholder) || undefined}
        size={demoSize}
        ratios={demoRatios}
        {disabled}
        {readonly}
        {required}
        hideOutline={hideOutline}
        id={applied(pg.id) || undefined}
        type={applied(pg.type) || undefined}
        autocomplete={demoAutocomplete}
        inputmode={demoInputmode}
        name={applied(pg.name) || undefined}
        inputClass={applied(pg.inputClass) || undefined}
        variant={demoVariant}
        inputStyle={applied(pg.inputStyle) || undefined}
        wrapperStyle={applied(pg.wrapperStyle) || undefined}
        className={demoClassName}
        {clearable}
        clearLabel={demoClearLabel}
        clearPlacement={demoClearPlacement}
        defaultValue={demoDefaultValue}
        leading={applied(pg.leading) ? demoLeading : undefined}
        trailing={applied(pg.trailing) ? demoTrailing : undefined}
        trailer={applied(pg.trailer) ? demoTrailer : undefined} />
      <span class="text-sm text-slate-400">value: {pg.value.value || '—'}</span>
    </div>
  </ShowcasePage>
