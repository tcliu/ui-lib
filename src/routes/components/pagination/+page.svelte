<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'
  import Pagination from '$lib/components/Pagination.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import type { SnippetAttribute } from '$showcase/playground/snippet-attributes'
  import { applied, eye, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { textField, sizeField, jsonField, snippetField } from '$showcase/playground/snippet-field'
  import { CUSTOM_LABELS, DEFAULT_PAGE_SIZE_OPTIONS, LABEL_FIELDS, buildPaginationSnippet, parseLabelsJson, parseLabelsValue, parsePageSizeOptionsJson } from './demo-snippet'
  import { parseSizeValue } from '$showcase/playground/size-input'
  import type { PaginationLabels } from '$lib/components/pagination-labels'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgPageSize`/`pgCurrentPage`/`pgTotal` are interaction state fed through
  // scope. The labels map and the page-size choices are committed state edited
  // through the JSON dialogs below.
  const INITIAL = {
    pageSize: 10,
    currentPage: 3,
    total: 200,
    // The component owns the same default choices, so the eye starts off (the
    // prop omitted); turning the eye off resets to them.
    pageSizeOptions: staged([...DEFAULT_PAGE_SIZE_OPTIONS]),
    size: staged('md'),
    // The labels map applies only while its eye toggle is on; an empty map is
    // the component default, so the eye starts off (the prop omitted).
    labels: staged({} as PaginationLabels),
    className: staged(''),
    trailing: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))

  const customOptions = [{ value: 'yes', label: 'Custom' }]

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]

  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoClassName = $derived(applied(pg.className) || undefined)
  const hasCustomLabels = $derived(LABEL_FIELDS.some(field => pg.labels.value[field]))

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
    pg.labels.value = next
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
    if (!attr) return JSON.stringify(pg.labels.value, null, 2)
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
      pg.labels.value = {}
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
    pg.labels.value = next
  }

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildPaginationSnippet({
      size: pg.size,
      labels: pg.labels,
      pageSizeOptions: pg.pageSizeOptions,
      className: pg.className,
      trailing: pg.trailing,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The Labels
  // control below fills the `labels` object from the shared preset, like the
  // Value dialog.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the nav.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    { name: 'currentPage', type: 'number', defaultValue: '—', note: 'Active page (1-based).', editor: 'number', value: String(pg.currentPage), onChange: applyCurrentPageValue }, // No eye: required live pagination state; omission would break the demo.
    jsonField({
      name: 'labels',
      type: 'PaginationLabels?',
      note: 'Per-field label overrides; each omitted field falls back to its i18n key. The eye applies the map.',
      value: JSON.stringify(pg.labels.value, null, 2),
      onChange: commitLabelsDraft,
      dialog: { valid: (draft: string) => parseLabelsJson(draft) != null, invalidMessage: 'Invalid labels JSON. Use an object with string previous, next, pageSize, current, and nav keys.', title: 'Edit labels' },
      toggle: eyeToggle(pg.labels),
      sync: { kind: 'custom', read: readLabelsAttribute, set: commitLabelsWriteBack },
    }),
    { name: 'pageSize', type: 'number', defaultValue: '—', note: 'Items per page.', editor: 'number', value: String(pg.pageSize), onChange: applyPageSizeValue }, // No eye: required live pagination state; omission would break the demo.
    jsonField({
      name: 'pageSizeOptions',
      type: 'number[]?',
      note: 'Page-size choices offered by the dropdown. The eye resets to the defaults.',
      value: JSON.stringify(pg.pageSizeOptions.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parsePageSizeOptionsJson(draft)
        if (parsed) stage(pg.pageSizeOptions, parsed)
      },
      dialog: { valid: (draft: string) => parsePageSizeOptionsJson(draft) != null, invalidMessage: 'Invalid page-size options JSON. Use a non-empty array of positive integers.' },
      toggle: eyeResetToggle(pg.pageSizeOptions, () => (pg.pageSizeOptions.value = [...DEFAULT_PAGE_SIZE_OPTIONS])),
    }),
    sizeField({ note: 'Control scale; numbers flow to the page-size dropdown interpolated between the steps.', ...eye(pg.size) }),
    { name: 'total', type: 'number', defaultValue: '—', note: 'Total item count.', editor: 'number', value: String(pg.total), onChange: applyTotalValue }, // No eye: required live pagination state; omission would break the demo.
    snippetField({
      name: 'trailing',
      note: 'Arbitrary content pinned to the row’s right edge; committing applies it, and the dialog edits its text.',
      value: pg.trailing.value,
      onChange: value => stage(pg.trailing, value),
      toggle: eyeToggle(pg.trailing),
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
          stage(pg.labels, { ...CUSTOM_LABELS })
        }}
        clearable
        clearLabel="Clear labels"
        onClear={() => {
          pg.labels.value = {}
        }} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.size.value}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => stage(pg.size, value)}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size.value = 'md'
          pg.size.on = false
        }} />
    </FormField>
  </div>
{/snippet}

{#snippet demoTrailing()}
  <span>{pg.trailing.value}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="Pagination"
    {code}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{ pageSize: pg.pageSize, currentPage: pg.currentPage, total: pg.total, pageSizeOptions: pg.pageSizeOptions.value, handlePageSizeChange }}

    sync={{ tag: 'Pagination' }}
    scopeRefresh={() => [pg.pageSize, pg.currentPage, pg.total, pg.pageSizeOptions.value]}
  >
    <Pagination
      total={pg.total}
      pageSize={pg.pageSize}
      currentPage={pg.currentPage}
      pageSizeOptions={applied(pg.pageSizeOptions)}
      size={demoSize}
      labels={applied(pg.labels)}
      className={demoClassName}
      trailing={applied(pg.trailing) ? demoTrailing : undefined}
      onPageChange={page => (pg.currentPage = page)}
      onPageSizeChange={handlePageSizeChange} />
  </ShowcasePage>
