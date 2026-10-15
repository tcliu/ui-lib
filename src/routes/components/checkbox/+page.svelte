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
  const INITIAL = {
    checked: true,
    checkedOn: true,
    lastChange: '—',
    label: 'Apply',
    labelOn: true,
    size: 'md',
    sizeOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    indeterminate: 'no' as TriState,
    indeterminateOn: false,
    wrapperClass: '',
    wrapperClassOn: false,
    ariaLabel: '',
    ariaLabelOn: false,
    name: '',
    nameOn: false,
    stopPropagation: 'yes' as TriState,
    stopPropagationOn: true,
  }
  let pg = $state(structuredClone(INITIAL))

  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  const indeterminate = $derived(pg.indeterminateOn ? flagOn(pg.indeterminate) : undefined)
  const stopPropagation = $derived(pg.stopPropagationOn ? flagOn(pg.stopPropagation) : undefined)
  const demoLabel = $derived(pg.labelOn && pg.label ? pg.label : i18n.t('common.apply'))
  const demoAriaLabel = $derived(pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : undefined)
  const demoName = $derived(pg.nameOn && pg.name ? pg.name : undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildCheckboxSnippet({
      label: pg.label,
      labelOn: pg.labelOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      indeterminate: pg.indeterminate,
      indeterminateOn: pg.indeterminateOn,
      wrapperClass: pg.wrapperClass,
      wrapperClassOn: pg.wrapperClassOn,
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      name: pg.name,
      nameOn: pg.nameOn,
      stopPropagation: pg.stopPropagation,
      stopPropagationOn: pg.stopPropagationOn,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name when no visible label.', value: pg.ariaLabel, onChange: v => (pg.ariaLabel = v), clearable: true, enabled: pg.ariaLabelOn, setEnabled: v => (pg.ariaLabelOn = v) }),
    { name: 'checked', type: 'boolean', defaultValue: '—', note: 'Bindable checked state; drives the live demo (the seed reads it from scope); the eye resets to the default state.', editor: 'boolean', value: pg.checked ? 'yes' : 'no', onChange: value => { pg.checked = value === 'yes'; pg.checkedOn = true; }, toggle: resetToggle(pg.checkedOn, enabled => (pg.checkedOn = enabled), () => (pg.checked = true)) },
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    boolField({ name: 'indeterminate', defaultValue: 'false', note: 'Mixed state glyph.', value: pg.indeterminate, onChange: v => (pg.indeterminate = v as TriState), enabled: pg.indeterminateOn, setEnabled: v => (pg.indeterminateOn = v) }),
    { name: 'label', type: 'string?', defaultValue: '—', note: 'Visible label; also the accessible name.', editor: 'text', clearable: true, value: pg.label, onChange: value => { pg.label = value; pg.labelOn = true; }, toggle: snippetToggle(pg.labelOn, enabled => (pg.labelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    textField({ name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name.', value: pg.name, onChange: v => (pg.name = v), clearable: true, enabled: pg.nameOn, setEnabled: v => (pg.nameOn = v) }),
    sizeField({ note: 'Box and label size; numbers settle on the nearest tier.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    boolField({ name: 'stopPropagation', defaultValue: 'true', note: 'Stops the click bubbling to clickable rows.', value: pg.stopPropagation, onChange: v => (pg.stopPropagation = v as TriState), enabled: pg.stopPropagationOn, setEnabled: v => (pg.stopPropagationOn = v) }),
    textField({ name: 'wrapperClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the wrapping label.', value: pg.wrapperClass, onChange: v => (pg.wrapperClass = v), editorDefaultValue: '', clearable: true, enabled: pg.wrapperClassOn, setEnabled: v => (pg.wrapperClassOn = v) }),
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
    scope={{ checked: pg.checked, lastChange: pg.lastChange, applyLabel: i18n.t('common.apply') }}

    sync={{ tag: 'Checkbox' }}
    scopeRefresh={() => [demoLabel]}
    scopeRefreshWhen={() => pg.label === ''}
  >
    <Checkbox
      bind:checked={pg.checked}
      label={demoLabel}
      ariaLabel={demoAriaLabel}
      name={demoName}
      stopPropagation={stopPropagation}
      size={demoSize}
      disabled={disabled}
      indeterminate={indeterminate}
      wrapperClass={pg.wrapperClassOn && pg.wrapperClass ? pg.wrapperClass : undefined}
      onChange={checked => (pg.lastChange = String(checked))} />
    <p class="text-sm text-slate-400">checked: {pg.checked}, lastChange: {pg.lastChange}</p>
  </ShowcasePage>
