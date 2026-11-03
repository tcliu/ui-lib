<script lang="ts">
  import CodeEditor from '#lib/components/CodeEditor.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { textField, boolField, enumField, snippetField } from '#showcase/playground/snippet-field.js'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import {
    DEFAULT_CONTENT,
    DEFAULT_DOC_TYPE,
    DOC_TYPE_OPTIONS,
    buildCodeEditorSnippet,
    type DocType,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. The content
  // seeds from the shared default and the eye-gated classes stage their
  // defaults while off.
  const INITIAL = {
    content: staged(DEFAULT_CONTENT, true),
    docType: staged('text'),
    editable: staged('yes' as TriState),
    theme: staged('dark'),
    containerClass: staged('h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950'),
    editorClass: staged('h-full'),
    maxContentLength: staged('0'),
    selectionEnabled: staged('yes' as TriState),
    autoFocus: staged('no' as TriState),
    editorAriaLabel: staged(''),
    recreateKey: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires content, so the eye resets to the default document
  // instead of omitting; committing re-applies.

  const themeOptions = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ]

  const editable = $derived(appliedFlag(pg.editable))
  // The eye gates the prop, exactly like the builder: off renders the component
  // default, on falls back to the curated document type when the cell is empty.
  const demoDocType = $derived.by(() => {
    const value = applied(pg.docType)
    return value === undefined ? undefined : ((value || DEFAULT_DOC_TYPE) as DocType)
  })
  const demoTheme = $derived(applied(pg.theme) || undefined)
  const demoContainerClass = $derived(applied(pg.containerClass) || undefined)
  const demoEditorClass = $derived(applied(pg.editorClass) || undefined)
  const selectionEnabled = $derived(appliedFlag(pg.selectionEnabled))

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

  const code = $derived.by(() => buildCodeEditorSnippet({ docType: pg.docType, editable: pg.editable, theme: pg.theme, containerClass: pg.containerClass, editorClass: pg.editorClass, maxContentLength: pg.maxContentLength, selectionEnabled: pg.selectionEnabled, autoFocus: pg.autoFocus, editorAriaLabel: pg.editorAriaLabel, recreateKey: pg.recreateKey }))

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The document
  // itself is edited in the demo editor and rides scope, so it has no Value
  // editor; `docType` is always emitted (falling back to JSON), so the JSON
  // literal maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    boolField({ name: 'autoFocus', defaultValue: 'false', note: 'Focuses the editor once it mounts.', ...eyeFlag(pg.autoFocus) }),
    textField({ name: 'containerClass', type: 'string?', defaultValue: "'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950'", note: 'Classes for the outer wrapper; the default renders the framed editor box (override for a light theme).', editorDefaultValue: 'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950', clearable: true, placeholder: 'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950', ...eye(pg.containerClass) }),
    snippetField({
      name: 'content',
      type: 'string',
      note: 'Bindable editor document. The eye resets to the default content.',
      value: pg.content.value,
      onChange: value => stage(pg.content, value),
      dialog: { docType: 'html', title: 'Edit content' },
      toggle: eyeResetToggle(pg.content, () => (pg.content.value = DEFAULT_CONTENT)),
    }),
    { name: 'docType', type: 'string?', defaultValue: "'text'", note: "Language pack key: json, javascript, html, markdown, yaml, or xml (loaded on demand). 'text' loads none.", editor: 'enum', options: DOC_TYPE_OPTIONS, ...eye(pg.docType), onChange: value => stage(pg.docType, value), placeholder: 'text', clearLabel: 'Clear document type', toggle: eyeToggle(pg.docType), sync: { kind: 'text', unsetValues: ['json'] } },
    boolField({ name: 'editable', defaultValue: 'true', note: 'Enables typing; false renders read-only.', ...eyeFlag(pg.editable) }),
    textField({ name: 'editorAriaLabel', type: 'string?', defaultValue: "'Content'", note: 'Accessible name for the editor textbox.', clearable: true, placeholder: 'Content', ...eye(pg.editorAriaLabel) }),
    textField({ name: 'editorClass', type: 'string?', defaultValue: "'h-full'", note: 'Classes for the CodeMirror host; it fills the wrapper by default.', editorDefaultValue: 'h-full', clearable: true, placeholder: 'h-full', ...eye(pg.editorClass) }),
    { name: 'maxContentLength', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Caps the document length; 0 disables the cap.', editor: 'number', clearable: true, ...eye(pg.maxContentLength), onChange: value => stage(pg.maxContentLength, value), placeholder: '0', toggle: eyeToggle(pg.maxContentLength), sync: { kind: 'number', pattern: /^\d+$/ } },
    textField({ name: 'recreateKey', type: 'string?', defaultValue: "''", note: 'Changing it destroys and rebuilds the editor.', editorDefaultValue: '', clearable: true, ...eye(pg.recreateKey) }),
    boolField({ name: 'selectionEnabled', defaultValue: 'true', note: 'Allows text selection and copy.', ...eyeFlag(pg.selectionEnabled) }),
    enumField({ name: 'theme', type: 'string?', defaultValue: "'dark'", note: "'dark' uses githubDark, any other value githubLight.", options: themeOptions, placeholder: 'dark', clearLabel: 'Clear theme', ...eye(pg.theme) }),
    { name: 'onAutoFocused', type: '() => void', defaultValue: '—', note: 'Called after an autofocus.' },
    { name: 'onContentChange', type: '(content: string) => void', defaultValue: '—', note: 'Called with the document after every edit.' },
    { name: 'onReady', type: '() => void', defaultValue: '—', note: 'Called once the EditorView exists.' },
    { name: 'onSelectionChange', type: '(range: { from; to } | null) => void', defaultValue: '—', note: 'Called with the selection range, or null when collapsed.' },
  ])

  // The seed covers every override except the document (the snippet reads it
  // from scope), so only content edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  </script>

<ShowcasePage
    {fields}
    title="CodeEditor"
    {code}
    onReset={clearPlayground}
    scope={{ content: pg.content.value }}

    sync={{ tag: 'CodeEditor' }}
    scopeRefresh={() => [pg.content.value]}
  >
    <div class="h-64 w-full max-w-xl">
      <CodeEditor
        bind:content={pg.content.value}
        docType={demoDocType}
        {editable}
        autoFocus={demoAutoFocus}
        editorAriaLabel={demoEditorAriaLabel}
        recreateKey={demoRecreateKey}
        theme={demoTheme}
        containerClass={demoContainerClass}
        editorClass={demoEditorClass}
        maxContentLength={demoMaxContentLength}
        {selectionEnabled} />
    </div>
  </ShowcasePage>
