<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'
  import Pagination from '$lib/components/Pagination.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import type { SnippetAttribute } from '$lib/showcase/snippet-attributes'
  import { jsonField, resetToggle, snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import { CUSTOM_LABELS, DEFAULT_PAGE_SIZE_OPTIONS, LABEL_FIELDS, buildPaginationSnippet, parseLabelsJson, parseLabelsValue, parsePageSizeOptionsJson } from './demo-snippet'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import type { PaginationLabels } from '$lib/components/pagination-labels'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgPageSize`/`pgCurrentPage`/`pgTotal` are interaction state fed through
  // scope. `pgLabels` is the `labels` object: the Labels control below fills
  // it from the shared preset or clears it back to the defaults.
  let pgPageSize = $state(10)
  let pgCurrentPage = $state(3)
  let pgTotal = $state(200)
  // The page-size choices edited through the JSON dialog below. The component
  // owns the same defaults, so the eye starts off (the prop omitted) and
  // committing re-applies it; turning the eye off resets to the defaults.
  let pgPageSizeOptions = $state([...DEFAULT_PAGE_SIZE_OPTIONS])
  let pgPageSizeOptionsEnabled = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgLabels = $state<PaginationLabels>({})
  // The labels map applies only while its eye toggle is on (on, so the
  // cleared form renders the current demo).
  let pgLabelsEnabled = $state(true)
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)
  let pgTrailing = $state('')
  let pgTrailingOn = $state(false)

  const customOptions = [{ value: 'yes', label: 'Custom' }]

  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const demoClassName = $derived(pgClassNameOn && pgClassName ? pgClassName : undefined)
  const hasCustomLabels = $derived(LABEL_FIELDS.some(field => pgLabels[field]))

  function handlePageSizeChange(size: number) {
    pgPageSize = size
    pgCurrentPage = 1
  }

  // Number Value cells commit through these writers: blank or invalid input
  // keeps the last valid interaction state instead of corrupting the demo.
  function applyCurrentPageValue(value: string) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isInteger(parsed) && parsed > 0) pgCurrentPage = parsed
  }

  function applyPageSizeValue(value: string) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isInteger(parsed) && parsed > 0) pgPageSize = parsed
  }

  function applyTotalValue(value: string) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isInteger(parsed) && parsed > 0) pgTotal = parsed
  }

  // `labels` commits through this writer: the dialog seeds from the
  // fallback-resolved object, so empty-string fields drop back to unset and a
  // bare `{}` clears every override. Committing re-applies the eye.
  function commitLabelsDraft(draft: string) {
    const parsed = parseLabelsJson(draft)
    if (!parsed) return
    const next: PaginationLabels = {}
    for (const field of LABEL_FIELDS) {
      if (parsed[field]) next[field] = parsed[field]
    }
    pgLabels = next
    pgLabelsEnabled = true
  }

  // Read the inline `labels={{ ... }}` expression back into a JSON draft:
  // HTML-escaped quotes fold back to quotes. A missing object unsets (like
  // the builder omitting the line); anything else is custom code the
  // playground leaves alone.
  function readLabelsAttribute(attrs: Map<string, SnippetAttribute> | null): string | undefined {
    const attr = attrs?.get('labels')
    // Absent resolves to the current state, never a reset: toggling the eye off
    // writes the omitted prop back, and that write must not wipe the committed
    // labels.
    if (!attr) return JSON.stringify(pgLabels, null, 2)
    if (attr.kind !== 'expression') return undefined
    const body = attr.value.trim()
    if (!body.startsWith('{') || !body.endsWith('}')) return undefined
    const out: Record<string, string> = {}
    for (const field of LABEL_FIELDS) {
      const match = new RegExp(`${field}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(body)
      if (match?.[1] !== undefined) {
        out[field] = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
      }
    }
    if (Object.keys(out).length === 0 && !/^\{\s*\}$/.test(body)) return undefined
    return JSON.stringify(out)
  }

  // Lenient commit for snippet write-backs: empty strings mean unset.
  function commitLabelsWriteBack(json: string) {
    // A deleted snippet line reads back as '' and clears every override.
    if (json === '') {
      pgLabels = {}
      return
    }
    let parsed: PaginationLabels | null
    try {
      parsed = parseLabelsValue(JSON.parse(json))
    } catch {
      return
    }
    if (!parsed) return
    const next: PaginationLabels = {}
    for (const field of LABEL_FIELDS) {
      if (parsed[field]) next[field] = parsed[field]
    }
    pgLabels = next
  }

  function clearPlayground() {
    pgPageSize = 10
    pgCurrentPage = 3
    pgTotal = 200
    pgPageSizeOptions = [...DEFAULT_PAGE_SIZE_OPTIONS]
    pgPageSizeOptionsEnabled = false
    pgSize = 'md'
    pgSizeOn = false
    pgLabels = {}
    pgLabelsEnabled = true
    pgClassName = ''
    pgClassNameOn = false
    pgTrailing = ''
    pgTrailingOn = false
  }

  const code = $derived.by(() =>
    buildPaginationSnippet({
      size: pgSize,
      sizeOn: pgSizeOn,
      labels: pgLabels,
      labelsEnabled: pgLabelsEnabled,
      pageSizeOptions: pgPageSizeOptions,
      pageSizeOptionsEnabled: pgPageSizeOptionsEnabled,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      trailing: pgTrailingOn ? pgTrailing : '',
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ pageSize: pgPageSize, currentPage: pgCurrentPage, total: pgTotal, pageSizeOptions: pgPageSizeOptions, handlePageSizeChange }),
    sync: { tag: 'Pagination', getFields: () => syncFields },
  })

  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The Labels
  // control below fills the `labels` object from the shared preset, like the
  // Value dialog.
  const fields: SyncableFieldConfig[] = $derived([
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the nav; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'currentPage', type: 'number', defaultValue: '—', note: 'Active page (1-based).', editor: 'number', value: String(pgCurrentPage), onChange: applyCurrentPageValue }, // No eye: required live pagination state; omission would break the demo.
    jsonField({
      name: 'labels',
      type: 'PaginationLabels',
      note: 'Per-field label overrides; each omitted field falls back to its i18n key. The eye applies the map.',
      value: JSON.stringify(pgLabels, null, 2),
      onChange: commitLabelsDraft,
      dialog: { valid: (draft: string) => parseLabelsJson(draft) != null, invalidMessage: 'Invalid labels JSON. Use an object with string previous, next, pageSize, current, and nav keys.', title: 'Edit labels' },
      toggle: snippetToggle(pgLabelsEnabled, enabled => (pgLabelsEnabled = enabled)),
      sync: { kind: 'custom', read: readLabelsAttribute, set: commitLabelsWriteBack },
    }),
    { name: 'pageSize', type: 'number', defaultValue: '—', note: 'Items per page.', editor: 'number', value: String(pgPageSize), onChange: applyPageSizeValue }, // No eye: required live pagination state; omission would break the demo.
    jsonField({
      name: 'pageSizeOptions',
      type: 'number[]',
      note: 'Page-size choices offered by the dropdown. The eye resets to the defaults.',
      value: JSON.stringify(pgPageSizeOptions, null, 2),
      onChange: (draft: string) => {
        const parsed = parsePageSizeOptionsJson(draft)
        if (parsed) {
          pgPageSizeOptions = parsed
          pgPageSizeOptionsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parsePageSizeOptionsJson(draft) != null, invalidMessage: 'Invalid page-size options JSON. Use a non-empty array of positive integers.' },
      toggle: resetToggle(
        pgPageSizeOptionsEnabled,
        enabled => (pgPageSizeOptionsEnabled = enabled),
        () => (pgPageSizeOptions = [...DEFAULT_PAGE_SIZE_OPTIONS]),
      ),
    }),
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Control scale; numbers flow to the page-size dropdown interpolated between the steps; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, placeholder: 'md', clearLabel: 'Clear size', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => {
      const attr = attrs?.get('size')
      // Absent restores the default, like the builder omitting the line;
      // string and numeric shapes set, anything else is custom code the
      // playground leaves alone.
      if (!attr) return 'md'
      if (attr.kind === 'string') return attr.value
      if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
      return undefined
    } } },
    { name: 'total', type: 'number', defaultValue: '—', note: 'Total item count.', editor: 'number', value: String(pgTotal), onChange: applyTotalValue }, // No eye: required live pagination state; omission would break the demo.
    snippetField({
      name: 'trailing',
      note: 'Arbitrary content pinned to the row’s right edge; committing applies it, and the dialog edits its text.',
      value: pgTrailing,
      onChange: value => (pgTrailing = value),
      toggle: snippetToggle(pgTrailingOn, enabled => (pgTrailingOn = enabled)),
    }),
    { name: 'onPageChange', type: '(page: number) => void', defaultValue: '—', note: 'Called on page change.' },
    { name: 'onPageSizeChange', type: '(size: number) => void', defaultValue: '—', note: 'Called on page-size change.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // The seed covers every override except the paging interaction state (the
  // snippet reads it from scope), so only paging edits need a scope refresh;
  // everything else reseeds. The refresh preserves the editor text by
  // recompiling the draft.
  useScopeRefresh(preview, () => [pgPageSize, pgCurrentPage, pgTotal, pgPageSizeOptions])
</script>

{#snippet settingsPanel()}
  <!-- The Labels preset fills the labels object; the Value column edits the
    same object as JSON. -->
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Labels">
      <SelectDropdown
        buttonLabel={hasCustomLabels ? 'Custom' : 'Default'}
        activeValue={hasCustomLabels ? 'yes' : ''}
        ariaLabel="Labels"
        options={customOptions}
        onSelect={() => {
          pgLabels = { ...CUSTOM_LABELS }
        }}
        clearable
        clearLabel="Clear labels"
        onClear={() => {
          pgLabels = {}
        }} />
    </FormField>
  </div>
{/snippet}

{#snippet demoTrailing()}
  <span>{pgTrailing}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="Pagination"
    {code}
    {preview}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{ pageSize: pgPageSize, currentPage: pgCurrentPage, total: pgTotal, pageSizeOptions: pgPageSizeOptions, handlePageSizeChange }}
>
    <Pagination
      total={pgTotal}
      pageSize={pgPageSize}
      currentPage={pgCurrentPage}
      pageSizeOptions={pgPageSizeOptionsEnabled ? pgPageSizeOptions : undefined}
      size={demoSize}
      labels={pgLabelsEnabled ? pgLabels : undefined}
      className={demoClassName}
      trailing={pgTrailingOn && pgTrailing ? demoTrailing : undefined}
      onPageChange={page => (pgCurrentPage = page)}
      onPageSizeChange={handlePageSizeChange} />
  </ShowcasePage>
