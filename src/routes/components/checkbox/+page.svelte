<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import Checkbox from '$lib/components/Checkbox.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { textField, boolField, sizeField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
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

  
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name when no visible label.', value: pgAriaLabel, onChange: v => (pgAriaLabel = v), clearable: true, enabled: pgAriaLabelOn, setEnabled: v => (pgAriaLabelOn = v) }),
    { name: 'checked', type: 'boolean', defaultValue: '—', note: 'Bindable checked state; drives the live demo (the seed reads it from scope); the eye resets to the default state.', editor: 'boolean', value: pgChecked ? 'yes' : 'no', onChange: value => { pgChecked = value === 'yes'; pgCheckedOn = true; }, toggle: resetToggle(pgCheckedOn, enabled => (pgCheckedOn = enabled), () => (pgChecked = true)) },
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input.', value: pgDisabled, onChange: v => (pgDisabled = v as TriState), enabled: pgDisabledOn, setEnabled: v => (pgDisabledOn = v) }),
    boolField({ name: 'indeterminate', defaultValue: 'false', note: 'Mixed state glyph.', value: pgIndeterminate, onChange: v => (pgIndeterminate = v as TriState), enabled: pgIndeterminateOn, setEnabled: v => (pgIndeterminateOn = v) }),
    { name: 'label', type: 'string?', defaultValue: '—', note: 'Visible label; also the accessible name.', editor: 'text', clearable: true, value: pgLabel, onChange: value => { pgLabel = value; pgLabelOn = true; }, toggle: snippetToggle(pgLabelOn, enabled => (pgLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    textField({ name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name.', value: pgName, onChange: v => (pgName = v), clearable: true, enabled: pgNameOn, setEnabled: v => (pgNameOn = v) }),
    sizeField({ note: 'Box and label size; numbers settle on the nearest tier.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    boolField({ name: 'stopPropagation', defaultValue: 'true', note: 'Stops the click bubbling to clickable rows.', value: pgStopPropagation, onChange: v => (pgStopPropagation = v as TriState), enabled: pgStopPropagationOn, setEnabled: v => (pgStopPropagationOn = v) }),
    textField({ name: 'wrapperClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the wrapping label.', value: pgWrapperClass, onChange: v => (pgWrapperClass = v), editorDefaultValue: '', clearable: true, enabled: pgWrapperClassOn, setEnabled: v => (pgWrapperClassOn = v) }),
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input element.' },
    { name: 'onChange', type: '(checked: boolean) => void', defaultValue: '—', note: 'Called with the next checked value.' },
  ])


  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  </script>

<ShowcasePage
    {fields}
    title="Checkbox"
    {code}
    onReset={clearPlayground}
    scope={{ checked: pgChecked, lastChange: pgLastChange, applyLabel: i18n.t('common.apply') }}

    sync={{ tag: 'Checkbox' }}
    scopeRefresh={() => [demoLabel]}
    scopeRefreshWhen={() => pgLabel === ''}
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
