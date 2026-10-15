<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import DataGrid from '$lib/components/DataGrid.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseStage from '$lib/showcase/ShowcaseStage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { textField, boolField, sizeField, jsonField, snippetToggle } from '$lib/showcase/snippet-field'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { DEMO_VALUE, buildDataGridSnippet, parseColumnLabelsJson, parseColumnLabelsValue, parseColumnWidthsJson, parseColumnWidthsValue, parseGridValueJson, type TriState } from './demo-snippet'

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
  const INITIAL = {
    value: freshValue() as string[][],
    valueEnabled: true,
    editable: 'yes' as TriState,
    editableOn: true,
    showHeaders: 'yes' as TriState,
    showHeadersOn: true,
    hideHeaderToggle: 'no' as TriState,
    hideHeaderToggleOn: false,
    columnLabels: [] as string[],
    initialColumnWidths: [] as string[],
    columnLabelsEnabled: true,
    initialColumnWidthsEnabled: true,
    maxColumns: '',
    maxColumnsOn: false,
    storageKey: '',
    storageKeyOn: false,
    size: 'md',
    sizeOn: false,
  }
  let pg = $state(structuredClone(INITIAL))
  // The lists apply only while their eye toggle is on (all on, so the
  // cleared form renders the current demo); committing re-applies.

  const editable = $derived(pg.editableOn ? flagOn(pg.editable) : undefined)
  const showHeaders = $derived(pg.showHeadersOn ? flagOn(pg.showHeaders) : undefined)
  const hideHeaderToggle = $derived(pg.hideHeaderToggleOn ? flagOn(pg.hideHeaderToggle) : undefined)

  // Unset (or non-positive-integer) renders the component default; otherwise
  // the grid locks to that many columns. The eye stages the customization.
  function asMaxColumns(value: string, enabled: boolean): number | undefined {
    if (!enabled || value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }

  const demoMaxColumns = $derived(asMaxColumns(pg.maxColumns, pg.maxColumnsOn))
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildDataGridSnippet({
      editable: pg.editable,
      editableOn: pg.editableOn,
      showHeaders: pg.showHeaders,
      showHeadersOn: pg.showHeadersOn,
      hideHeaderToggle: pg.hideHeaderToggle,
      hideHeaderToggleOn: pg.hideHeaderToggleOn,
      columnLabels: pg.columnLabels,
      columnLabelsEnabled: pg.columnLabelsEnabled,
      initialColumnWidths: pg.initialColumnWidths,
      initialColumnWidthsEnabled: pg.initialColumnWidthsEnabled,
      valueEnabled: pg.valueEnabled,
      maxColumns: pg.maxColumns,
      maxColumnsOn: pg.maxColumnsOn,
      storageKey: pg.storageKey,
      storageKeyOn: pg.storageKeyOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
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
      type: 'string[]',
      note: 'Replaces column letters with display labels; the eye applies the list.',
      value: JSON.stringify(pg.columnLabels, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnLabelsJson(draft)
        if (parsed) {
          pg.columnLabels = parsed
          pg.columnLabelsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseColumnLabelsJson(draft) != null, invalidMessage: 'Invalid column-labels JSON. Use an array of strings.', title: 'Edit column labels' },
      toggle: snippetToggle(pg.columnLabelsEnabled, enabled => (pg.columnLabelsEnabled = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseColumnLabelsValue, setJson: value => (pg.columnLabels = value as typeof pg.columnLabels) },
    }),
    boolField({ name: 'editable', defaultValue: 'true', note: 'Enables in-place cell editing and structure edits.', value: pg.editable, onChange: v => (pg.editable = v as TriState), enabled: pg.editableOn, setEnabled: v => (pg.editableOn = v) }),
    boolField({ name: 'hideHeaderToggle', defaultValue: 'false', note: 'Hides the toolbar header toggle.', value: pg.hideHeaderToggle, onChange: v => (pg.hideHeaderToggle = v as TriState), enabled: pg.hideHeaderToggleOn, setEnabled: v => (pg.hideHeaderToggleOn = v) }),
    jsonField({
      name: 'initialColumnWidths',
      type: 'string[]',
      note: 'Initial widths as px numbers or percent strings; the eye applies the list.',
      value: JSON.stringify(pg.initialColumnWidths, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnWidthsJson(draft)
        if (parsed) {
          pg.initialColumnWidths = parsed
          pg.initialColumnWidthsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseColumnWidthsJson(draft) != null, invalidMessage: 'Invalid column-widths JSON. Use an array of strings.', title: 'Edit column widths' },
      toggle: snippetToggle(pg.initialColumnWidthsEnabled, enabled => (pg.initialColumnWidthsEnabled = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseColumnWidthsValue, setJson: value => (pg.initialColumnWidths = value as typeof pg.initialColumnWidths) },
    }),
    { name: 'maxColumns', type: 'number?', defaultValue: '—', note: 'Locks the column count (e.g. key/value grids).', editor: 'number', clearable: true, value: pg.maxColumns, onChange: value => { pg.maxColumns = value; pg.maxColumnsOn = true; }, toggle: snippetToggle(pg.maxColumnsOn, enabled => (pg.maxColumnsOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    boolField({ name: 'showHeaders', defaultValue: 'true', note: 'Treats the first row as a header (bindable).', value: pg.showHeaders, onChange: v => (pg.showHeaders = v as TriState), enabled: pg.showHeadersOn, setEnabled: v => (pg.showHeadersOn = v) }),
    sizeField({ note: 'Toolbar scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    textField({ name: 'storageKey', type: 'string?', defaultValue: '—', note: 'Persists resized widths under this localStorage key.', value: pg.storageKey, onChange: v => (pg.storageKey = v), clearable: true, enabled: pg.storageKeyOn, setEnabled: v => (pg.storageKeyOn = v) }),
    jsonField({
      name: 'value',
      type: 'string[][]',
      note: 'Cells as rows of strings; the first row is the header when showHeaders is on. The eye applies the data (the grid renders empty while off).',
      value: JSON.stringify(pg.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseGridValueJson(draft)
        if (parsed) {
          pg.value = parsed
          pg.valueEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseGridValueJson(draft) != null, invalidMessage: 'Invalid grid data JSON. Use an array of rows, each an array of strings.', title: 'Edit grid data' },
      toggle: snippetToggle(pg.valueEnabled, enabled => (pg.valueEnabled = enabled)),
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
    scope={{ value: pg.value }}

    sync={{ tag: 'DataGrid' }}
    scopeRefresh={() => [pg.value]}
  >
    <ShowcaseStage paneClass="h-72 w-full">
      <DataGrid value={pg.valueEnabled ? pg.value : undefined} onChange={next => (pg.value = next)} {editable} {showHeaders} {hideHeaderToggle} columnLabels={pg.columnLabelsEnabled && pg.columnLabels.length ? pg.columnLabels : undefined} initialColumnWidths={pg.initialColumnWidthsEnabled && pg.initialColumnWidths.length ? pg.initialColumnWidths : undefined} maxColumns={demoMaxColumns} storageKey={pg.storageKeyOn && pg.storageKey ? pg.storageKey : undefined} size={demoSize} />
    </ShowcaseStage>
  </ShowcasePage>
