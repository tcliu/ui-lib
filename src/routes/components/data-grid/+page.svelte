<script lang="ts">
  import DataGrid from '$lib/components/DataGrid.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import ShowcaseStage from '$showcase/ShowcaseStage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { textField, boolField, sizeField, jsonField } from '$showcase/snippet-field'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { applied, appliedFlag, eye, eyeFlag, eyeToggle, stage, staged } from '$showcase/staged'
  import { type TriState } from '$showcase/snippet-build'
  import { DEMO_VALUE, buildDataGridSnippet, parseColumnLabelsJson, parseColumnLabelsValue, parseColumnWidthsJson, parseColumnWidthsValue, parseGridValueJson } from './demo-snippet'

  const i18n = getI18nContext()

  // Fresh copy behind a helper: assigning a shared array inline would let an
  // edit in the demo mutate DEMO_VALUE for every later mount.
  function freshValue(): string[][] {
    return DEMO_VALUE.map(row => [...row])
  }

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // The cell data is committed state edited in the grid itself.
  // The lists apply only while their eye toggle is on (all on, so the
  // cleared form renders the current demo); committing re-applies.
  const INITIAL = {
    value: staged(freshValue() as string[][], true),
    editable: staged('yes' as TriState),
    showHeaders: staged('yes' as TriState),
    hideHeaderToggle: staged('no' as TriState),
    columnLabels: staged([] as string[], true),
    initialColumnWidths: staged([] as string[], true),
    maxColumns: staged(''),
    storageKey: staged(''),
    storagePrefix: staged(''),
    size: staged('md'),
  }
  let pg = $state(structuredClone(INITIAL))

  const editable = $derived(appliedFlag(pg.editable))
  const showHeaders = $derived(appliedFlag(pg.showHeaders))
  const hideHeaderToggle = $derived(appliedFlag(pg.hideHeaderToggle))

  // Unset (or non-positive-integer) renders the component default; otherwise
  // the grid locks to that many columns. The eye stages the customization.
  function asMaxColumns(value: string, enabled: boolean): number | undefined {
    if (!enabled || value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }

  const demoMaxColumns = $derived(asMaxColumns(pg.maxColumns.value, pg.maxColumns.on))
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoColumnLabels = $derived(applied(pg.columnLabels)?.length ? pg.columnLabels.value : undefined)
  const demoInitialColumnWidths = $derived(
    applied(pg.initialColumnWidths)?.length ? pg.initialColumnWidths.value : undefined,
  )

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildDataGridSnippet({
      editable: pg.editable,
      showHeaders: pg.showHeaders,
      hideHeaderToggle: pg.hideHeaderToggle,
      columnLabels: pg.columnLabels,
      initialColumnWidths: pg.initialColumnWidths,
      value: pg.value,
      maxColumns: pg.maxColumns,
      storageKey: pg.storageKey,
      storagePrefix: pg.storagePrefix,
      size: pg.size,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The cell data
  // rides scope (the snippet reads it from there, so it has no snippet sync),
  // and its Value cell opens a JSON dialog over the live grid data.
  const fields: SyncableFieldConfig[] = $derived([
    jsonField({
      name: 'columnLabels',
      type: 'string[]?',
      note: 'Replaces column letters with display labels; the eye applies the list.',
      value: JSON.stringify(pg.columnLabels.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnLabelsJson(draft)
        if (parsed) stage(pg.columnLabels, parsed)
      },
      dialog: { valid: (draft: string) => parseColumnLabelsJson(draft) != null, invalidMessage: 'Invalid column-labels JSON. Use an array of strings.', title: 'Edit column labels' },
      toggle: eyeToggle(pg.columnLabels),
      sync: { kind: 'scriptJson', parseJson: parseColumnLabelsValue, setJson: value => (pg.columnLabels.value = value as string[]) },
    }),
    boolField({ name: 'editable', defaultValue: 'true', note: 'Enables in-place cell editing and structure edits.', ...eyeFlag(pg.editable) }),
    boolField({ name: 'hideHeaderToggle', defaultValue: 'false', note: 'Hides the toolbar header toggle.', ...eyeFlag(pg.hideHeaderToggle) }),
    jsonField({
      name: 'initialColumnWidths',
      type: 'string[]?',
      note: 'Initial widths as px numbers or percent strings; the eye applies the list.',
      value: JSON.stringify(pg.initialColumnWidths.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnWidthsJson(draft)
        if (parsed) stage(pg.initialColumnWidths, parsed)
      },
      dialog: { valid: (draft: string) => parseColumnWidthsJson(draft) != null, invalidMessage: 'Invalid column-widths JSON. Use an array of strings.', title: 'Edit column widths' },
      toggle: eyeToggle(pg.initialColumnWidths),
      sync: { kind: 'scriptJson', parseJson: parseColumnWidthsValue, setJson: value => (pg.initialColumnWidths.value = value as string[]) },
    }),
    { name: 'maxColumns', type: 'number?', defaultValue: '—', note: 'Locks the column count (e.g. key/value grids).', editor: 'number', clearable: true, ...eye(pg.maxColumns), onChange: value => stage(pg.maxColumns, value), toggle: eyeToggle(pg.maxColumns), sync: { kind: 'number', pattern: /^\d+$/ } },
    boolField({ name: 'showHeaders', defaultValue: 'true', note: 'Treats the first row as a header (bindable).', ...eyeFlag(pg.showHeaders) }),
    sizeField({ note: 'Toolbar scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    textField({ name: 'storageKey', type: 'string?', defaultValue: '—', note: 'Persists resized widths under this localStorage key.', clearable: true, ...eye(pg.storageKey) }),
    textField({ name: 'storagePrefix', type: 'string?', defaultValue: '—', note: 'App-owned localStorage prefix for the persisted widths; the package prefix stays the read fallback.', clearable: true, ...eye(pg.storagePrefix) }),
    jsonField({
      name: 'value',
      type: 'string[][]?',
      note: 'Cells as rows of strings; the first row is the header when showHeaders is on. The eye applies the data (the grid renders empty while off).',
      value: JSON.stringify(pg.value.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseGridValueJson(draft)
        if (parsed) stage(pg.value, parsed)
      },
      dialog: { valid: (draft: string) => parseGridValueJson(draft) != null, invalidMessage: 'Invalid grid data JSON. Use an array of rows, each an array of strings.', title: 'Edit grid data' },
      toggle: eyeToggle(pg.value),
    }),
    { name: 'onChange', type: '(rows: string[][]) => void', defaultValue: '—', note: 'Called with the whole grid after every edit.' },
  ])

  // The seed covers every override except the cell data (the snippet reads it
  // from scope), so only grid edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  </script>

<ShowcasePage
    {fields}
    title="DataGrid"
    {code}
    onReset={clearPlayground}
    scope={{ value: pg.value.value }}

    sync={{ tag: 'DataGrid' }}
    scopeRefresh={() => [pg.value.value]}
  >
    <ShowcaseStage paneClass="h-72 w-full">
      <DataGrid value={applied(pg.value)} onChange={next => (pg.value.value = next)} {editable} {showHeaders} {hideHeaderToggle} columnLabels={demoColumnLabels} initialColumnWidths={demoInitialColumnWidths} maxColumns={demoMaxColumns} storageKey={applied(pg.storageKey) || undefined} storagePrefix={applied(pg.storagePrefix) || undefined} size={demoSize} />
    </ShowcaseStage>
  </ShowcasePage>
