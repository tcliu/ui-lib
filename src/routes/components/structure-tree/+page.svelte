<script lang="ts">
  import StructureTree from '$lib/components/StructureTree.svelte'
  import {
    DEFAULT_CONTAINER_ROW_CLASS,
    DEFAULT_LEAF_ROW_CLASS,
  } from '$lib/components/StructureNode.svelte'
  import { isContainer, renameKeyAtPath, setAtPath } from '$lib/components/structure-value'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { jsonField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import {
    buildStructureTreeSnippet,
    DEFAULT_TREE_VALUE,
    parseTreeValueJson,
    readTreeValueSeed,
    type TriState,
  } from './demo-snippet'

  // Fresh copy so the demo never mutates the shared default.
  function freshValue(): unknown {
    return JSON.parse(JSON.stringify(DEFAULT_TREE_VALUE)) as unknown
  }

  // Customizer playground state. The tree value is committed state seeded from
  // the default above. Every other curated option starts at the component
  // default (the Value column shows it), so the cleared form applies no
  // overrides and Show-code omits the defaults. Clearing a Value unsets it;
  // Reset restores the defaults below.
  let pgValue = $state<unknown>(freshValue())
  // The component requires a tree value, so the eye resets to the default
  // instead of omitting; committing re-applies.
  let pgValueEnabled = $state(true)
  let pgEditable = $state<TriState>('yes')
  let pgEditableOn = $state(true)
  // Row class overrides start unset (the built-ins render); non-empty text
  // applies live, clearing restores the built-ins. The eye stages the
  // customization without losing text. The Value column seeds from the
  // built-ins below.
  let pgContainerRowClass = $state('')
  let pgContainerRowClassOn = $state(false)
  let pgLeafRowClass = $state('')
  let pgLeafRowClassOn = $state(false)

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const editable = $derived(pgEditableOn ? flagOn(pgEditable) : undefined)

  function handleNodeChange(path: string[], next: unknown): void {
    if (!isContainer(pgValue)) return
    pgValue = setAtPath(pgValue, path, next)
  }

  function handleRenameKey(parentPath: string[], oldKey: string, newKey: string): void {
    if (!isContainer(pgValue)) return
    pgValue = renameKeyAtPath(pgValue, parentPath, oldKey, newKey)
  }

  function commitValueDraft(draft: string): void {
    const parsed = parseTreeValueJson(draft)
    if (parsed !== undefined) pgValue = parsed
  }

  function clearPlayground() {
    pgValue = freshValue()
    pgValueEnabled = true
    pgEditable = 'yes'
    pgEditableOn = true
    pgContainerRowClass = ''
    pgContainerRowClassOn = false
    pgLeafRowClass = ''
    pgLeafRowClassOn = false
  }

  const code = $derived.by(() =>
    buildStructureTreeSnippet({
      value: pgValue,
      editable: pgEditable,
      editableOn: pgEditableOn,
      containerRowClass: pgContainerRowClass,
      containerRowClassOn: pgContainerRowClassOn,
      leafRowClass: pgLeafRowClass,
      leafRowClassOn: pgLeafRowClassOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({}),
    sync: { tag: 'StructureTree', getFields: () => syncFields },
  })

  // Editable rows first (A–Z), then the function props (A–Z). The value row
  // round-trips through the JSON dialog (any JSON document renders); the
  // callbacks stay read-only rows.
  const fields: SyncableFieldConfig[] = $derived([
    {
      name: 'containerRowClass',
      type: 'string?',
      defaultValue: 'built-in',
      note: 'Replaces the tunable container header row classes; the Value shows the built-ins, edit from there. Clearing restores the built-ins; the eye stages the customization.',
      editor: 'text',
      clearable: true,
      value: pgContainerRowClass || DEFAULT_CONTAINER_ROW_CLASS,
      onChange: value => {
        pgContainerRowClass = value === DEFAULT_CONTAINER_ROW_CLASS ? '' : value
        pgContainerRowClassOn = true
      },
      toggle: snippetToggle(pgContainerRowClassOn, enabled => (pgContainerRowClassOn = enabled)),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          // Absent resolves to the current Value text so seed edits elsewhere
          // never reset committed text.
          if (!attrs.has('containerRowClass')) return pgContainerRowClass || DEFAULT_CONTAINER_ROW_CLASS
          const attr = attrs.get('containerRowClass')!
          return attr.kind === 'string' ? attr.value : undefined
        },
        set: value => {
          pgContainerRowClass = value === DEFAULT_CONTAINER_ROW_CLASS ? '' : value
        },
      },
    },
    { name: 'editable', type: 'boolean', defaultValue: 'true', note: 'Gates leaf editing and key renames; the callbacks stay wired either way; the eye stages the customization.', editor: 'boolean', value: pgEditable, onChange: value => { pgEditable = value as TriState; pgEditableOn = true; }, toggle: snippetToggle(pgEditableOn, enabled => (pgEditableOn = enabled)), sync: { kind: 'tri' } },
    {
      name: 'leafRowClass',
      type: 'string?',
      defaultValue: 'built-in',
      note: 'Replaces the tunable leaf row classes; the Value shows the built-ins, edit from there. Clearing restores the built-ins; the eye stages the customization.',
      editor: 'text',
      clearable: true,
      value: pgLeafRowClass || DEFAULT_LEAF_ROW_CLASS,
      onChange: value => {
        pgLeafRowClass = value === DEFAULT_LEAF_ROW_CLASS ? '' : value
        pgLeafRowClassOn = true
      },
      toggle: snippetToggle(pgLeafRowClassOn, enabled => (pgLeafRowClassOn = enabled)),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          if (!attrs.has('leafRowClass')) return pgLeafRowClass || DEFAULT_LEAF_ROW_CLASS
          const attr = attrs.get('leafRowClass')!
          return attr.kind === 'string' ? attr.value : undefined
        },
        set: value => {
          pgLeafRowClass = value === DEFAULT_LEAF_ROW_CLASS ? '' : value
        },
      },
    },
    jsonField({
      name: 'value',
      type: 'unknown',
      note: 'Tree data; any JSON document renders as nested nodes. The eye resets to the default tree.',
      value: JSON.stringify(pgValue, null, 2) ?? 'null',
      onChange: (draft: string) => {
        commitValueDraft(draft)
        if (parseTreeValueJson(draft) !== undefined) pgValueEnabled = true
      },
      dialog: { valid: (draft: string) => parseTreeValueJson(draft) !== undefined, invalidMessage: 'Invalid value JSON. Use any JSON document.', title: 'Edit value' },
      toggle: resetToggle(
        pgValueEnabled,
        enabled => (pgValueEnabled = enabled),
        () => (pgValue = freshValue()),
      ),
      sync: { kind: 'custom', read: (_attrs, declarations) => readTreeValueSeed(declarations), set: commitValueDraft },
    }),
    { name: 'onChange', type: '(path: string[], newValue: unknown) => void', defaultValue: '—', note: 'Called with the path and the parsed replacement when a leaf edit commits.' },
    { name: 'onRenameKey', type: '(parentPath: string[], oldKey: string, newKey: string) => void', defaultValue: '—', note: 'Called with the parent path and key pair when a key rename commits.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))
</script>

<ShowcasePage
    {fields}
    title="StructureTree"
    {code}
    {preview}
    onReset={clearPlayground}
>
    <StructureTree
      value={pgValue}
      onChange={handleNodeChange}
      onRenameKey={handleRenameKey}
      {editable}
      containerRowClass={pgContainerRowClassOn && pgContainerRowClass ? pgContainerRowClass : undefined}
      leafRowClass={pgLeafRowClassOn && pgLeafRowClass ? pgLeafRowClass : undefined} />
</ShowcasePage>
