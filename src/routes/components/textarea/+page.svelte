<script lang="ts">
  import TextArea, { TEXT_AREA_RATIOS, type TextAreaRatioOverrides } from '#lib/components/TextArea.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { enumField, textField, boolField, sizeField } from '#showcase/playground/snippet-field.js'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import { appliedRatios, componentRatiosField } from '#showcase/playground/text-input-ratios.js'
  import { buildTextAreaSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  const INITIAL = {
    value: staged('', true),
    ariaLabel: staged('Apply', true),
    placeholder: staged(''),
    rows: staged('3'),
    size: staged('md'),
    ratios: staged({} as TextAreaRatioOverrides),
    disabled: staged('no' as TriState),
    hideOutline: staged('no' as TriState),
    readonly: staged('no' as TriState),
    id: staged(''),
    inputClass: staged(''),
    variant: staged('bordered'),
    className: staged(''),
    clearable: staged('no' as TriState),
    clearLabel: staged('Clear'),
    clearPlacement: staged('auto'),
    defaultValue: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const variantOptions = [
    { value: 'bordered', label: 'bordered' },
    { value: 'embedded', label: 'embedded' },
  ]

  function asRows(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }

  const demoAriaLabel = $derived(applied(pg.ariaLabel) || i18n.t('common.apply'))
  const demoRows = $derived.by(() => {
    const value = applied(pg.rows)
    return value === undefined ? undefined : asRows(value)
  })
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoRatios = $derived(appliedRatios(pg.ratios))
  const disabled = $derived(appliedFlag(pg.disabled))
  const hideOutline = $derived(appliedFlag(pg.hideOutline))
  const readonly = $derived(appliedFlag(pg.readonly))
  const clearable = $derived(appliedFlag(pg.clearable))
  const demoClearLabel = $derived(applied(pg.clearLabel) || undefined)
  const demoClearPlacement = $derived(
    (applied(pg.clearPlacement) || undefined) as 'auto' | 'inside' | 'outside' | undefined,
  )
  const demoDefaultValue = $derived(applied(pg.defaultValue) || undefined)
  const demoVariant = $derived(
    (applied(pg.variant) || undefined) as 'bordered' | 'embedded' | undefined,
  )
  const demoClassName = $derived(applied(pg.className) || undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildTextAreaSnippet({
      ariaLabel: pg.ariaLabel,
      value: pg.value,
      placeholder: pg.placeholder,
      rows: pg.rows,
      size: pg.size,
      ratios: pg.ratios,
      disabled: pg.disabled,
      hideOutline: pg.hideOutline,
      readonly: pg.readonly,
      id: pg.id,
      inputClass: pg.inputClass,
      variant: pg.variant,
      className: pg.className,
      clearable: pg.clearable,
      clearLabel: pg.clearLabel,
      clearPlacement: pg.clearPlacement,
      defaultValue: pg.defaultValue,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // TextInput's.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.', editor: 'text', clearable: true, ...eye(pg.ariaLabel), onChange: value => stage(pg.ariaLabel, value), toggle: eyeToggle(pg.ariaLabel), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes appended after the base chrome; an embedded field takes its text rules here.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', ...eye(pg.clearLabel) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the editor’s first line; outside sits after it; auto renders inside.', options: clearPlacementOptions, placeholder: 'auto', clearLabel: 'Clear placement', ...eye(pg.clearPlacement) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', ...eyeFlag(pg.clearable) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', editorDefaultValue: '', clearable: true, ...eye(pg.defaultValue) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field.', ...eyeFlag(pg.disabled) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the field’s border and focus border while keeping its surface, padding, and text metrics.', ...eyeFlag(pg.hideOutline) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native textarea id.', clearable: true, ...eye(pg.id) }),
    textField({ name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default textarea classes.', clearable: true, ...eye(pg.inputClass) }),
    { name: 'inputRef', type: 'HTMLTextAreaElement | null', defaultValue: 'null', note: 'Bindable native textarea.' },
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', clearable: true, ...eye(pg.placeholder) }),
    componentRatiosField({
      base: TEXT_AREA_RATIOS,
      type: 'TextAreaRatioOverrides?',
      note: 'Partial override of the editor’s tunable ratios (font, radius, paddings, the clear box and gutter, and the outside row’s gap); the line box follows the font and the clear inset follows padX.',
      value: pg.ratios,
    }),
    boolField({ name: 'readonly', defaultValue: 'false', note: 'Read-only field.', ...eyeFlag(pg.readonly) }),
    { name: 'rows', type: 'number?', defaultValue: '3', editorDefaultValue: '3', note: 'Visible text rows.', editor: 'number', clearable: true, ...eye(pg.rows), onChange: value => stage(pg.rows, value), placeholder: '3', toggle: eyeToggle(pg.rows), sync: { kind: 'number', pattern: /^\d+$/ } },
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value; the eye resets it to empty.', editor: 'text', clearable: true, ...eye(pg.value), onChange: value => stage(pg.value, value), toggle: eyeResetToggle(pg.value, () => (pg.value.value = '')), sync: { kind: 'script' } },
    enumField({ name: 'variant', type: "'bordered' | 'embedded'", defaultValue: "'bordered'", note: 'Chrome variant; embedded drops the border, the background, and the focus ring for a field rendered inside another surface.', options: variantOptions, placeholder: 'bordered', clearLabel: 'Clear variant', ...eye(pg.variant) }),
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
  ])

</script>

<ShowcasePage
    {fields}
    title="TextArea"
    {code}
    onReset={clearPlayground}
    scope={{ applyLabel: i18n.t('common.apply') }}

    sync={{ tag: 'TextArea' }}
  >
    <div class="flex flex-col gap-1">
      <TextArea
        bind:value={pg.value.value}
        ariaLabel={demoAriaLabel}
        placeholder={applied(pg.placeholder) || undefined}
        rows={demoRows}
        size={demoSize}
        ratios={demoRatios}
        {disabled}
        {readonly}
        hideOutline={hideOutline}
        id={applied(pg.id) || undefined}
        inputClass={applied(pg.inputClass) || undefined}
        variant={demoVariant}
        className={demoClassName}
        {clearable}
        clearLabel={demoClearLabel}
        clearPlacement={demoClearPlacement}
        defaultValue={demoDefaultValue} />
      <span class="text-sm text-slate-400">value: {pg.value.value || '—'}</span>
    </div>
  </ShowcasePage>
