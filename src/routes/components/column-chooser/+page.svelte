<script lang="ts">
  import ColumnChooser from '#lib/components/ColumnChooser.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { applied, eye, eyeResetToggle, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { sizeField, jsonField } from '#showcase/playground/snippet-field.js'
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
  // omits the default. Clearing the size unsets it; labels start applied so the
  // demo's own labels render. Each curated prop is one `Staged` pair (its
  // committed value plus its eye flag). Reset restores all four. The columns
  // are required content, so the eye resets to the seeds instead of omitting;
  // committing re-applies.
  let pgColumns = $state(staged(seedColumns(), true))
  let pgTriggerLabel = $state(staged(CHOOSER_LABEL, true))
  let pgResetAriaLabel = $state(staged(CHOOSER_RESET_LABEL, true))
  let pgSize = $state(staged('md'))
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(COLUMNS_STAGE_DEFAULT_WIDTH)

  const hiddenCount = $derived(pgColumns.value.filter(column => !column.checked).length)
  const demoSize = $derived.by(() => {
    const value = applied(pgSize)
    return value === undefined ? undefined : parseSizeValue(value)
  })

  function handleToggleColumn(key: string, checked: boolean): void {
    pgColumns.value = pgColumns.value.map(column => (column.key === key ? { ...column, checked } : column))
  }

  function handleResetColumns(): void {
    pgColumns.value = pgColumns.value.map(column => ({ ...column, checked: true }))
  }

  function clearPlayground(): void {
    pgTriggerLabel.value = CHOOSER_LABEL
    pgTriggerLabel.on = true
    pgResetAriaLabel.value = CHOOSER_RESET_LABEL
    pgResetAriaLabel.on = true
    pgSize.value = 'md'
    pgSize.on = false
    pgColumns.value = seedColumns()
    pgColumns.on = true
    pgStageWidth = COLUMNS_STAGE_DEFAULT_WIDTH
  }

  const code = $derived.by(() =>
    buildColumnChooserSnippet({
      triggerLabel: pgTriggerLabel,
      resetAriaLabel: pgResetAriaLabel,
      columns: pgColumns,
      size: pgSize,
    }),
  )

  
  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    jsonField({
      name: 'columns',
      type: 'ChooserColumn[]',
      note: 'Entries with key, header, and checked state. The eye resets to the seed entries.',
      value: JSON.stringify(pgColumns.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnsJson(draft)
        if (parsed) stage(pgColumns, parsed)
      },
      dialog: { valid: (draft: string) => parseColumnsJson(draft) != null, invalidMessage: 'Invalid columns JSON. Use an array of { key, header, checked? } objects.' },
      toggle: eyeResetToggle(pgColumns, () => (pgColumns.value = seedColumns())),
      sync: { kind: 'scriptJson', parseJson: parseColumnsValue, setJson: value => (pgColumns.value = value as typeof pgColumns.value) },
    }),
    {
      name: 'resetAriaLabel',
      type: 'string',
      defaultValue: '—',
      note: 'Accessible name and tooltip for the reset button.', editor: 'text', clearable: true, ...eye(pgResetAriaLabel), onChange: value => stage(pgResetAriaLabel, value), toggle: eyeToggle(pgResetAriaLabel), sync: { kind: 'scopeText', scopeRef: 'resetLabel' } },
    sizeField({ note: 'Trigger, reset, and option scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pgSize) }),
    { name: 'triggerLabel', type: 'string', defaultValue: '—', note: 'Accessible name and tooltip for the trigger.', editor: 'text', clearable: true, ...eye(pgTriggerLabel), onChange: value => stage(pgTriggerLabel, value), toggle: eyeToggle(pgTriggerLabel), sync: { kind: 'scopeText', scopeRef: 'chooserLabel' } },
    { name: 'onReset', type: '() => void', defaultValue: '—', note: 'Fires when the reset button is pressed.' },
    {
      name: 'onToggle',
      type: '(key: string, checked: boolean) => void',
      defaultValue: '—',
      note: 'Fires when a column checkbox changes.',
    }
  ])

</script>

<ShowcasePage
    {fields}
    title="ColumnChooser"
    {code}
    onReset={clearPlayground}
    scope={{ chooserLabel: CHOOSER_LABEL, resetLabel: CHOOSER_RESET_LABEL }}
    stage={{ minWidth: COLUMNS_STAGE_MIN_WIDTH }}
    bind:stageWidth={pgStageWidth}

    sync={{ tag: 'ColumnChooser' }}
  >
    <ColumnChooser
      triggerLabel={applied(pgTriggerLabel) || CHOOSER_LABEL}
      resetAriaLabel={applied(pgResetAriaLabel) || CHOOSER_RESET_LABEL}
      columns={pgColumns.value}
      size={demoSize}
      onToggle={handleToggleColumn}
      onReset={handleResetColumns} />
    <span class="text-sm text-slate-400">hidden: {hiddenCount}</span>
  </ShowcasePage>
