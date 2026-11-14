<script lang="ts">
  import Chip from '#lib/components/Chip.svelte'
  import { CHIP_APPEARANCES, CHIP_COLORS, type ChipAppearance, type ChipColor } from '#lib/chip-variants.js'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { enumField, textField, boolField, sizeField } from '#showcase/playground/snippet-field.js'
  import { applied, appliedFlag, eye, eyeFlag, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import { buildChipSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. `pgRemoved` is interaction
  // state.
  const INITIAL = {
    label: staged('Default', true),
    chipClass: staged(''),
    variant: staged('cyan'),
    appearance: staged('soft'),
    size: staged('md'),
    removable: staged('no' as TriState),
    active: staged('no' as TriState),
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
  const demoChipClass = $derived(applied(pg.chipClass) || undefined)
  const demoVariant = $derived((applied(pg.variant) || undefined) as ChipColor | undefined)
  const demoAppearance = $derived((applied(pg.appearance) || undefined) as ChipAppearance | undefined)
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const disabled = $derived(appliedFlag(pg.disabled))
  // The removable mode is a prop, so the Value cell drives it; turning it on
  // restores a chip the demo already removed.
  const removable = $derived(appliedFlag(pg.removable) === true)
  // The active row implies toggle mode: passing `onclick` renders the pill as
  // a pressable button, and this row carries its pressed state.
  const toggleMode = $derived(pg.active.on)
  const chipActive = $derived(pg.active.value === 'yes')
  const demoAriaLabel = $derived(applied(pg.ariaLabel) || undefined)
  const demoRemoveButtonClass = $derived(applied(pg.removeButtonClass) || undefined)
  const demoRemoveButtonStyle = $derived(applied(pg.removeButtonStyle) || undefined)
  const demoStyle = $derived(applied(pg.style) || undefined)
  const demoTooltip = $derived(applied(pg.tooltip) || undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const colorOptions = CHIP_COLORS.map(value => ({ value, label: value }))
  const appearanceOptions = CHIP_APPEARANCES.map(value => ({ value, label: value }))

  const code = $derived.by(() =>
    buildChipSnippet({
      label: pg.label,
      chipClass: pg.chipClass,
      variant: pg.variant,
      appearance: pg.appearance,
      size: pg.size,
      removable: pg.removable,
      active: pg.active,
      removeLabel: pg.ariaLabel,
      disabled: pg.disabled,
      removeButtonClass: pg.removeButtonClass,
      removeButtonStyle: pg.removeButtonStyle,
      style: pg.style,
      tooltip: pg.tooltip,
    }),
  )

  
  // Editable rows first (primitives, data, and snippets, A–Z), then the
  // function props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    boolField({ name: 'active', defaultValue: 'false', note: 'Pressed state in toggle mode; applying it renders the pill as a pressable button (the removable row is then ignored).', ...eyeFlag(pg.active) }),
    enumField({ name: 'appearance', type: "'soft' | 'solid' | 'outline'", defaultValue: "'soft'", note: 'Named pill presentation: soft tints the fill, solid fills it, outline keeps it transparent. A caller `chipClass` wins.', options: appearanceOptions, placeholder: 'soft', clearLabel: 'Clear appearance', ...eye(pg.appearance) }),
    textField({ name: 'chipClass', type: 'string?', defaultValue: '—', note: 'Full pill class override; wins over the named variant and appearance.', clearable: true, ...eye(pg.chipClass) }),
    boolField({ name: 'disabled', defaultValue: 'false', note: 'Disables the remove button. Applies in removable mode.', ...eyeFlag(pg.disabled) }),
    { name: 'label', type: 'string', defaultValue: '—', note: 'Pill text.', editor: 'text', clearable: true, ...eye(pg.label), onChange: value => stage(pg.label, value), toggle: eyeToggle(pg.label), sync: { kind: 'scopeText', scopeRef: 'defaultLabel' } },
    textField({ name: 'removeButtonClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the remove button. Applies in removable mode.', editorDefaultValue: '', clearable: true, ...eye(pg.removeButtonClass) }),
    textField({ name: 'removeButtonStyle', type: 'string?', defaultValue: "''", note: 'Inline style for the remove button. Applies in removable mode.', editorDefaultValue: '', clearable: true, ...eye(pg.removeButtonStyle) }),
    textField({ name: 'removeLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the remove button. Applies in removable mode.', clearable: true, ...eye(pg.ariaLabel) }),
    boolField({ name: 'removable', defaultValue: 'false', note: 'Offers a remove cross next to the label; `onRemove` is the handler.', ...eyeFlag(pg.removable), onChange: v => { stage(pg.removable, v as TriState); if (v === 'yes') pg.removed = false } }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels. Chip owns its size-scaled padding, font, and line.', ...eye(pg.size) }),
    textField({ name: 'style', type: 'string?', defaultValue: "''", note: 'Inline style for the pill.', editorDefaultValue: '', clearable: true, ...eye(pg.style) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: '—', note: 'Tooltip text for the pill.', clearable: true, ...eye(pg.tooltip) }),
    enumField({ name: 'variant', type: "'cyan' | 'sky' | 'violet' | 'amber' | 'fuchsia' | 'emerald' | 'rose' | 'neutral'", defaultValue: "'cyan'", note: 'Named chip color; `chipClass` wins when both are set.', options: colorOptions, placeholder: 'cyan', clearLabel: 'Clear variant', ...eye(pg.variant) }),
    { name: 'onRemove', type: '() => void', defaultValue: '—', note: 'Handler for the remove affordance; the cross renders when the chip is removable.' },
    { name: 'onclick', type: '() => void', defaultValue: '—', note: 'Toggle handler; passing it renders the pill as a pressable button (the active row’s mode).' },
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
    {#if toggleMode}
      <Chip
        label={demoLabel}
        variant={demoVariant}
        appearance={demoAppearance}
        chipClass={demoChipClass}
        size={demoSize}
        active={chipActive}
        onclick={() => stage(pg.active, chipActive ? 'no' : 'yes')}
        style={demoStyle}
        tooltip={demoTooltip} />
    {:else if removable}
      {#if !pg.removed}
        <Chip
          label={demoLabel}
          variant={demoVariant}
          appearance={demoAppearance}
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
      <Chip label={demoLabel} variant={demoVariant} appearance={demoAppearance} chipClass={demoChipClass} size={demoSize} style={demoStyle} tooltip={demoTooltip} />
    {/if}
  </ShowcasePage>
