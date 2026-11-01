<script lang="ts">
  import { onMount } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import PasswordInput from '$lib/components/PasswordInput.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/playground/size-input'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, stage, staged } from '$showcase/playground/staged'
  import { enumField, textField, boolField, sizeField } from '$showcase/playground/snippet-field'
  import { type TriState } from '$showcase/playground/snippet-build'
  import { buildPasswordInputSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  const INITIAL = {
    value: staged('', true),
    placeholder: staged(''),
    size: staged('md'),
    showLabel: staged(''),
    hideLabel: staged(''),
    disabled: staged('no' as TriState),
    hideOutline: staged('no' as TriState),
    required: staged('no' as TriState),
    clearable: staged('no' as TriState),
    clearLabel: staged('Clear'),
    clearPlacement: staged('auto'),
    defaultValue: staged(''),
    className: staged(''),
    autocomplete: staged('current-password'),
    id: staged(''),
    name: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))
  let pwdDemo = $state<{ focus: () => void } | null>(null)

  onMount(() => {
    pwdDemo?.focus()
  })

  const clearPlacementOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'inside', label: 'inside' },
    { value: 'outside', label: 'outside' },
  ]

  const disabled = $derived(appliedFlag(pg.disabled))
  const hideOutline = $derived(appliedFlag(pg.hideOutline))
  const required = $derived(appliedFlag(pg.required))
  const clearable = $derived(appliedFlag(pg.clearable))
  const demoClearLabel = $derived(applied(pg.clearLabel) || undefined)
  const demoClearPlacement = $derived(
    (applied(pg.clearPlacement) || undefined) as 'auto' | 'inside' | 'outside' | undefined,
  )
  const demoDefaultValue = $derived(applied(pg.defaultValue) || undefined)
  const demoAutocomplete = $derived(
    (applied(pg.autocomplete) || undefined) as HTMLInputAttributes['autocomplete'],
  )
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildPasswordInputSnippet({
      value: pg.value,
      placeholder: pg.placeholder,
      showLabel: pg.showLabel,
      hideLabel: pg.hideLabel,
      size: pg.size,
      disabled: pg.disabled,
      hideOutline: pg.hideOutline,
      required: pg.required,
      clearable: pg.clearable,
      clearLabel: pg.clearLabel,
      clearPlacement: pg.clearPlacement,
      defaultValue: pg.defaultValue,
      className: pg.className,
      autocomplete: pg.autocomplete,
      id: pg.id,
      name: pg.name,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'autocomplete', type: 'string?', defaultValue: "'current-password'", note: 'Native autocomplete token.', editorDefaultValue: 'current-password', clearable: true, placeholder: 'current-password', ...eye(pg.autocomplete) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the input.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', ...eye(pg.clearLabel) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto renders outside because the toggle owns the right edge.', options: clearPlacementOptions, placeholder: 'auto', clearLabel: 'Clear placement', ...eye(pg.clearPlacement) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', ...eyeFlag(pg.clearable) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', editorDefaultValue: '', clearable: true, ...eye(pg.defaultValue) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field and the toggle.', ...eyeFlag(pg.disabled) }),
    textField({ name: 'hideLabel', type: 'string?', defaultValue: '—', note: 'Toggle label when visible; falls back to the locale.', clearable: true, ...eye(pg.hideLabel) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the field’s border and focus border while keeping its surface, padding, and text metrics.', ...eyeFlag(pg.hideOutline) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', clearable: true, ...eye(pg.id) }),
    textField({ name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name.', clearable: true, ...eye(pg.name) }),
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Placeholder text.', clearable: true, ...eye(pg.placeholder) }),
    boolField({ name: 'required', defaultValue: 'false', note: 'Native required flag.', ...eyeFlag(pg.required) }),
    textField({ name: 'showLabel', type: 'string?', defaultValue: '—', note: 'Toggle label when hidden; falls back to the locale.', clearable: true, ...eye(pg.showLabel) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels scaled by fixed ratios.', ...eye(pg.size) }),
    { name: 'value', type: 'string', defaultValue: "''", editorDefaultValue: '', note: 'Bindable field value; the eye resets it to empty.', editor: 'text', clearable: true, ...eye(pg.value), onChange: value => stage(pg.value, value), toggle: eyeResetToggle(pg.value, () => (pg.value.value = '')), sync: { kind: 'script' } },
    { name: 'onClear', type: '() => void', defaultValue: 'clears value', note: 'Clear handler; falls back to clearing the bound value when omitted.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Native input handler.' }
  ])

</script>

<ShowcasePage
    {fields}
    title="PasswordInput"
    {code}
    onReset={clearPlayground}

    sync={{ tag: 'PasswordInput' }}
    scope={{}}
  >
    <PasswordInput
      bind:this={pwdDemo}
      bind:value={pg.value.value}
      placeholder={applied(pg.placeholder) || 'Password'}
      size={demoSize}
      showLabel={applied(pg.showLabel) || undefined}
      hideLabel={applied(pg.hideLabel) || undefined}
      {disabled}
      {required}
      hideOutline={hideOutline}
      autocomplete={demoAutocomplete}
      id={applied(pg.id) || undefined}
      name={applied(pg.name) || undefined}
      className={applied(pg.className) || undefined}
      {clearable}
      clearLabel={demoClearLabel}
      clearPlacement={demoClearPlacement}
      defaultValue={demoDefaultValue} />
    <span class="text-sm text-slate-400">length: {pg.value.value.length}</span>
  </ShowcasePage>
