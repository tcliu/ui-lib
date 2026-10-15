<script lang="ts">
  import FieldTable, { type FieldConfig } from '$lib/components/FieldTable.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { jsonField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import { syncFieldsOf, type SyncField, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import type { SnippetAttribute } from '$lib/showcase/snippet-attributes'
  import { buildFieldTableSnippet, parseHeadersJson, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // The sample values drive the demo table below; the header overrides drive
  // its column labels (unset reads the localized label, like the demo).
  let pgName = $state('')
  let pgRole = $state('viewer')
  let pgSize = $state('md')
  let pgActive = $state<TriState>('no')
  let pgNotes = $state('')
  let pgPropHeader = $state('Prop')
  let pgTypeHeader = $state('Type')
  let pgDefaultHeader = $state('Default')
  let pgValueHeader = $state('Value')
  let pgNoteHeader = $state('Notes')
  let pgTableSize = $state('md')
  let pgTableSizeOn = $state(false)
  // The header overrides and the sample notes apply only while their eye
  // toggle is on (both on, so the cleared form renders the current demo).
  let pgHeadersEnabled = $state(true)
  let pgNotesEnabled = $state(true)

  const roleOptions = [
    { value: 'admin', label: 'admin' },
    { value: 'editor', label: 'editor' },
    { value: 'viewer', label: 'viewer' },
  ]

  const demoPropHeader = $derived(pgPropHeader || i18n.t('showcase.prop'))
  const demoTypeHeader = $derived(pgTypeHeader || i18n.t('showcase.type'))
  const demoDefaultHeader = $derived(pgDefaultHeader || i18n.t('showcase.default'))
  const demoValueHeader = $derived(pgValueHeader || i18n.t('showcase.value'))
  const demoNoteHeader = $derived(pgNoteHeader || i18n.t('showcase.note'))
  const demoTableSize = $derived(pgTableSizeOn ? parseSizeValue(pgTableSize) : undefined)
  // Fallback-resolved labels seed the headers JSON dialog, so the editor
  // shows what the demo shows (an unset key reads its localized label).
  const demoHeaders = $derived({
    prop: demoPropHeader,
    type: demoTypeHeader,
    default: demoDefaultHeader,
    value: demoValueHeader,
    note: demoNoteHeader,
  })
  const headersDraft = $derived(JSON.stringify(demoHeaders, null, 2))

  function commitHeadersDraft(draft: string) {
    const parsed = parseHeadersJson(draft)
    if (!parsed) return
    pgPropHeader = parsed.prop
    pgTypeHeader = parsed.type
    pgDefaultHeader = parsed.default
    pgValueHeader = parsed.value
    pgNoteHeader = parsed.note
    pgHeadersEnabled = true
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
    if (typeof record.prop === 'string') pgPropHeader = record.prop
    if (typeof record.type === 'string') pgTypeHeader = record.type
    if (typeof record.default === 'string') pgDefaultHeader = record.default
    if (typeof record.value === 'string') pgValueHeader = record.value
    if (typeof record.note === 'string') pgNoteHeader = record.note
  }

  // The demo documents FieldTable with itself: five editable sample fields
  // plus a read-only function row. Mirrors the builder's inline fields.
  const demoFields: FieldConfig[] = $derived([
    { name: 'name', type: 'string', defaultValue: "''", editorDefaultValue: '', note: 'Display name.', editor: 'text', clearable: true, value: pgName, onChange: value => (pgName = value) },
    { name: 'role', type: "'admin' | 'editor' | 'viewer'", defaultValue: "'viewer'", note: 'Access level.', editor: 'enum', options: roleOptions, value: pgRole, onChange: value => (pgRole = value), placeholder: 'viewer', clearLabel: 'Clear role' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Control scale.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => (pgSize = value), placeholder: 'md', clearLabel: 'Clear size' },
    { name: 'active', type: 'boolean', defaultValue: 'false', note: 'Whether the account is active.', editor: 'boolean', value: pgActive, onChange: value => (pgActive = value as TriState) },
    { name: 'notes', type: 'string', defaultValue: "''", note: 'Long text edited in a code dialog; the eye resets the text.', editor: 'snippet', value: pgNotes, onChange: value => {
      pgNotes = value
      pgNotesEnabled = true
    }, toggle: resetToggle(
      pgNotesEnabled,
      enabled => (pgNotesEnabled = enabled),
      () => (pgNotes = ''),
    ) },
    { name: 'onSave', type: '() => void', defaultValue: '—', note: 'Save handler.' },
  ])

  function clearPlayground() {
    pgName = ''
    pgRole = 'viewer'
    pgSize = 'md'
    pgActive = 'no'
    pgNotes = ''
    pgNotesEnabled = true
    pgPropHeader = 'Prop'
    pgTypeHeader = 'Type'
    pgDefaultHeader = 'Default'
    pgValueHeader = 'Value'
    pgNoteHeader = 'Notes'
    pgTableSize = 'md'
    pgTableSizeOn = false
    pgHeadersEnabled = true
  }

  const code = $derived.by(() =>
    buildFieldTableSnippet({
      name: pgName,
      role: pgRole,
      size: pgSize,
      active: pgActive,
      notes: pgNotes,
      propHeader: pgPropHeader,
      typeHeader: pgTypeHeader,
      defaultHeader: pgDefaultHeader,
      valueHeader: pgValueHeader,
      noteHeader: pgNoteHeader,
      headersEnabled: pgHeadersEnabled,
      tableSize: pgTableSize,
      tableSizeOn: pgTableSizeOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      propText: i18n.t('showcase.prop'),
      typeText: i18n.t('showcase.type'),
      defaultText: i18n.t('showcase.default'),
      valueText: i18n.t('showcase.value'),
      noteText: i18n.t('showcase.note'),
    }),
    sync: { tag: 'FieldTable', getFields: () => syncFields },
  })

  // Snippet write-backs for the sample values derive from `fields` below
  // through `syncFieldsOf`; the header keys are demo-only data with no prop
  // row, so their write-backs stay explicit, like the sample values.

  // Editable rows first (plain data, A–Z), then the read-only rows: `fields`
  // carries functions and `value` is a snippet override, so both stay
  // read-only. `headers` is plain data, so it edits through a JSON dialog.
  const fields: SyncableFieldConfig[] = $derived([
    jsonField({
      name: 'headers',
      type: 'FieldTableHeaders',
      note: 'Column labels; omitted keys keep the English defaults. The eye applies the overrides.',
      value: headersDraft,
      onChange: commitHeadersDraft,
      dialog: { valid: (draft: string) => parseHeadersJson(draft) != null, invalidMessage: 'Invalid headers JSON. Use an object with string prop, type, default, value, and note keys.', title: 'Edit headers' },
      toggle: snippetToggle(pgHeadersEnabled, enabled => (pgHeadersEnabled = enabled)),
      sync: { kind: 'custom', read: readHeadersAttribute, set: commitHeadersWriteBack },
    }),
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Editor and action scale; numbers are icon-scale pixels interpolated between the steps; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgTableSize, onChange: value => { pgTableSize = value; pgTableSizeOn = true; }, placeholder: 'md', clearLabel: 'Clear size', toggle: snippetToggle(pgTableSizeOn, enabled => (pgTableSizeOn = enabled)), sync: { kind: 'custom', read: attrs => { const attr = attrs?.get('size'); if (!attr) return 'md'; if (attr.kind === 'string') return attr.value; if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value; return undefined } } },
    { name: 'fields', type: 'FieldConfig[]', defaultValue: '—', note: 'Field defs in display order; editors render from editor/value/onChange.' },
    { name: 'value', type: 'Snippet<[FieldConfig]>', defaultValue: '—', note: 'Per-row Value cell override; wins over the built-in editors.' },
  ])

  const syncFields: SyncField[] = $derived([
    ...syncFieldsOf(fields),
    // Demo-only data has no prop row; keep its write-backs explicit.
    { attr: 'name', kind: 'script', set: value => (pgName = value) },
    { attr: 'role', kind: 'script', set: value => (pgRole = value) },
    { attr: 'size', kind: 'script', set: value => (pgSize = value) },
    { attr: 'active', kind: 'script', set: value => (pgActive = value as TriState) },
    { attr: 'notes', kind: 'script', set: value => (pgNotes = value) },
  ])
</script>

<ShowcasePage
    {fields}
    title="FieldTable"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{
      propText: i18n.t('showcase.prop'),
      typeText: i18n.t('showcase.type'),
      defaultText: i18n.t('showcase.default'),
      valueText: i18n.t('showcase.value'),
      noteText: i18n.t('showcase.note'),
    }}
>
    <FieldTable
      fields={demoFields}
      size={demoTableSize}
      headers={pgHeadersEnabled ? demoHeaders : undefined} />
  </ShowcasePage>
