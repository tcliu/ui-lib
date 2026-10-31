<script lang="ts">
  import Chip from '$lib/components/Chip.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { textField, boolField, sizeField } from '$showcase/snippet-field'
  import { applied, appliedFlag, eye, eyeFlag, eyeToggle, stage, staged } from '$showcase/staged'
  import { type TriState } from '$showcase/snippet-build'
  import { DEFAULT_CHIP_CLASS, buildChipSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. `pgRemoved` is interaction
  // state.
  const INITIAL = {
    label: staged('Default', true),
    chipClass: staged(''),
    size: staged('md'),
    removable: staged('no' as TriState),
    removed: false,
    ariaLabel: staged(''),
    disabled: staged('no' as TriState),
    removeButtonClass: staged(''),
    removeButtonStyle: staged(''),
    style: staged(''),
    tooltip: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))

  const demoLabel = $derived(applied(pg.label) || i18n.t('showcase.default'))
  const demoChipClass = $derived(applied(pg.chipClass) || DEFAULT_CHIP_CLASS)
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const disabled = $derived(appliedFlag(pg.disabled))
  // The removable mode is a prop, so the Value cell drives it; turning it on
  // restores a chip the demo already removed.
  const removable = $derived(appliedFlag(pg.removable) === true)
  const demoAriaLabel = $derived(applied(pg.ariaLabel) || undefined)
  const demoRemoveButtonClass = $derived(applied(pg.removeButtonClass) || undefined)
  const demoRemoveButtonStyle = $derived(applied(pg.removeButtonStyle) || undefined)
  const demoStyle = $derived(applied(pg.style) || undefined)
  const demoTooltip = $derived(applied(pg.tooltip) || undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildChipSnippet({
      label: pg.label,
      chipClass: pg.chipClass,
      size: pg.size,
      removable: pg.removable,
      removeLabel: pg.ariaLabel,
      disabled: pg.disabled,
      removeButtonClass: pg.removeButtonClass,
      removeButtonStyle: pg.removeButtonStyle,
      style: pg.style,
      tooltip: pg.tooltip,
    }),
  )

  
  // `chipClass` is always emitted (falling back to the default), so the
  // default literal maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'chipClass', type: 'string', defaultValue: '—', note: 'Color and shape classes.', editor: 'text', clearable: true, ...eye(pg.chipClass), onChange: value => stage(pg.chipClass, value), toggle: eyeToggle(pg.chipClass), sync: { kind: 'text', unsetValues: [DEFAULT_CHIP_CLASS] } },
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the remove button. Applies in removable mode.', ...eyeFlag(pg.disabled) }),
    { name: 'label', type: 'string', defaultValue: '—', note: 'Pill text.', editor: 'text', clearable: true, ...eye(pg.label), onChange: value => stage(pg.label, value), toggle: eyeToggle(pg.label), sync: { kind: 'scopeText', scopeRef: 'defaultLabel' } },
    textField({ name: 'removeButtonClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the remove button. Applies in removable mode.', editorDefaultValue: '', clearable: true, ...eye(pg.removeButtonClass) }),
    textField({ name: 'removeButtonStyle', type: 'string?', defaultValue: "''", note: 'Inline style for the remove button. Applies in removable mode.', editorDefaultValue: '', clearable: true, ...eye(pg.removeButtonStyle) }),
    textField({ name: 'removeLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the remove button. Applies in removable mode.', clearable: true, ...eye(pg.ariaLabel) }),
    boolField({ name: 'removable', defaultValue: 'false', note: 'Offers a remove cross next to the label; `onRemove` is the handler.', ...eyeFlag(pg.removable), onChange: v => { stage(pg.removable, v as TriState); if (v === 'yes') pg.removed = false } }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels. Chip owns its size-scaled padding, font, and line.', ...eye(pg.size) }),
    textField({ name: 'style', type: 'string?', defaultValue: "''", note: 'Inline style for the pill.', editorDefaultValue: '', clearable: true, ...eye(pg.style) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: '—', note: 'Tooltip text for the pill.', clearable: true, ...eye(pg.tooltip) }),
    { name: 'onRemove', type: '() => void', defaultValue: '—', note: 'Handler for the remove affordance; the cross renders when the chip is removable.' },
  ])

  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  </script>

<ShowcasePage
    {fields}
    title="Chip"
    {code}
    onReset={clearPlayground}
    scope={{ defaultLabel: i18n.t('showcase.default'), removed: pg.removed }}

    sync={{ tag: 'Chip' }}
    scopeRefresh={() => [demoLabel]}
    scopeRefreshWhen={() => pg.label.value === ''}
  >
    {#if removable}
      {#if !pg.removed}
        <Chip
          label={demoLabel}
          chipClass={demoChipClass}
          size={demoSize}
          removable
          removeLabel={demoAriaLabel}
          {disabled}
          removeButtonClass={demoRemoveButtonClass}
          removeButtonStyle={demoRemoveButtonStyle}
          style={demoStyle}
          tooltip={demoTooltip}
          onRemove={() => (pg.removed = true)} />
      {/if}
    {:else}
      <Chip label={demoLabel} chipClass={demoChipClass} size={demoSize} style={demoStyle} tooltip={demoTooltip} />
    {/if}
  </ShowcasePage>
