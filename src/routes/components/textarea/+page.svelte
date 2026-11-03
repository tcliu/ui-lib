<script lang="ts">
  import TextArea from '$lib/components/TextArea.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/playground/size-input'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { textField, boolField, sizeField } from '$showcase/playground/snippet-field'
  import { type TriState } from '$showcase/playground/snippet-build'
  import { appliedRatios, componentRatiosField } from '$showcase/playground/text-input-ratios'
  import { FIELD_RATIOS, type FieldRatioOverrides } from '$lib/components/input-chrome'
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
    ratios: staged({} as FieldRatioOverrides),
    disabled: staged('no' as TriState),
    hideOutline: staged('no' as TriState),
    readonly: staged('no' as TriState),
    id: staged(''),
    inputClass: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))

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
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // TextInput's.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.', editor: 'text', clearable: true, ...eye(pg.ariaLabel), onChange: value => stage(pg.ariaLabel, value), toggle: eyeToggle(pg.ariaLabel), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field.', ...eyeFlag(pg.disabled) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the field’s border and focus border while keeping its surface, padding, and text metrics.', ...eyeFlag(pg.hideOutline) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native textarea id.', clearable: true, ...eye(pg.id) }),
    textField({ name: 'inputClass', type: 'string?', defaultValue: 'built-in', note: 'Replaces the default textarea classes.', clearable: true, ...eye(pg.inputClass) }),
    { name: 'inputRef', type: 'HTMLTextAreaElement | null', defaultValue: 'null', note: 'Bindable native textarea.' },
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Native placeholder.', clearable: true, ...eye(pg.placeholder) }),
    componentRatiosField({
      base: FIELD_RATIOS,
      type: 'FieldRatioOverrides?',
      note: 'Partial override of the field’s tunable ratios (font, radius, paddings); the line box follows the font and the editor opens on the shared defaults.',
      value: pg.ratios,
    }),
    boolField({ name: 'readonly', defaultValue: 'false', note: 'Read-only field.', ...eyeFlag(pg.readonly) }),
    { name: 'rows', type: 'number?', defaultValue: '3', editorDefaultValue: '3', note: 'Visible text rows.', editor: 'number', clearable: true, ...eye(pg.rows), onChange: value => stage(pg.rows, value), placeholder: '3', toggle: eyeToggle(pg.rows), sync: { kind: 'number', pattern: /^\d+$/ } },
    sizeField({ note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value; the eye resets it to empty.', editor: 'text', clearable: true, ...eye(pg.value), onChange: value => stage(pg.value, value), toggle: eyeResetToggle(pg.value, () => (pg.value.value = '')), sync: { kind: 'script' } },
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
        inputClass={applied(pg.inputClass) || undefined} />
      <span class="text-sm text-slate-400">value: {pg.value.value || '—'}</span>
    </div>
  </ShowcasePage>
