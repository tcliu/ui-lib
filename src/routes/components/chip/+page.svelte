<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import Chip from '$lib/components/Chip.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { textField, boolField, sizeField, snippetToggle } from '$lib/showcase/snippet-field'
  import { DEFAULT_CHIP_CLASS, buildChipSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. `pgRemoved` is interaction
  // state.
  const INITIAL = {
    label: 'Default',
    labelOn: true,
    chipClass: '',
    chipClassOn: false,
    size: 'md',
    sizeOn: false,
    removable: 'no' as TriState,
    removableOn: false,
    removed: false,
    ariaLabel: '',
    ariaLabelOn: false,
    disabled: 'no' as TriState,
    disabledOn: false,
    removeButtonClass: '',
    removeButtonClassOn: false,
    removeButtonStyle: '',
    removeButtonStyleOn: false,
    style: '',
    styleOn: false,
    tooltip: '',
    tooltipOn: false,
  }
  let pg = $state(structuredClone(INITIAL))

  const demoLabel = $derived(pg.labelOn && pg.label ? pg.label : i18n.t('showcase.default'))
  const demoChipClass = $derived(pg.chipClassOn && pg.chipClass ? pg.chipClass : DEFAULT_CHIP_CLASS)
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const disabled = $derived(pg.disabledOn ? flagOn(pg.disabled) : undefined)
  // The removable mode is a prop, so the Value cell drives it; turning it on
  // restores a chip the demo already removed.
  const removable = $derived(pg.removableOn && pg.removable === 'yes')
  const demoAriaLabel = $derived(pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : undefined)
  const demoRemoveButtonClass = $derived(pg.removeButtonClassOn && pg.removeButtonClass ? pg.removeButtonClass : undefined)
  const demoRemoveButtonStyle = $derived(pg.removeButtonStyleOn && pg.removeButtonStyle ? pg.removeButtonStyle : undefined)
  const demoStyle = $derived(pg.styleOn && pg.style ? pg.style : undefined)
  const demoTooltip = $derived(pg.tooltipOn && pg.tooltip ? pg.tooltip : undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildChipSnippet({
      label: pg.label,
      labelOn: pg.labelOn,
      chipClass: pg.chipClass,
      chipClassOn: pg.chipClassOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      removable: pg.removable,
      removableOn: pg.removableOn,
      removeLabel: pg.ariaLabel,
      removeLabelOn: pg.ariaLabelOn,
      disabled: pg.disabled,
      disabledOn: pg.disabledOn,
      removeButtonClass: pg.removeButtonClass,
      removeButtonClassOn: pg.removeButtonClassOn,
      removeButtonStyle: pg.removeButtonStyle,
      removeButtonStyleOn: pg.removeButtonStyleOn,
      style: pg.style,
      styleOn: pg.styleOn,
      tooltip: pg.tooltip,
      tooltipOn: pg.tooltipOn,
    }),
  )

  
  // `chipClass` is always emitted (falling back to the default), so the
  // default literal maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'chipClass', type: 'string', defaultValue: '—', note: 'Color and shape classes.', editor: 'text', clearable: true, value: pg.chipClass, onChange: value => { pg.chipClass = value; pg.chipClassOn = true; }, toggle: snippetToggle(pg.chipClassOn, enabled => (pg.chipClassOn = enabled)), sync: { kind: 'text', unsetValues: [DEFAULT_CHIP_CLASS] } },
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the remove button. Applies in removable mode.', value: pg.disabled, onChange: v => (pg.disabled = v as TriState), enabled: pg.disabledOn, setEnabled: v => (pg.disabledOn = v) }),
    { name: 'label', type: 'string', defaultValue: '—', note: 'Pill text.', editor: 'text', clearable: true, value: pg.label, onChange: value => { pg.label = value; pg.labelOn = true; }, toggle: snippetToggle(pg.labelOn, enabled => (pg.labelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'defaultLabel' } },
    textField({ name: 'removeButtonClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the remove button. Applies in removable mode.', value: pg.removeButtonClass, onChange: v => (pg.removeButtonClass = v), editorDefaultValue: '', clearable: true, enabled: pg.removeButtonClassOn, setEnabled: v => (pg.removeButtonClassOn = v) }),
    textField({ name: 'removeButtonStyle', type: 'string?', defaultValue: "''", note: 'Inline style for the remove button. Applies in removable mode.', value: pg.removeButtonStyle, onChange: v => (pg.removeButtonStyle = v), editorDefaultValue: '', clearable: true, enabled: pg.removeButtonStyleOn, setEnabled: v => (pg.removeButtonStyleOn = v) }),
    textField({ name: 'removeLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the remove button. Applies in removable mode.', value: pg.ariaLabel, onChange: v => (pg.ariaLabel = v), clearable: true, enabled: pg.ariaLabelOn, setEnabled: v => (pg.ariaLabelOn = v) }),
    boolField({ name: 'removable', defaultValue: 'false', note: 'Offers a remove cross next to the label; `onRemove` is the handler.', value: pg.removable, onChange: v => { pg.removable = v as TriState; pg.removableOn = true; if (v === 'yes') pg.removed = false }, enabled: pg.removableOn, setEnabled: v => (pg.removableOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels. Chip owns its size-scaled padding, font, and line.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    textField({ name: 'style', type: 'string?', defaultValue: "''", note: 'Inline style for the pill.', value: pg.style, onChange: v => (pg.style = v), editorDefaultValue: '', clearable: true, enabled: pg.styleOn, setEnabled: v => (pg.styleOn = v) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: '—', note: 'Tooltip text for the pill.', value: pg.tooltip, onChange: v => (pg.tooltip = v), clearable: true, enabled: pg.tooltipOn, setEnabled: v => (pg.tooltipOn = v) }),
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
    scopeRefreshWhen={() => pg.label === ''}
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
