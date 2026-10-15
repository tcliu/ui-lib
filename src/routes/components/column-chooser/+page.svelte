<script lang="ts">
  import ColumnChooser from '$lib/components/ColumnChooser.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { jsonField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import {
    buildColumnChooserSnippet,
    CHOOSER_LABEL,
    CHOOSER_RESET_LABEL,
    COLUMNS_STAGE_DEFAULT_WIDTH,
    COLUMNS_STAGE_MIN_WIDTH,
    parseColumnsJson,
    parseColumnsValue,
    seedColumns,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. The column list is committed state (all
  // checked to start); the size starts at the component default (the Value
  // column shows it), so the cleared form applies no overrides and Show-code
  // omits the default. Clearing the size unsets it; labels start unset so the
  // component default renders. Reset restores all three.
  let pgColumns = $state(seedColumns())
  // The component requires columns, so the eye resets to the seeds instead
  // of omitting; committing re-applies.
  let pgColumnsEnabled = $state(true)
  let pgTriggerLabel = $state('Choose columns')
  let pgTriggerLabelOn = $state(true)
  let pgResetAriaLabel = $state('Reset columns')
  let pgResetAriaLabelOn = $state(true)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(COLUMNS_STAGE_DEFAULT_WIDTH)

  const hiddenCount = $derived(pgColumns.filter(column => !column.checked).length)
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)

  function handleToggleColumn(key: string, checked: boolean): void {
    pgColumns = pgColumns.map(column => (column.key === key ? { ...column, checked } : column))
  }

  function handleResetColumns(): void {
    pgColumns = pgColumns.map(column => ({ ...column, checked: true }))
  }

  function clearPlayground(): void {
    pgTriggerLabel = 'Choose columns'
    pgTriggerLabelOn = true
    pgResetAriaLabel = 'Reset columns'
    pgResetAriaLabelOn = true
    pgSize = 'md'
    pgSizeOn = false
    pgColumns = seedColumns()
    pgColumnsEnabled = true
    pgStageWidth = COLUMNS_STAGE_DEFAULT_WIDTH
  }

  const code = $derived.by(() =>
    buildColumnChooserSnippet({ triggerLabel: pgTriggerLabel, triggerLabelOn: pgTriggerLabelOn, resetAriaLabel: pgResetAriaLabel, resetAriaLabelOn: pgResetAriaLabelOn, columns: pgColumns, size: pgSize, sizeOn: pgSizeOn }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ chooserLabel: CHOOSER_LABEL, resetLabel: CHOOSER_RESET_LABEL }),
    sync: { tag: 'ColumnChooser', getFields: () => syncFields },
  })

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    jsonField({
      name: 'columns',
      type: 'ChooserColumn[]',
      note: 'Entries with key, header, and checked state. The eye resets to the seed entries.',
      value: JSON.stringify(pgColumns, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnsJson(draft)
        if (parsed) {
          pgColumns = parsed
          pgColumnsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseColumnsJson(draft) != null, invalidMessage: 'Invalid columns JSON. Use an array of { key, header, checked? } objects.' },
      toggle: resetToggle(
        pgColumnsEnabled,
        enabled => (pgColumnsEnabled = enabled),
        () => (pgColumns = seedColumns()),
      ),
      sync: { kind: 'scriptJson', parseJson: parseColumnsValue, setJson: value => (pgColumns = value as typeof pgColumns) },
    }),
    {
      name: 'resetAriaLabel',
      type: 'string',
      defaultValue: '—',
      note: 'Accessible name and tooltip for the reset button; the eye stages the customization.', editor: 'text', clearable: true, value: pgResetAriaLabel, onChange: value => { pgResetAriaLabel = value; pgResetAriaLabelOn = true; }, toggle: snippetToggle(pgResetAriaLabelOn, enabled => (pgResetAriaLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'resetLabel' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Trigger, reset, and option scale; numbers are icon-scale pixels interpolated between the steps; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, placeholder: 'md', clearLabel: 'Clear size', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => { const attr = attrs?.get('size'); if (!attr) return 'md'; if (attr.kind === 'string') return attr.value; if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value; return undefined } } },
    { name: 'triggerLabel', type: 'string', defaultValue: '—', note: 'Accessible name and tooltip for the trigger; the eye stages the customization.', editor: 'text', clearable: true, value: pgTriggerLabel, onChange: value => { pgTriggerLabel = value; pgTriggerLabelOn = true; }, toggle: snippetToggle(pgTriggerLabelOn, enabled => (pgTriggerLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'chooserLabel' } },
    { name: 'onReset', type: '() => void', defaultValue: '—', note: 'Fires when the reset button is pressed.' },
    {
      name: 'onToggle',
      type: '(key: string, checked: boolean) => void',
      defaultValue: '—',
      note: 'Fires when a column checkbox changes.',
    }
  ])

  const syncFields = $derived(syncFieldsOf(fields))
</script>

<ShowcasePage
    {fields}
    title="ColumnChooser"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ chooserLabel: CHOOSER_LABEL, resetLabel: CHOOSER_RESET_LABEL }}
    stage={{ minWidth: COLUMNS_STAGE_MIN_WIDTH }}
    bind:stageWidth={pgStageWidth}
>
    <ColumnChooser
      triggerLabel={pgTriggerLabelOn && pgTriggerLabel ? pgTriggerLabel : CHOOSER_LABEL}
      resetAriaLabel={pgResetAriaLabelOn && pgResetAriaLabel ? pgResetAriaLabel : CHOOSER_RESET_LABEL}
      columns={pgColumns}
      size={demoSize}
      onToggle={handleToggleColumn}
      onReset={handleResetColumns} />
    <span class="text-sm text-slate-400">hidden: {hiddenCount}</span>
  </ShowcasePage>
