<script lang="ts">
  import Checkbox from '#lib/components/Checkbox.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { textField, boolField, sizeField } from '#showcase/playground/snippet-field.js'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { buildCheckboxSnippet } from './demo-snippet'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import { parseSizeValue } from '#showcase/playground/size-input.js'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgChecked`/`pgLastChange` are interaction state, not curated options.
  const INITIAL = {
    checked: staged(true, true),
    lastChange: '—',
    label: staged('Apply', true),
    size: staged('md'),
    disabled: staged('no' as TriState),
    indeterminate: staged('no' as TriState),
    wrapperClass: staged(''),
    ariaLabel: staged(''),
    name: staged(''),
    stopPropagation: staged('yes' as TriState),
  }
  let pg = $state(structuredClone(INITIAL))

  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const disabled = $derived(appliedFlag(pg.disabled))
  const indeterminate = $derived(appliedFlag(pg.indeterminate))
  const stopPropagation = $derived(appliedFlag(pg.stopPropagation))
  const demoLabel = $derived(applied(pg.label) || i18n.t('common.apply'))
  const demoAriaLabel = $derived(applied(pg.ariaLabel) || undefined)
  const demoName = $derived(applied(pg.name) || undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildCheckboxSnippet({
      label: pg.label,
      size: pg.size,
      disabled: pg.disabled,
      indeterminate: pg.indeterminate,
      wrapperClass: pg.wrapperClass,
      ariaLabel: pg.ariaLabel,
      name: pg.name,
      stopPropagation: pg.stopPropagation,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: '—', note: 'Accessible name when no visible label.', clearable: true, ...eye(pg.ariaLabel) }),
    { name: 'checked', type: 'boolean', defaultValue: '—', note: 'Bindable checked state; drives the live demo (the seed reads it from scope); the eye resets to the default state.', editor: 'boolean', value: pg.checked.value ? 'yes' : 'no', onChange: value => stage(pg.checked, value === 'yes'), toggle: eyeResetToggle(pg.checked, () => (pg.checked.value = true)) },
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the input.', ...eyeFlag(pg.disabled) }),
    boolField({ name: 'indeterminate', defaultValue: 'false', note: 'Mixed state glyph.', ...eyeFlag(pg.indeterminate) }),
    { name: 'label', type: 'string?', defaultValue: '—', note: 'Visible label; also the accessible name.', editor: 'text', clearable: true, ...eye(pg.label), onChange: value => stage(pg.label, value), toggle: eyeToggle(pg.label), sync: { kind: 'scopeText', scopeRef: 'applyLabel' } },
    textField({ name: 'name', type: 'string?', defaultValue: '—', note: 'Native input name.', clearable: true, ...eye(pg.name) }),
    sizeField({ note: 'Box and label size; numbers settle on the nearest tier.', ...eye(pg.size) }),
    boolField({ name: 'stopPropagation', defaultValue: 'true', note: 'Stops the click bubbling to clickable rows.', ...eyeFlag(pg.stopPropagation) }),
    textField({ name: 'wrapperClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the wrapping label.', editorDefaultValue: '', clearable: true, ...eye(pg.wrapperClass) }),
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
    scope={{ checked: pg.checked.value, lastChange: pg.lastChange, applyLabel: i18n.t('common.apply') }}

    sync={{ tag: 'Checkbox' }}
    scopeRefresh={() => [demoLabel]}
    scopeRefreshWhen={() => pg.label.value === ''}
  >
    <Checkbox
      bind:checked={pg.checked.value}
      label={demoLabel}
      ariaLabel={demoAriaLabel}
      name={demoName}
      stopPropagation={stopPropagation}
      size={demoSize}
      disabled={disabled}
      indeterminate={indeterminate}
      wrapperClass={applied(pg.wrapperClass) || undefined}
      onChange={checked => (pg.lastChange = String(checked))} />
    <p class="text-sm text-slate-400">checked: {pg.checked.value}, lastChange: {pg.lastChange}</p>
  </ShowcasePage>
