<script lang="ts">
  import Chip from '$lib/components/Chip.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle } from '$lib/showcase/snippet-field'
  import { DEFAULT_CHIP_CLASS, buildChipSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgMode` is demo-only branching with no prop row, so it keeps a settings
  // panel below; `pgRemoved` is interaction state.
  let pgMode = $state('')
  let pgLabel = $state('Default')
  let pgLabelOn = $state(true)
  let pgChipClass = $state('')
  let pgChipClassOn = $state(false)
  let pgRemoved = $state(false)
  let pgAriaLabel = $state('')
  let pgAriaLabelOn = $state(false)
  let pgDisabled = $state<TriState>('no')
  let pgDisabledOn = $state(false)
  let pgRemoveButtonClass = $state('')
  let pgRemoveButtonClassOn = $state(false)
  let pgRemoveButtonStyle = $state('')
  let pgRemoveButtonStyleOn = $state(false)
  let pgStyle = $state('')
  let pgStyleOn = $state(false)
  let pgTooltip = $state('')
  let pgTooltipOn = $state(false)

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const modeOptions = [
    { value: 'removable', label: 'Removable' },
  ]

  const demoLabel = $derived(pgLabelOn && pgLabel ? pgLabel : i18n.t('showcase.default'))
  const demoChipClass = $derived(pgChipClassOn && pgChipClass ? pgChipClass : DEFAULT_CHIP_CLASS)
  const disabled = $derived(pgDisabledOn ? flagOn(pgDisabled) : undefined)
  const demoAriaLabel = $derived(pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : undefined)
  const demoRemoveButtonClass = $derived(pgRemoveButtonClassOn && pgRemoveButtonClass ? pgRemoveButtonClass : undefined)
  const demoRemoveButtonStyle = $derived(pgRemoveButtonStyleOn && pgRemoveButtonStyle ? pgRemoveButtonStyle : undefined)
  const demoStyle = $derived(pgStyleOn && pgStyle ? pgStyle : undefined)
  const demoTooltip = $derived(pgTooltipOn && pgTooltip ? pgTooltip : undefined)

  function clearPlayground() {
    pgMode = ''
    pgLabel = 'Default'
    pgLabelOn = true
    pgChipClass = ''
    pgChipClassOn = false
    pgRemoved = false
    pgAriaLabel = ''
    pgAriaLabelOn = false
    pgDisabled = 'no'
    pgDisabledOn = false
    pgRemoveButtonClass = ''
    pgRemoveButtonClassOn = false
    pgRemoveButtonStyle = ''
    pgRemoveButtonStyleOn = false
    pgStyle = ''
    pgStyleOn = false
    pgTooltip = ''
    pgTooltipOn = false
  }

  const code = $derived.by(() =>
    buildChipSnippet({
      mode: pgMode,
      label: pgLabel,
      labelOn: pgLabelOn,
      chipClass: pgChipClass,
      chipClassOn: pgChipClassOn,
      removeLabel: pgAriaLabel,
      removeLabelOn: pgAriaLabelOn,
      disabled: pgDisabled,
      disabledOn: pgDisabledOn,
      removeButtonClass: pgRemoveButtonClass,
      removeButtonClassOn: pgRemoveButtonClassOn,
      removeButtonStyle: pgRemoveButtonStyle,
      removeButtonStyleOn: pgRemoveButtonStyleOn,
      style: pgStyle,
      styleOn: pgStyleOn,
      tooltip: pgTooltip,
      tooltipOn: pgTooltipOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      defaultLabel: i18n.t('showcase.default'),
      removed: pgRemoved,
    }),
    sync: { tag: 'Chip', getFields: () => syncFields },
  })

  // `chipClass` is always emitted (falling back to the default), so the
  // default literal maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'chipClass', type: 'string', defaultValue: '—', note: 'Color and shape classes; the eye stages the customization.', editor: 'text', clearable: true, value: pgChipClass, onChange: value => { pgChipClass = value; pgChipClassOn = true; }, toggle: snippetToggle(pgChipClassOn, enabled => (pgChipClassOn = enabled)), sync: { kind: 'text', unsetValues: [DEFAULT_CHIP_CLASS] } },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the remove button. Applies in removable mode; the eye stages the customization.', editor: 'boolean', value: pgDisabled, onChange: value => { pgDisabled = value as TriState; pgDisabledOn = true; }, toggle: snippetToggle(pgDisabledOn, enabled => (pgDisabledOn = enabled)), sync: { kind: 'tri' } },
    { name: 'label', type: 'string', defaultValue: '—', note: 'Pill text; the eye stages the customization.', editor: 'text', clearable: true, value: pgLabel, onChange: value => { pgLabel = value; pgLabelOn = true; }, toggle: snippetToggle(pgLabelOn, enabled => (pgLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'defaultLabel' } },
    { name: 'removeButtonClass', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the remove button; the eye stages the customization. Applies in removable mode.', editor: 'text', clearable: true, value: pgRemoveButtonClass, onChange: value => { pgRemoveButtonClass = value; pgRemoveButtonClassOn = true; }, toggle: snippetToggle(pgRemoveButtonClassOn, enabled => (pgRemoveButtonClassOn = enabled)), sync: { kind: 'text' } },
    { name: 'removeButtonStyle', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Inline style for the remove button; the eye stages the customization. Applies in removable mode.', editor: 'text', clearable: true, value: pgRemoveButtonStyle, onChange: value => { pgRemoveButtonStyle = value; pgRemoveButtonStyleOn = true; }, toggle: snippetToggle(pgRemoveButtonStyleOn, enabled => (pgRemoveButtonStyleOn = enabled)), sync: { kind: 'text' } },
    { name: 'removeLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the remove button; the eye stages the customization. Applies in removable mode.', editor: 'text', clearable: true, value: pgAriaLabel, onChange: value => { pgAriaLabel = value; pgAriaLabelOn = true; }, toggle: snippetToggle(pgAriaLabelOn, enabled => (pgAriaLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'style', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Inline style for the pill; the eye stages the customization.', editor: 'text', clearable: true, value: pgStyle, onChange: value => { pgStyle = value; pgStyleOn = true; }, toggle: snippetToggle(pgStyleOn, enabled => (pgStyleOn = enabled)), sync: { kind: 'text' } },
    { name: 'tooltip', type: 'string?', defaultValue: '—', note: 'Tooltip text for the pill; the eye stages the customization.', editor: 'text', clearable: true, value: pgTooltip, onChange: value => { pgTooltip = value; pgTooltipOn = true; }, toggle: snippetToggle(pgTooltipOn, enabled => (pgTooltipOn = enabled)), sync: { kind: 'text' } },
    { name: 'onRemove', type: '() => void', defaultValue: '—', note: 'Renders the remove button.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  useScopeRefresh(preview, () => [demoLabel], () => pgLabel === '')
</script>

{#snippet settingsPanel()}
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Mode">
      <SelectDropdown
        buttonLabel={pgMode ? 'Removable' : 'Static'}
        activeValue={pgMode}
        ariaLabel="Mode"
        options={modeOptions}
        onSelect={value => (pgMode = value)}
        clearable
        clearLabel="Clear mode"
        onClear={() => {
          pgMode = ''
          pgRemoved = false
        }} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage
    {fields}
    title="Chip"
    {code}
    {preview}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{ defaultLabel: i18n.t('showcase.default'), removed: pgRemoved }}
>
    {#if pgMode === 'removable'}
      {#if !pgRemoved}
        <Chip
          label={demoLabel}
          chipClass={demoChipClass}
          removeLabel={demoAriaLabel}
          {disabled}
          removeButtonClass={demoRemoveButtonClass}
          removeButtonStyle={demoRemoveButtonStyle}
          style={demoStyle}
          tooltip={demoTooltip}
          onRemove={() => (pgRemoved = true)} />
      {/if}
    {:else}
      <Chip label={demoLabel} chipClass={demoChipClass} style={demoStyle} tooltip={demoTooltip} />
    {/if}
  </ShowcasePage>
