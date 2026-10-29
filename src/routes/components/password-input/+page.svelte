<script lang="ts">
  import { flagOn } from '$showcase/snippet-build'
  import { onMount } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PasswordInput from '$lib/components/PasswordInput.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, snippetToggle, resetToggle } from '$showcase/snippet-field'
  import { buildPasswordInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  const INITIAL = {
    value: '',
    valueOn: true,
    placeholder: '',
    placeholderOn: false,
    size: 'md',
    sizeOn: false,
    showLabel: '',
    showLabelOn: false,
    hideLabel: '',
    hideLabelOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    hideOutline: 'no' as TriState,
    hideOutlineOn: false,
    required: 'no' as TriState,
    requiredOn: false,
    clearable: 'no' as TriState,
    clearableOn: false,
    clearLabel: 'Clear',
    clearLabelOn: false,
    clearPlacement: 'auto',
    clearPlacementOn: false,
    defaultValue: '',
    defaultValueOn: false,
    className: '',
    classNameOn: false,
    autocomplete: 'current-password',
    autocompleteOn: false,
    id: '',
    idOn: false,
    name: '',
    nameOn: false,
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

  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  const hideOutline = $derived(pg.hideOutlineOn ? flagOn(pg.hideOutline) : undefined)
  const required = $derived(pg.requiredOn ? flagOn(pg.required) : undefined)
  const clearable = $derived(pg.clearableOn ? flagOn(pg.clearable) : undefined)
  const demoClearLabel = $derived(pg.clearLabelOn && pg.clearLabel ? pg.clearLabel : undefined)
  const demoClearPlacement = $derived(
    pg.clearPlacementOn
      ? ((pg.clearPlacement || undefined) as 'auto' | 'inside' | 'outside' | undefined)
      : undefined,
  )
  const demoDefaultValue = $derived(pg.defaultValueOn && pg.defaultValue ? pg.defaultValue : undefined)
  const demoAutocomplete = $derived((pg.autocompleteOn && pg.autocomplete ? pg.autocomplete : undefined) as HTMLInputAttributes['autocomplete'])
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildPasswordInputSnippet({
      value: pg.value,
      placeholder: pg.placeholder,
      placeholderOn: pg.placeholderOn,
      showLabel: pg.showLabel,
      showLabelOn: pg.showLabelOn,
      hideLabel: pg.hideLabel,
      hideLabelOn: pg.hideLabelOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      hideOutline: pg.hideOutline,
      hideOutlineOn: pg.hideOutlineOn,
      required: pg.required,
      requiredOn: pg.requiredOn,
      clearable: pg.clearable,
      clearableOn: pg.clearableOn,
      clearLabel: pg.clearLabel,
      clearLabelOn: pg.clearLabelOn,
      clearPlacement: pg.clearPlacement,
      clearPlacementOn: pg.clearPlacementOn,
      defaultValue: pg.defaultValue,
      defaultValueOn: pg.defaultValueOn,
      className: pg.className,
      classNameOn: pg.classNameOn,
      autocomplete: pg.autocomplete,
      autocompleteOn: pg.autocompleteOn,
      id: pg.id,
      idOn: pg.idOn,
      name: pg.name,
      nameOn: pg.nameOn,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'autocomplete', type: 'string?', defaultValue: "'current-password'", note: 'Native autocomplete token.', value: pg.autocomplete, onChange: v => (pg.autocomplete = v), editorDefaultValue: 'current-password', clearable: true, placeholder: 'current-password', enabled: pg.autocompleteOn, setEnabled: v => (pg.autocompleteOn = v) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the input.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: '', clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    textField({ name: 'clearLabel', type: 'string?', defaultValue: "'Clear'", note: 'Accessible name for the clear button.', value: pg.clearLabel, onChange: v => (pg.clearLabel = v), editorDefaultValue: 'Clear', clearable: true, placeholder: 'Clear', enabled: pg.clearLabelOn, setEnabled: v => (pg.clearLabelOn = v) }),
    enumField({ name: 'clearPlacement', type: "'auto' | 'inside' | 'outside'", defaultValue: "'auto'", note: 'Inside overlays the field edge; outside sits after it; auto renders outside because the toggle owns the right edge.', options: clearPlacementOptions, value: pg.clearPlacement, onChange: v => (pg.clearPlacement = v), placeholder: 'auto', clearLabel: 'Clear placement', enabled: pg.clearPlacementOn, setEnabled: v => (pg.clearPlacementOn = v) }),
    boolField({ name: 'clearable', defaultValue: 'false', note: 'Appends a cross button that clears the value.', value: pg.clearable, onChange: v => (pg.clearable = v as TriState), enabled: pg.clearableOn, setEnabled: v => (pg.clearableOn = v) }),
    textField({ name: 'defaultValue', type: 'string?', defaultValue: "''", note: 'Baseline the clear button compares against; the cross hides while the value matches it.', value: pg.defaultValue, onChange: v => (pg.defaultValue = v), editorDefaultValue: '', clearable: true, enabled: pg.defaultValueOn, setEnabled: v => (pg.defaultValueOn = v) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the field and the toggle.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    textField({ name: 'hideLabel', type: 'string?', defaultValue: '—', note: 'Toggle label when visible; falls back to the locale.', value: pg.hideLabel, onChange: v => (pg.hideLabel = v), clearable: true, enabled: pg.hideLabelOn, setEnabled: v => (pg.hideLabelOn = v) }),
    boolField({ name: 'hideOutline', defaultValue: 'false', note: 'Drops the field’s border and focus border while keeping its surface, padding, and text metrics.', value: pg.hideOutline, onChange: v => (pg.hideOutline = v as TriState), enabled: pg.hideOutlineOn, setEnabled: v => (pg.hideOutlineOn = v) }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native input id.', value: pg.id, onChange: v => (pg.id = v), clearable: true, enabled: pg.idOn, setEnabled: v => (pg.idOn = v) }),
    textField({ name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name.', value: pg.name, onChange: v => (pg.name = v), clearable: true, enabled: pg.nameOn, setEnabled: v => (pg.nameOn = v) }),
    textField({ name: 'placeholder', type: 'string?', defaultValue: '—', note: 'Placeholder text.', value: pg.placeholder, onChange: v => (pg.placeholder = v), clearable: true, enabled: pg.placeholderOn, setEnabled: v => (pg.placeholderOn = v) }),
    boolField({ name: 'required', defaultValue: 'false', note: 'Native required flag.', value: pg.required, onChange: v => (pg.required = v as TriState), enabled: pg.requiredOn, setEnabled: v => (pg.requiredOn = v) }),
    textField({ name: 'showLabel', type: 'string?', defaultValue: '—', note: 'Toggle label when hidden; falls back to the locale.', value: pg.showLabel, onChange: v => (pg.showLabel = v), clearable: true, enabled: pg.showLabelOn, setEnabled: v => (pg.showLabelOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels scaled by fixed ratios.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'value', type: 'string', defaultValue: "''", editorDefaultValue: '', note: 'Bindable field value; the eye resets it to empty.', editor: 'text', clearable: true, value: pg.value, onChange: value => { pg.value = value; pg.valueOn = true; }, toggle: resetToggle(pg.valueOn, enabled => (pg.valueOn = enabled), () => (pg.value = '')), sync: { kind: 'script' } },
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
      bind:value={pg.value}
      placeholder={pg.placeholderOn && pg.placeholder ? pg.placeholder : 'Password'}
      size={demoSize}
      showLabel={pg.showLabelOn && pg.showLabel ? pg.showLabel : undefined}
      hideLabel={pg.hideLabelOn && pg.hideLabel ? pg.hideLabel : undefined}
      {disabled}
      {required}
      hideOutline={hideOutline}
      autocomplete={demoAutocomplete}
      id={pg.idOn && pg.id ? pg.id : undefined}
      name={pg.nameOn && pg.name ? pg.name : undefined}
      className={pg.classNameOn && pg.className ? pg.className : undefined}
      {clearable}
      clearLabel={demoClearLabel}
      clearPlacement={demoClearPlacement}
      defaultValue={demoDefaultValue} />
    <span class="text-sm text-slate-400">length: {pg.value.length}</span>
  </ShowcasePage>
