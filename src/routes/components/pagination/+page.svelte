<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'
  import Pagination from '$lib/components/Pagination.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import type { SnippetAttribute } from '$lib/showcase/snippet-attributes'
  import { textField, sizeField, jsonField, resetToggle, snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
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
  const INITIAL = {
    pageSize: 10,
    currentPage: 3,
    total: 200,
    pageSizeOptions: [...DEFAULT_PAGE_SIZE_OPTIONS],
    pageSizeOptionsEnabled: false,
    size: 'md',
    sizeOn: false,
    labels: {} as PaginationLabels,
    labelsEnabled: true,
    className: '',
    classNameOn: false,
    trailing: '',
    trailingOn: false,
  }
  let pg = $state(structuredClone(INITIAL))
  // The page-size choices edited through the JSON dialog below. The component
  // owns the same defaults, so the eye starts off (the prop omitted) and
  // committing re-applies it; turning the eye off resets to the defaults.
  // The labels map applies only while its eye toggle is on (on, so the
  // cleared form renders the current demo).

  const customOptions = [{ value: 'yes', label: 'Custom' }]

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]

  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const demoClassName = $derived(pg.classNameOn && pg.className ? pg.className : undefined)
  const hasCustomLabels = $derived(LABEL_FIELDS.some(field => pg.labels[field]))

  function handlePageSizeChange(size: number) {
    pg.pageSize = size
    pg.currentPage = 1
  }

  // Number Value cells commit through these writers: blank or invalid input
  // keeps the last valid interaction state instead of corrupting the demo.
  function applyCurrentPageValue(value: string) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isInteger(parsed) && parsed > 0) pg.currentPage = parsed
  }

  function applyPageSizeValue(value: string) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isInteger(parsed) && parsed > 0) pg.pageSize = parsed
  }

  function applyTotalValue(value: string) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isInteger(parsed) && parsed > 0) pg.total = parsed
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
    pg.labels = next
    pg.labelsEnabled = true
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
    if (!attr) return JSON.stringify(pg.labels, null, 2)
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
      pg.labels = {}
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
    pg.labels = next
  }

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildPaginationSnippet({
      size: pg.size,
      sizeOn: pg.sizeOn,
      labels: pg.labels,
      labelsEnabled: pg.labelsEnabled,
      pageSizeOptions: pg.pageSizeOptions,
      pageSizeOptionsEnabled: pg.pageSizeOptionsEnabled,
      className: pg.className,
      classNameOn: pg.classNameOn,
      trailing: pg.trailingOn ? pg.trailing : '',
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The Labels
  // control below fills the `labels` object from the shared preset, like the
  // Value dialog.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the nav.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: '', clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    { name: 'currentPage', type: 'number', defaultValue: '—', note: 'Active page (1-based).', editor: 'number', value: String(pg.currentPage), onChange: applyCurrentPageValue }, // No eye: required live pagination state; omission would break the demo.
    jsonField({
      name: 'labels',
      type: 'PaginationLabels?',
      note: 'Per-field label overrides; each omitted field falls back to its i18n key. The eye applies the map.',
      value: JSON.stringify(pg.labels, null, 2),
      onChange: commitLabelsDraft,
      dialog: { valid: (draft: string) => parseLabelsJson(draft) != null, invalidMessage: 'Invalid labels JSON. Use an object with string previous, next, pageSize, current, and nav keys.', title: 'Edit labels' },
      toggle: snippetToggle(pg.labelsEnabled, enabled => (pg.labelsEnabled = enabled)),
      sync: { kind: 'custom', read: readLabelsAttribute, set: commitLabelsWriteBack },
    }),
    { name: 'pageSize', type: 'number', defaultValue: '—', note: 'Items per page.', editor: 'number', value: String(pg.pageSize), onChange: applyPageSizeValue }, // No eye: required live pagination state; omission would break the demo.
    jsonField({
      name: 'pageSizeOptions',
      type: 'number[]?',
      note: 'Page-size choices offered by the dropdown. The eye resets to the defaults.',
      value: JSON.stringify(pg.pageSizeOptions, null, 2),
      onChange: (draft: string) => {
        const parsed = parsePageSizeOptionsJson(draft)
        if (parsed) {
          pg.pageSizeOptions = parsed
          pg.pageSizeOptionsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parsePageSizeOptionsJson(draft) != null, invalidMessage: 'Invalid page-size options JSON. Use a non-empty array of positive integers.' },
      toggle: resetToggle(
        pg.pageSizeOptionsEnabled,
        enabled => (pg.pageSizeOptionsEnabled = enabled),
        () => (pg.pageSizeOptions = [...DEFAULT_PAGE_SIZE_OPTIONS]),
      ),
    }),
    sizeField({ note: 'Control scale; numbers flow to the page-size dropdown interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'total', type: 'number', defaultValue: '—', note: 'Total item count.', editor: 'number', value: String(pg.total), onChange: applyTotalValue }, // No eye: required live pagination state; omission would break the demo.
    snippetField({
      name: 'trailing',
      note: 'Arbitrary content pinned to the row’s right edge; committing applies it, and the dialog edits its text.',
      value: pg.trailing,
      onChange: value => (pg.trailing = value),
      toggle: snippetToggle(pg.trailingOn, enabled => (pg.trailingOn = enabled)),
    }),
    { name: 'onPageChange', type: '(page: number) => void', defaultValue: '—', note: 'Called on page change.' },
    { name: 'onPageSizeChange', type: '(size: number) => void', defaultValue: '—', note: 'Called on page-size change.' },
  ])

  // The seed covers every override except the paging interaction state (the
  // snippet reads it from scope), so only paging edits need a scope refresh;
  // everything else reseeds. The refresh preserves the editor text by
  // recompiling the draft.
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
          pg.labels = { ...CUSTOM_LABELS }
        }}
        clearable
        clearLabel="Clear labels"
        onClear={() => {
          pg.labels = {}
        }} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.size}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => {
          pg.size = value
          pg.sizeOn = true
        }}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size = 'md'
          pg.sizeOn = false
        }} />
    </FormField>
  </div>
{/snippet}

{#snippet demoTrailing()}
  <span>{pg.trailing}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="Pagination"
    {code}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{ pageSize: pg.pageSize, currentPage: pg.currentPage, total: pg.total, pageSizeOptions: pg.pageSizeOptions, handlePageSizeChange }}

    sync={{ tag: 'Pagination' }}
    scopeRefresh={() => [pg.pageSize, pg.currentPage, pg.total, pg.pageSizeOptions]}
  >
    <Pagination
      total={pg.total}
      pageSize={pg.pageSize}
      currentPage={pg.currentPage}
      pageSizeOptions={pg.pageSizeOptionsEnabled ? pg.pageSizeOptions : undefined}
      size={demoSize}
      labels={pg.labelsEnabled ? pg.labels : undefined}
      className={demoClassName}
      trailing={pg.trailingOn && pg.trailing ? demoTrailing : undefined}
      onPageChange={page => (pg.currentPage = page)}
      onPageSizeChange={handlePageSizeChange} />
  </ShowcasePage>
