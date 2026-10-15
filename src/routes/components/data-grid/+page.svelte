<script lang="ts">
  import DataGrid from '$lib/components/DataGrid.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseStage from '$lib/showcase/ShowcaseStage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { jsonField, snippetToggle } from '$lib/showcase/snippet-field'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
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

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

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

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ value: pgValue }),
    sync: { tag: 'DataGrid', getFields: () => syncFields },
  })

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
    { name: 'editable', type: 'boolean', defaultValue: 'true', note: 'Enables in-place cell editing and structure edits; the eye stages the customization.', editor: 'boolean', value: pgEditable, onChange: value => { pgEditable = value as TriState; pgEditableOn = true; }, toggle: snippetToggle(pgEditableOn, enabled => (pgEditableOn = enabled)), sync: { kind: 'tri' } },
    { name: 'hideHeaderToggle', type: 'boolean', defaultValue: 'false', note: 'Hides the toolbar header toggle; the eye stages the customization.', editor: 'boolean', value: pgHideHeaderToggle, onChange: value => { pgHideHeaderToggle = value as TriState; pgHideHeaderToggleOn = true; }, toggle: snippetToggle(pgHideHeaderToggleOn, enabled => (pgHideHeaderToggleOn = enabled)), sync: { kind: 'tri' } },
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
    { name: 'maxColumns', type: 'number?', defaultValue: '—', note: 'Locks the column count (e.g. key/value grids); the eye stages the customization.', editor: 'number', clearable: true, value: pgMaxColumns, onChange: value => { pgMaxColumns = value; pgMaxColumnsOn = true; }, toggle: snippetToggle(pgMaxColumnsOn, enabled => (pgMaxColumnsOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    { name: 'showHeaders', type: 'boolean', defaultValue: 'true', note: 'Treats the first row as a header (bindable); the eye stages the customization.', editor: 'boolean', value: pgShowHeaders, onChange: value => { pgShowHeaders = value as TriState; pgShowHeadersOn = true; }, toggle: snippetToggle(pgShowHeadersOn, enabled => (pgShowHeadersOn = enabled)), sync: { kind: 'tri' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Toolbar scale; numbers are icon-scale pixels interpolated between the steps; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', placeholder: 'md', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => { const attr = attrs?.get('size'); if (!attr) return 'md'; if (attr.kind === 'string') return attr.value; if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value; return undefined } } },
    { name: 'storageKey', type: 'string?', defaultValue: '—', note: 'Persists resized widths under this localStorage key; the eye stages the customization.', editor: 'text', clearable: true, value: pgStorageKey, onChange: value => { pgStorageKey = value; pgStorageKeyOn = true; }, toggle: snippetToggle(pgStorageKeyOn, enabled => (pgStorageKeyOn = enabled)), sync: { kind: 'text' } },
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

  const syncFields = $derived(syncFieldsOf(fields))

  // The seed covers every override except the cell data (the snippet reads it
  // from scope), so only grid edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  useScopeRefresh(preview, () => [pgValue])
</script>

<ShowcasePage
    {fields}
    title="DataGrid"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ value: pgValue }}
>
    <ShowcaseStage paneClass="h-72 w-full">
      <DataGrid value={pgValueEnabled ? pgValue : undefined} onChange={next => (pgValue = next)} {editable} {showHeaders} {hideHeaderToggle} columnLabels={pgColumnLabelsEnabled && pgColumnLabels.length ? pgColumnLabels : undefined} initialColumnWidths={pgInitialColumnWidthsEnabled && pgInitialColumnWidths.length ? pgInitialColumnWidths : undefined} maxColumns={demoMaxColumns} storageKey={pgStorageKeyOn && pgStorageKey ? pgStorageKey : undefined} size={demoSize} />
    </ShowcaseStage>
  </ShowcasePage>
