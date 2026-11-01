<script lang="ts">
  import FieldTable, { type FieldConfig } from '$lib/components/FieldTable.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/playground/size-input'
  import { jsonField, sizeField } from '$showcase/playground/snippet-field'
  import { applied, eye, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { syncFieldsOf, type SyncField, type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import type { SnippetAttribute } from '$showcase/playground/snippet-attributes'
  import { type TriState } from '$showcase/playground/snippet-build'
  import { buildFieldTableSnippet, FIELD_TABLE_DEMO_ROWS, parseHeadersJson } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // The sample values drive the demo table below; the header overrides drive
  // its column labels (unset reads the localized label, like the demo).
  const INITIAL = {
    name: '',
    role: 'viewer',
    size: 'md',
    active: 'no' as TriState,
    notes: staged('', true),
    headers: staged({ prop: 'Prop', type: 'Type', default: 'Default', value: 'Value', note: 'Notes' }, true),
    tableSize: staged('md'),
  }
  let pg = $state(structuredClone(INITIAL))
  // The header overrides apply while their eye toggle is on; the notes sample
  // is bound demo state, so its row eye resets the text instead.

  const demoHeaders = $derived({
    prop: pg.headers.value.prop || i18n.t('showcase.prop'),
    type: pg.headers.value.type || i18n.t('showcase.type'),
    default: pg.headers.value.default || i18n.t('showcase.default'),
    value: pg.headers.value.value || i18n.t('showcase.value'),
    note: pg.headers.value.note || i18n.t('showcase.note'),
  })
  const demoTableSize = $derived.by(() => {
    const value = applied(pg.tableSize)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  // Fallback-resolved labels seed the headers JSON dialog, so the editor
  // shows what the demo shows (an unset key reads its localized label).
  const headersDraft = $derived(JSON.stringify(demoHeaders, null, 2))

  function commitHeadersDraft(draft: string) {
    const parsed = parseHeadersJson(draft)
    if (!parsed) return
    stage(pg.headers, parsed)
  }

  // Scope refs behind each header key; a snippet write-back maps them to
  // unset (the dialog itself only ever commits literals).
  const HEADER_SCOPE_REFS: Record<string, string> = {
    prop: 'propText',
    type: 'typeText',
    default: 'defaultText',
    value: 'valueText',
    note: 'noteText',
  }
  const HEADER_KEYS = ['prop', 'type', 'default', 'value', 'note'] as const

  // Read the inline `headers={{ ... }}` expression back into a JSON draft:
  // scope refs become empty (unset), string literals stay literal. Anything
  // else (a missing or partial object, custom code) leaves the playground
  // alone.
  function readHeadersAttribute(attrs: Map<string, SnippetAttribute> | null): string | undefined {
    const attr = attrs?.get('headers')
    if (!attr || attr.kind !== 'expression') return undefined
    const body = attr.value.trim()
    if (!body.startsWith('{') || !body.endsWith('}')) return undefined
    const out: Record<string, string> = {}
    for (const key of HEADER_KEYS) {
      const match = new RegExp(`${key}\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|[A-Za-z_$][A-Za-z0-9_$]*)`).exec(body)
      if (!match) return undefined
      const token = match[1]!
      if (token.startsWith('"')) {
        try {
          const parsed: unknown = JSON.parse(token)
          if (typeof parsed !== 'string' || !parsed) return undefined
          out[key] = parsed
        } catch {
          return undefined
        }
      } else if (token === HEADER_SCOPE_REFS[key]) {
        out[key] = ''
      } else {
        return undefined
      }
    }
    return JSON.stringify(out)
  }

  // Lenient commit for snippet write-backs: empty strings mean unset (the
  // strict dialog parser rejects them, but `readHeadersAttribute` emits them
  // for scope refs).
  function commitHeadersWriteBack(json: string) {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      return
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return
    const record = parsed as Record<string, unknown>
    const next = { ...pg.headers.value }
    if (typeof record.prop === 'string') next.prop = record.prop
    if (typeof record.type === 'string') next.type = record.type
    if (typeof record.default === 'string') next.default = record.default
    if (typeof record.value === 'string') next.value = record.value
    if (typeof record.note === 'string') next.note = record.note
    pg.headers.value = next
  }

  // The demo documents FieldTable with itself: five editable sample fields
  // plus a read-only function row. The data-only facets come from the builder's
  // shared row list, so the static demo and Show-code cannot drift; this page
  // adds only its live state behind each row.
  function demoFieldValue(name: string): string | undefined {
    switch (name) {
      case 'name':
        return pg.name
      case 'role':
        return pg.role
      case 'size':
        return pg.size
      case 'active':
        return pg.active
      case 'notes':
        return pg.notes.value
      default:
        return undefined
    }
  }

  function demoFieldChange(name: string): ((value: string) => void) | undefined {
    switch (name) {
      case 'name':
        return value => (pg.name = value)
      case 'role':
        return value => (pg.role = value)
      case 'size':
        return value => (pg.size = value)
      case 'active':
        return value => (pg.active = value as TriState)
      case 'notes':
        return value => stage(pg.notes, value)
      default:
        return undefined
    }
  }

  const demoFields: FieldConfig[] = $derived(
    FIELD_TABLE_DEMO_ROWS.map(({ toggle, ...row }) => {
      const value = demoFieldValue(row.name)
      const onChange = demoFieldChange(row.name)
      return {
        ...row,
        ...(value !== undefined ? { value } : {}),
        ...(onChange ? { onChange } : {}),
        ...(toggle
          ? {
              toggle: eyeResetToggle(pg.notes, () => (pg.notes.value = '')),
            }
          : {}),
      }
    }),
  )

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildFieldTableSnippet({
      name: pg.name,
      role: pg.role,
      size: pg.size,
      active: pg.active,
      notes: pg.notes.value,
      headers: pg.headers,
      tableSize: pg.tableSize,
    }),
  )

  
  // Snippet write-backs for the sample values derive from `fields` below
  // through `syncFieldsOf`; those values have no prop row, so their
  // write-backs stay explicit.

  // Editable rows first (plain data, A–Z), then the read-only rows: `fields`
  // carries functions and `value` is a snippet override, so both stay
  // read-only. `headers` is plain data, so it edits through a JSON dialog.
  const fields: SyncableFieldConfig[] = $derived([
    jsonField({
      name: 'headers',
      type: 'FieldTableHeaders?',
      note: 'Column labels; omitted keys keep the English defaults. The eye applies the overrides.',
      value: headersDraft,
      onChange: commitHeadersDraft,
      dialog: { valid: (draft: string) => parseHeadersJson(draft) != null, invalidMessage: 'Invalid headers JSON. Use an object with string prop, type, default, value, and note keys.', title: 'Edit headers' },
      toggle: eyeToggle(pg.headers),
      sync: { kind: 'custom', read: readHeadersAttribute, set: commitHeadersWriteBack },
    }),
    sizeField({ note: 'Editor and action scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.tableSize) }),
    { name: 'fields', type: 'FieldConfig[]', defaultValue: '—', note: 'Field defs in display order; editors render from editor/value/onChange.' },
    { name: 'value', type: 'Snippet<[FieldConfig]>', defaultValue: '—', note: 'Per-row Value cell override; wins over the built-in editors.' },
  ])

  const syncFields: SyncField[] = $derived([
    ...syncFieldsOf(fields),
    // Demo-only data has no prop row; keep its write-backs explicit.
    { attr: 'name', kind: 'script', set: value => (pg.name = value) },
    { attr: 'role', kind: 'script', set: value => (pg.role = value) },
    { attr: 'size', kind: 'script', set: value => (pg.size = value) },
    { attr: 'active', kind: 'script', set: value => (pg.active = value as TriState) },
    { attr: 'notes', kind: 'script', set: value => (pg.notes.value = value) },
  ])
</script>

<ShowcasePage
    {fields}
    title="FieldTable"
    {code}
    onReset={clearPlayground}
    scope={{
      propText: i18n.t('showcase.prop'),
      typeText: i18n.t('showcase.type'),
      defaultText: i18n.t('showcase.default'),
      valueText: i18n.t('showcase.value'),
      noteText: i18n.t('showcase.note'),
    }}

    sync={{ tag: 'FieldTable', getFields: () => syncFields }}
  >
    <FieldTable
      fields={demoFields}
      size={demoTableSize}
      headers={pg.headers.on ? demoHeaders : undefined} />
  </ShowcasePage>
