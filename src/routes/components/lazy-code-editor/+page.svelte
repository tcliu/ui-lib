<script lang="ts">
  import LazyCodeEditor from '$lib/components/LazyCodeEditor.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { type TriState } from '$showcase/snippet-build'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/staged'
  import { enumField, textField, boolField, snippetField } from '$showcase/snippet-field'
  import {
    DEFAULT_CONTENT,
    DEFAULT_DOC_TYPE,
    DOC_TYPE_OPTIONS,
    buildLazyCodeEditorSnippet,
    type DocType,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. The content
  // seeds from the shared default and the language field falls back to the
  // component default (`text`, which loads no pack).
  const INITIAL = {
    content: staged(DEFAULT_CONTENT, true),
    docType: staged('text'),
    editable: staged('yes' as TriState),
    containerClass: staged(''),
    editorClass: staged(''),
    maxContentLength: staged('0'),
    autoFocus: staged('no' as TriState),
    editorAriaLabel: staged(''),
    recreateKey: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires content, so the eye resets to the default document
  // instead of omitting; committing re-applies.

  const editable = $derived(appliedFlag(pg.editable))
  // The eye gates the prop, exactly like the builder: off renders the component
  // default, on falls back to the curated document type when the cell is empty.
  const demoDocType = $derived.by(() => {
    const value = applied(pg.docType)
    return value === undefined ? undefined : ((value || DEFAULT_DOC_TYPE) as DocType)
  })
  const demoContainerClass = $derived(applied(pg.containerClass) || undefined)
  const demoEditorClass = $derived(applied(pg.editorClass) || undefined)

  function asMaxLength(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
  }

  const demoMaxContentLength = $derived.by(() => {
    const value = applied(pg.maxContentLength)
    return value === undefined ? undefined : asMaxLength(value)
  })
  const demoAutoFocus = $derived(appliedFlag(pg.autoFocus))
  const demoEditorAriaLabel = $derived(applied(pg.editorAriaLabel) || undefined)
  const demoRecreateKey = $derived(applied(pg.recreateKey) || undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildLazyCodeEditorSnippet({
      docType: pg.docType,
      editable: pg.editable,
      containerClass: pg.containerClass,
      editorClass: pg.editorClass,
      maxContentLength: pg.maxContentLength,
      autoFocus: pg.autoFocus,
      editorAriaLabel: pg.editorAriaLabel,
      recreateKey: pg.recreateKey,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The document
  // itself is edited in the demo editor and rides scope, so it has no Value
  // editor; `docType` is always emitted (falling back to Markdown), so the
  // Markdown literal maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    boolField({ name: 'autoFocus', defaultValue: 'false', note: 'Focuses the editor once it mounts.', ...eyeFlag(pg.autoFocus) }),
    textField({ name: 'containerClass', type: 'string?', defaultValue: "''", note: 'Classes for the outer wrapper; give it a bounded height.', editorDefaultValue: '', clearable: true, ...eye(pg.containerClass) }),
    snippetField({
      name: 'content',
      type: 'string',
      note: 'Bindable editor document. The eye resets to the default content.',
      value: pg.content.value,
      onChange: value => stage(pg.content, value),
      dialog: { docType: 'html', title: 'Edit content' },
      toggle: eyeResetToggle(pg.content, () => (pg.content.value = DEFAULT_CONTENT)),
    }),
    enumField({ name: 'docType', type: 'string', defaultValue: "'text'", note: "Language pack key: json, javascript, html, markdown, yaml, or xml (loaded on demand). 'text' loads none.", options: DOC_TYPE_OPTIONS, placeholder: 'text', clearLabel: 'Clear document type', sync: { kind: 'text', unsetValues: ['markdown'] }, ...eye(pg.docType) }),
    boolField({ name: 'editable', defaultValue: 'true', note: 'Enables typing; false renders read-only.', ...eyeFlag(pg.editable) }),
    textField({ name: 'editorClass', type: 'string?', defaultValue: "''", note: 'Classes for the CodeMirror host; use h-full inside a sized wrapper.', editorDefaultValue: '', clearable: true, ...eye(pg.editorClass) }),
    { name: 'maxContentLength', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Caps the document length; 0 disables the cap.', editor: 'number', clearable: true, ...eye(pg.maxContentLength), onChange: value => stage(pg.maxContentLength, value), placeholder: '0', toggle: eyeToggle(pg.maxContentLength), sync: { kind: 'number', pattern: /^\d+$/ } },
    textField({ name: 'editorAriaLabel', type: 'string?', defaultValue: 'editor.content', note: 'Accessible name for the editor textbox; unset, the localized editor.content key renders.', clearable: true, ...eye(pg.editorAriaLabel) }),
    textField({ name: 'recreateKey', type: 'string?', defaultValue: "''", note: 'Changing it destroys and rebuilds the editor.', editorDefaultValue: '', clearable: true, ...eye(pg.recreateKey) }),
    { name: 'onAutoFocused', type: '() => void', defaultValue: '—', note: 'Called after an autofocus.' },
    { name: 'onContentChange', type: '(content: string) => void', defaultValue: '—', note: 'Called with the document after every edit.' },
    { name: 'onReady', type: '() => void', defaultValue: '—', note: 'Called once the EditorView exists.' },
  ])

  // The seed covers every override except the document (the snippet reads it
  // from scope), so only content edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  </script>

<ShowcasePage
    {fields}
    title="LazyCodeEditor"
    {code}
    onReset={clearPlayground}
    scope={{ content: pg.content.value }}

    sync={{ tag: 'LazyCodeEditor' }}
    scopeRefresh={() => [pg.content.value]}
  >
    <div class="h-64 w-full max-w-xl">
      <LazyCodeEditor
        bind:content={pg.content.value}
        docType={demoDocType}
        {editable}
        autoFocus={demoAutoFocus}
        editorAriaLabel={demoEditorAriaLabel}
        recreateKey={demoRecreateKey}
        containerClass={demoContainerClass}
        editorClass={demoEditorClass}
        maxContentLength={demoMaxContentLength} />
    </div>
  </ShowcasePage>
