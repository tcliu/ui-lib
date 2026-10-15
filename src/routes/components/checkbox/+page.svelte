<script lang="ts">
  import Checkbox from '$lib/components/Checkbox.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildCheckboxSnippet, type TriState } from './demo-snippet'
  import { parseSizeValue } from '$lib/showcase/size-input'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgChecked`/`pgLastChange` are interaction state, not curated options.
  let pgChecked = $state(true)
  let pgCheckedOn = $state(true)
  let pgLastChange = $state('—')
  let pgLabel = $state('Apply')
  let pgLabelOn = $state(true)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgIndeterminate = $state<TriState>('no')
  let pgIndeterminateOn = $state(false)
  let pgWrapperClass = $state('')
  let pgWrapperClassOn = $state(false)
  let pgAriaLabel = $state('')
  let pgAriaLabelOn = $state(false)
  let pgName = $state('')
  let pgNameOn = $state(false)
  let pgStopPropagation = $state<TriState>('yes')
  let pgStopPropagationOn = $state(true)

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const indeterminate = $derived(pgIndeterminateOn ? flagOn(pgIndeterminate) : undefined)
  const stopPropagation = $derived(pgStopPropagationOn ? flagOn(pgStopPropagation) : undefined)
  const demoLabel = $derived(pgLabelOn && pgLabel ? pgLabel : i18n.t('common.apply'))
  const demoAriaLabel = $derived(pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : undefined)
  const demoName = $derived(pgNameOn && pgName ? pgName : undefined)

  function clearPlayground() {
    pgChecked = true
    pgCheckedOn = true
    pgLastChange = '—'
    pgLabel = 'Apply'
    pgLabelOn = true
    pgSize = 'md'
    pgSizeOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgIndeterminate = 'no'
    pgIndeterminateOn = false
    pgWrapperClass = ''
    pgWrapperClassOn = false
    pgAriaLabel = ''
    pgAriaLabelOn = false
    pgName = ''
    pgNameOn = false
    pgStopPropagation = 'yes'
    pgStopPropagationOn = true
  }

  const code = $derived.by(() =>
    buildCheckboxSnippet({
      label: pgLabel,
      labelOn: pgLabelOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      indeterminate: pgIndeterminate,
      indeterminateOn: pgIndeterminateOn,
      wrapperClass: pgWrapperClass,
      wrapperClassOn: pgWrapperClassOn,
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      name: pgName,
      nameOn: pgNameOn,
      stopPropagation: pgStopPropagation,
      stopPropagationOn: pgStopPropagationOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      checked: pgChecked,
      lastChange: pgLastChange,
      applyLabel: i18n.t('common.apply'),
    }),
    sync: { tag: 'Checkbox', getFields: () => syncFields },
  })

  const fields: SyncableFieldConfig[] = $derived([
    { name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name when no visible label; the eye stages the customization.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'checked', type: 'boolean', defaultValue: '—', note: 'Bindable checked state; drives the live demo (the seed reads it from scope); the eye resets to the default state.', editor: 'boolean', value: pgChecked ? 'yes' : 'no', onChange: value => { pgChecked = value === 'yes'; pgCheckedOn = true; }, toggle: resetToggle(pgCheckedOn, enabled => (pgCheckedOn = enabled), () => (pgChecked = true)) },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input; the eye stages the customization.', editor: 'boolean', value: pgDisabled, onChange: value => { pgDisabled = value as TriState; pgDisabledOn = true; }, toggle: snippetToggle(pgDisabledOn, enabled => (pgDisabledOn = enabled)), sync: { kind: 'tri' } },
    { name: 'indeterminate', type: 'boolean', defaultValue: 'false', note: 'Mixed state glyph; the eye stages the customization.', editor: 'boolean', value: pgIndeterminate, onChange: value => { pgIndeterminate = value as TriState; pgIndeterminateOn = true; }, toggle: snippetToggle(pgIndeterminateOn, enabled => (pgIndeterminateOn = enabled)), sync: { kind: 'tri' } },
    { name: 'label', type: 'string?', defaultValue: '—', note: 'Visible label; also the accessible name; the eye stages the customization.', editor: 'text', clearable: true, value: pgLabel, onChange: value => { pgLabel = value; pgLabelOn = true; }, toggle: snippetToggle(pgLabelOn, enabled => (pgLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    { name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name; the eye stages the customization.', editor: 'text', clearable: true, value: pgName, onChange: value => { pgName = value; pgNameOn = true; }, toggle: snippetToggle(pgNameOn, enabled => (pgNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Box and label size; numbers settle on the nearest tier; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', placeholder: 'md', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => {
      const attr = attrs?.get('size')
    // Absent restores the default, like the builder omitting the line;
      // string and numeric shapes set, anything else is custom code the
      // playground leaves alone.
      if (!attr) return 'md'
      if (attr.kind === 'string') return attr.value
      if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
      return undefined
    } } },
    { name: 'stopPropagation', type: 'boolean', defaultValue: 'true', note: 'Stops the click bubbling to clickable rows; the eye stages the customization.', editor: 'boolean', value: pgStopPropagation, onChange: value => { pgStopPropagation = value as TriState; pgStopPropagationOn = true; }, toggle: snippetToggle(pgStopPropagationOn, enabled => (pgStopPropagationOn = enabled)), sync: { kind: 'tri' } },
    { name: 'wrapperClass', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the wrapping label; the eye stages the customization.', editor: 'text', clearable: true, value: pgWrapperClass, onChange: value => { pgWrapperClass = value; pgWrapperClassOn = true; }, toggle: snippetToggle(pgWrapperClassOn, enabled => (pgWrapperClassOn = enabled)), sync: { kind: 'text' } },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input element.' },
    { name: 'onChange', type: '(checked: boolean) => void', defaultValue: '—', note: 'Called with the next checked value.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  useScopeRefresh(preview, () => [demoLabel], () => pgLabel === '')
</script>

<ShowcasePage
    {fields}
    title="Checkbox"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ checked: pgChecked, lastChange: pgLastChange, applyLabel: i18n.t('common.apply') }}
>
    <Checkbox
      bind:checked={pgChecked}
      label={demoLabel}
      ariaLabel={demoAriaLabel}
      name={demoName}
      stopPropagation={stopPropagation}
      size={demoSize}
      disabled={disabled}
      indeterminate={indeterminate}
      wrapperClass={pgWrapperClassOn && pgWrapperClass ? pgWrapperClass : undefined}
      onChange={checked => (pgLastChange = String(checked))} />
    <p class="text-sm text-slate-400">checked: {pgChecked}, lastChange: {pgLastChange}</p>
  </ShowcasePage>
