<script lang="ts">
  import { flagOn } from '$showcase/snippet-build'
  import StructureTree from '$lib/components/StructureTree.svelte'
  import {
    DEFAULT_CONTAINER_ROW_CLASS,
    DEFAULT_LEAF_ROW_CLASS,
  } from '$lib/components/StructureNode.svelte'
  import { isContainer, renameKeyAtPath, setAtPath } from '$lib/components/structure-value'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { boolField, jsonField, resetToggle, sizeField, snippetToggle } from '$showcase/snippet-field'
  import { parseSizeValue } from '$showcase/size-input'
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
  const INITIAL = {
    value: freshValue() as unknown,
    valueEnabled: true,
    editable: 'yes' as TriState,
    editableOn: false,
    containerRowClass: '',
    containerRowClassOn: false,
    leafRowClass: '',
    leafRowClassOn: false,
    size: 'md',
    sizeOn: false,
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires a tree value, so the eye resets to the default
  // instead of omitting; committing re-applies.
  // Row class overrides start unset (the built-ins render); non-empty text
  // applies live, clearing restores the built-ins. The eye stages the
  // customization without losing text. The Value column seeds from the
  // built-ins below.

  const editable = $derived(pg.editableOn ? flagOn(pg.editable) : undefined)
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)

  function handleNodeChange(path: string[], next: unknown): void {
    if (!isContainer(pg.value)) return
    pg.value = setAtPath(pg.value, path, next)
  }

  function handleRenameKey(parentPath: string[], oldKey: string, newKey: string): void {
    if (!isContainer(pg.value)) return
    pg.value = renameKeyAtPath(pg.value, parentPath, oldKey, newKey)
  }

  function commitValueDraft(draft: string): void {
    const parsed = parseTreeValueJson(draft)
    if (parsed !== undefined) pg.value = parsed
  }

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildStructureTreeSnippet({
      value: pg.value,
      editable: pg.editable,
      editableOn: pg.editableOn,
      containerRowClass: pg.containerRowClass,
      containerRowClassOn: pg.containerRowClassOn,
      leafRowClass: pg.leafRowClass,
      leafRowClassOn: pg.leafRowClassOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
    }),
  )

  
  // Editable rows first (A–Z), then the function props (A–Z). The value row
  // round-trips through the JSON dialog (any JSON document renders); the
  // callbacks stay read-only rows.
  const fields: SyncableFieldConfig[] = $derived([
    {
      name: 'containerRowClass',
      type: 'string?',
      defaultValue: 'built-in',
      note: 'Replaces the tunable container header row classes; the Value shows the built-ins, edit from there. Clearing restores the built-ins.',
      editor: 'text',
      clearable: true,
      value: pg.containerRowClass || DEFAULT_CONTAINER_ROW_CLASS,
      onChange: value => {
        pg.containerRowClass = value === DEFAULT_CONTAINER_ROW_CLASS ? '' : value
        pg.containerRowClassOn = true
      },
      toggle: snippetToggle(pg.containerRowClassOn, enabled => (pg.containerRowClassOn = enabled)),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          // Absent resolves to the current Value text so seed edits elsewhere
          // never reset committed text.
          if (!attrs.has('containerRowClass')) return pg.containerRowClass || DEFAULT_CONTAINER_ROW_CLASS
          const attr = attrs.get('containerRowClass')!
          return attr.kind === 'string' ? attr.value : undefined
        },
        set: value => {
          pg.containerRowClass = value === DEFAULT_CONTAINER_ROW_CLASS ? '' : value
        },
      },
    },
    boolField({ name: 'editable', defaultValue: 'true', note: 'Gates leaf editing and key renames; the callbacks stay wired either way.', value: pg.editable, onChange: v => (pg.editable = v as TriState), enabled: pg.editableOn, setEnabled: v => (pg.editableOn = v) }),
    {
      name: 'leafRowClass',
      type: 'string?',
      defaultValue: 'built-in',
      note: 'Replaces the tunable leaf row classes; the Value shows the built-ins, edit from there. Clearing restores the built-ins.',
      editor: 'text',
      clearable: true,
      value: pg.leafRowClass || DEFAULT_LEAF_ROW_CLASS,
      onChange: value => {
        pg.leafRowClass = value === DEFAULT_LEAF_ROW_CLASS ? '' : value
        pg.leafRowClassOn = true
      },
      toggle: snippetToggle(pg.leafRowClassOn, enabled => (pg.leafRowClassOn = enabled)),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          if (!attrs.has('leafRowClass')) return pg.leafRowClass || DEFAULT_LEAF_ROW_CLASS
          const attr = attrs.get('leafRowClass')!
          return attr.kind === 'string' ? attr.value : undefined
        },
        set: value => {
          pg.leafRowClass = value === DEFAULT_LEAF_ROW_CLASS ? '' : value
        },
      },
    },
    sizeField({ note: 'Control scale; the tree text and its edit/copy controls follow it.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    jsonField({
      name: 'value',
      type: 'unknown',
      note: 'Tree data; any JSON document renders as nested nodes. The eye resets to the default tree.',
      value: JSON.stringify(pg.value, null, 2) ?? 'null',
      onChange: (draft: string) => {
        commitValueDraft(draft)
        if (parseTreeValueJson(draft) !== undefined) pg.valueEnabled = true
      },
      dialog: { valid: (draft: string) => parseTreeValueJson(draft) !== undefined, invalidMessage: 'Invalid value JSON. Use any JSON document.', title: 'Edit value' },
      toggle: resetToggle(
        pg.valueEnabled,
        enabled => (pg.valueEnabled = enabled),
        () => (pg.value = freshValue()),
      ),
      sync: { kind: 'custom', read: (_attrs, declarations) => readTreeValueSeed(declarations), set: commitValueDraft },
    }),
    { name: 'onChange', type: '(path: string[], newValue: unknown) => void', defaultValue: '—', note: 'Called with the path and the parsed replacement when a leaf edit commits.' },
    { name: 'onRenameKey', type: '(parentPath: string[], oldKey: string, newKey: string) => void', defaultValue: '—', note: 'Called with the parent path and key pair when a key rename commits.' },
  ])

</script>

<ShowcasePage
    {fields}
    title="StructureTree"
    {code}
    onReset={clearPlayground}

    sync={{ tag: 'StructureTree' }}
    scope={{}}
  >
    <StructureTree
      value={pg.value}
      onChange={handleNodeChange}
      onRenameKey={handleRenameKey}
      {editable}
      size={demoSize}
      containerRowClass={pg.containerRowClassOn && pg.containerRowClass ? pg.containerRowClass : undefined}
      leafRowClass={pg.leafRowClassOn && pg.leafRowClass ? pg.leafRowClass : undefined} />
</ShowcasePage>
