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
  let pgValue = $state<string[][]>(freshValue())
  // The lists apply only while their eye toggle is on (all on, so the
  // cleared form renders the current demo); committing re-applies.
  let pgValueEnabled = $state(true)
  let pgEditable = $state<TriState>('yes')
  let pgEditableOn = $state(true)
  let pgShowHeaders = $state<TriState>('yes')
  let pgShowHeadersOn = $state(true)
  let pgHideHeaderToggle = $state<TriState>('no')
  let pgHideHeaderToggleOn = $state(false)
  let pgColumnLabels = $state<string[]>([])
  let pgInitialColumnWidths = $state<string[]>([])
  let pgColumnLabelsEnabled = $state(true)
  let pgInitialColumnWidthsEnabled = $state(true)
  let pgMaxColumns = $state('')
  let pgMaxColumnsOn = $state(false)
  let pgStorageKey = $state('')
  let pgStorageKeyOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)

  const editable = $derived(pgEditableOn ? flagOn(pgEditable) : undefined)
  const showHeaders = $derived(pgShowHeadersOn ? flagOn(pgShowHeaders) : undefined)
  const hideHeaderToggle = $derived(pgHideHeaderToggleOn ? flagOn(pgHideHeaderToggle) : undefined)

  // Unset (or non-positive-integer) renders the component default; otherwise
  // the grid locks to that many columns. The eye stages the customization.
  function asMaxColumns(value: string, enabled: boolean): number | undefined {
    if (!enabled || value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }

  const demoMaxColumns = $derived(asMaxColumns(pgMaxColumns, pgMaxColumnsOn))
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)

  function clearPlayground() {
    pgValue = freshValue()
    pgValueEnabled = true
    pgEditable = 'yes'
    pgEditableOn = true
    pgShowHeaders = 'yes'
    pgShowHeadersOn = true
    pgHideHeaderToggle = 'no'
    pgHideHeaderToggleOn = false
    pgColumnLabels = []
    pgInitialColumnWidths = []
    pgColumnLabelsEnabled = true
    pgInitialColumnWidthsEnabled = true
    pgMaxColumns = ''
    pgMaxColumnsOn = false
    pgStorageKey = ''
    pgStorageKeyOn = false
    pgSize = 'md'
    pgSizeOn = false
  }

  const code = $derived.by(() =>
    buildDataGridSnippet({
      editable: pgEditable,
      editableOn: pgEditableOn,
      showHeaders: pgShowHeaders,
      showHeadersOn: pgShowHeadersOn,
      hideHeaderToggle: pgHideHeaderToggle,
      hideHeaderToggleOn: pgHideHeaderToggleOn,
      columnLabels: pgColumnLabels,
      columnLabelsEnabled: pgColumnLabelsEnabled,
      initialColumnWidths: pgInitialColumnWidths,
      initialColumnWidthsEnabled: pgInitialColumnWidthsEnabled,
      valueEnabled: pgValueEnabled,
      maxColumns: pgMaxColumns,
      maxColumnsOn: pgMaxColumnsOn,
      storageKey: pgStorageKey,
      storageKeyOn: pgStorageKeyOn,
      size: pgSize,
      sizeOn: pgSizeOn,
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
      value: JSON.stringify(pgColumnLabels, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnLabelsJson(draft)
        if (parsed) {
          pgColumnLabels = parsed
          pgColumnLabelsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseColumnLabelsJson(draft) != null, invalidMessage: 'Invalid column-labels JSON. Use an array of strings.', title: 'Edit column labels' },
      toggle: snippetToggle(pgColumnLabelsEnabled, enabled => (pgColumnLabelsEnabled = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseColumnLabelsValue, setJson: value => (pgColumnLabels = value as typeof pgColumnLabels) },
    }),
    boolField({ name: 'editable', defaultValue: 'true', note: 'Enables in-place cell editing and structure edits.', value: pgEditable, onChange: v => (pgEditable = v as TriState), enabled: pgEditableOn, setEnabled: v => (pgEditableOn = v) }),
    boolField({ name: 'hideHeaderToggle', defaultValue: 'false', note: 'Hides the toolbar header toggle.', value: pgHideHeaderToggle, onChange: v => (pgHideHeaderToggle = v as TriState), enabled: pgHideHeaderToggleOn, setEnabled: v => (pgHideHeaderToggleOn = v) }),
    jsonField({
      name: 'initialColumnWidths',
      type: 'string[]',
      note: 'Initial widths as px numbers or percent strings; the eye applies the list.',
      value: JSON.stringify(pgInitialColumnWidths, null, 2),
      onChange: (draft: string) => {
        const parsed = parseColumnWidthsJson(draft)
        if (parsed) {
          pgInitialColumnWidths = parsed
          pgInitialColumnWidthsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseColumnWidthsJson(draft) != null, invalidMessage: 'Invalid column-widths JSON. Use an array of strings.', title: 'Edit column widths' },
      toggle: snippetToggle(pgInitialColumnWidthsEnabled, enabled => (pgInitialColumnWidthsEnabled = enabled)),
      sync: { kind: 'scriptJson', parseJson: parseColumnWidthsValue, setJson: value => (pgInitialColumnWidths = value as typeof pgInitialColumnWidths) },
    }),
    { name: 'maxColumns', type: 'number?', defaultValue: '—', note: 'Locks the column count (e.g. key/value grids).', editor: 'number', clearable: true, value: pgMaxColumns, onChange: value => { pgMaxColumns = value; pgMaxColumnsOn = true; }, toggle: snippetToggle(pgMaxColumnsOn, enabled => (pgMaxColumnsOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    boolField({ name: 'showHeaders', defaultValue: 'true', note: 'Treats the first row as a header (bindable).', value: pgShowHeaders, onChange: v => (pgShowHeaders = v as TriState), enabled: pgShowHeadersOn, setEnabled: v => (pgShowHeadersOn = v) }),
    sizeField({ note: 'Toolbar scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    textField({ name: 'storageKey', type: 'string?', defaultValue: '—', note: 'Persists resized widths under this localStorage key.', value: pgStorageKey, onChange: v => (pgStorageKey = v), clearable: true, enabled: pgStorageKeyOn, setEnabled: v => (pgStorageKeyOn = v) }),
    jsonField({
      name: 'value',
      type: 'string[][]',
      note: 'Cells as rows of strings; the first row is the header when showHeaders is on. The eye applies the data (the grid renders empty while off).',
      value: JSON.stringify(pgValue, null, 2),
      onChange: (draft: string) => {
        const parsed = parseGridValueJson(draft)
        if (parsed) {
          pgValue = parsed
          pgValueEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseGridValueJson(draft) != null, invalidMessage: 'Invalid grid data JSON. Use an array of rows, each an array of strings.', title: 'Edit grid data' },
      toggle: snippetToggle(pgValueEnabled, enabled => (pgValueEnabled = enabled)),
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
    scope={{ value: pgValue }}

    sync={{ tag: 'DataGrid' }}
    scopeRefresh={() => [pgValue]}
  >
    <ShowcaseStage paneClass="h-72 w-full">
      <DataGrid value={pgValueEnabled ? pgValue : undefined} onChange={next => (pgValue = next)} {editable} {showHeaders} {hideHeaderToggle} columnLabels={pgColumnLabelsEnabled && pgColumnLabels.length ? pgColumnLabels : undefined} initialColumnWidths={pgInitialColumnWidthsEnabled && pgInitialColumnWidths.length ? pgInitialColumnWidths : undefined} maxColumns={demoMaxColumns} storageKey={pgStorageKeyOn && pgStorageKey ? pgStorageKey : undefined} size={demoSize} />
    </ShowcaseStage>
  </ShowcasePage>
