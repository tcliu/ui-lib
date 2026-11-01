<script lang="ts">
  import StructureTree from '$lib/components/StructureTree.svelte'
  import {
    DEFAULT_CONTAINER_ROW_CLASS,
    DEFAULT_LEAF_ROW_CLASS,
  } from '$lib/components/StructureNode.svelte'
  import { isContainer, renameKeyAtPath, setAtPath } from '$lib/components/structure-value'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { boolField, jsonField, sizeField } from '$showcase/playground/snippet-field'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { parseSizeValue } from '$showcase/playground/size-input'
  import { type TriState } from '$showcase/playground/snippet-build'
  import {
    buildStructureTreeSnippet,
    DEFAULT_TREE_VALUE,
    parseTreeValueJson,
    readTreeValueSeed,
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
  // The component requires a tree value, so its eye resets to the default
  // instead of omitting; committing re-applies.
  const INITIAL = {
    value: staged(freshValue() as unknown, true),
    editable: staged('yes' as TriState),
    containerRowClass: staged(''),
    leafRowClass: staged(''),
    size: staged('md'),
  }
  let pg = $state(structuredClone(INITIAL))
  // Row class overrides start unset (the built-ins render); non-empty text
  // applies live, clearing restores the built-ins. The eye stages the
  // customization without losing text. The Value column seeds from the
  // built-ins below.

  const editable = $derived(appliedFlag(pg.editable))
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })

  function handleNodeChange(path: string[], next: unknown): void {
    if (!isContainer(pg.value.value)) return
    pg.value.value = setAtPath(pg.value.value, path, next)
  }

  function handleRenameKey(parentPath: string[], oldKey: string, newKey: string): void {
    if (!isContainer(pg.value.value)) return
    pg.value.value = renameKeyAtPath(pg.value.value, parentPath, oldKey, newKey)
  }

  function commitValueDraft(draft: string): void {
    const parsed = parseTreeValueJson(draft)
    if (parsed !== undefined) pg.value.value = parsed
  }

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildStructureTreeSnippet({
      value: pg.value,
      editable: pg.editable,
      containerRowClass: pg.containerRowClass,
      leafRowClass: pg.leafRowClass,
      size: pg.size,
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
      ...eye(pg.containerRowClass),
      // The Value shows the built-ins until the override is set, so the eye
      // gates the raw committed text while this cell resolves the fallback.
      value: pg.containerRowClass.value || DEFAULT_CONTAINER_ROW_CLASS,
      onChange: value => stage(pg.containerRowClass, value === DEFAULT_CONTAINER_ROW_CLASS ? '' : value),
      toggle: eyeToggle(pg.containerRowClass),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          // Absent resolves to the current Value text so seed edits elsewhere
          // never reset committed text.
          if (!attrs.has('containerRowClass')) return pg.containerRowClass.value || DEFAULT_CONTAINER_ROW_CLASS
          const attr = attrs.get('containerRowClass')!
          return attr.kind === 'string' ? attr.value : undefined
        },
        set: value => {
          pg.containerRowClass.value = value === DEFAULT_CONTAINER_ROW_CLASS ? '' : value
        },
      },
    },
    boolField({ name: 'editable', defaultValue: 'true', note: 'Gates leaf editing and key renames; the callbacks stay wired either way.', ...eyeFlag(pg.editable) }),
    {
      name: 'leafRowClass',
      type: 'string?',
      defaultValue: 'built-in',
      note: 'Replaces the tunable leaf row classes; the Value shows the built-ins, edit from there. Clearing restores the built-ins.',
      editor: 'text',
      clearable: true,
      ...eye(pg.leafRowClass),
      // The Value shows the built-ins until the override is set, so the eye
      // gates the raw committed text while this cell resolves the fallback.
      value: pg.leafRowClass.value || DEFAULT_LEAF_ROW_CLASS,
      onChange: value => stage(pg.leafRowClass, value === DEFAULT_LEAF_ROW_CLASS ? '' : value),
      toggle: eyeToggle(pg.leafRowClass),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          if (!attrs.has('leafRowClass')) return pg.leafRowClass.value || DEFAULT_LEAF_ROW_CLASS
          const attr = attrs.get('leafRowClass')!
          return attr.kind === 'string' ? attr.value : undefined
        },
        set: value => {
          pg.leafRowClass.value = value === DEFAULT_LEAF_ROW_CLASS ? '' : value
        },
      },
    },
    sizeField({ note: 'Control scale; the tree text and its edit/copy controls follow it.', ...eye(pg.size) }),
    jsonField({
      name: 'value',
      type: 'unknown',
      note: 'Tree data; any JSON document renders as nested nodes. The eye resets to the default tree.',
      value: JSON.stringify(pg.value.value, null, 2) ?? 'null',
      onChange: (draft: string) => {
        const parsed = parseTreeValueJson(draft)
        if (parsed !== undefined) stage(pg.value, parsed)
      },
      dialog: { valid: (draft: string) => parseTreeValueJson(draft) !== undefined, invalidMessage: 'Invalid value JSON. Use any JSON document.', title: 'Edit value' },
      toggle: eyeResetToggle(pg.value, () => (pg.value.value = freshValue())),
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
      value={pg.value.value}
      onChange={handleNodeChange}
      onRenameKey={handleRenameKey}
      {editable}
      size={demoSize}
      containerRowClass={applied(pg.containerRowClass) || undefined}
      leafRowClass={applied(pg.leafRowClass) || undefined} />
</ShowcasePage>
