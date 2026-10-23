<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import CodeEditor from '$lib/components/CodeEditor.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { textField, boolField, enumField, snippetField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import {
    DEFAULT_CONTENT,
    DEFAULT_DOC_TYPE,
    DOC_TYPE_OPTIONS,
    buildCodeEditorSnippet,
    type DocType,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. The content
  // seeds from the shared default and the eye-gated classes stage their
  // defaults while off.
  const INITIAL = {
    content: DEFAULT_CONTENT,
    contentEnabled: true,
    docType: 'text',
    docTypeOn: true,
    editable: 'yes' as TriState,
    editableOn: false,
    theme: 'dark',
    themeOn: false,
    containerClass: 'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950',
    containerClassOn: false,
    editorClass: 'h-full',
    editorClassOn: false,
    maxContentLength: '0',
    maxContentLengthOn: false,
    selectionEnabled: 'yes' as TriState,
    selectionEnabledOn: false,
    autoFocus: 'no' as TriState,
    autoFocusOn: false,
    editorAriaLabel: '',
    editorAriaLabelOn: false,
    recreateKey: '',
    recreateKeyOn: false,
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires content, so the eye resets to the default document
  // instead of omitting; committing re-applies.

  const themeOptions = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ]

  const editable = $derived(pg.editableOn ? flagOn(pg.editable) : undefined)
  const demoDocType = $derived((pg.docTypeOn && pg.docType ? pg.docType : DEFAULT_DOC_TYPE) as DocType)
  const demoTheme = $derived(pg.themeOn ? pg.theme || undefined : undefined)
  const demoContainerClass = $derived(pg.containerClassOn && pg.containerClass ? pg.containerClass : undefined)
  const demoEditorClass = $derived(pg.editorClassOn && pg.editorClass ? pg.editorClass : undefined)
  const selectionEnabled = $derived(pg.selectionEnabledOn ? flagOn(pg.selectionEnabled) : undefined)

  function asMaxLength(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
  }

  const demoMaxContentLength = $derived(pg.maxContentLengthOn ? asMaxLength(pg.maxContentLength) : undefined)
  const demoAutoFocus = $derived(pg.autoFocusOn ? flagOn(pg.autoFocus) : undefined)
  const demoEditorAriaLabel = $derived(pg.editorAriaLabelOn && pg.editorAriaLabel ? pg.editorAriaLabel : undefined)
  const demoRecreateKey = $derived(pg.recreateKeyOn && pg.recreateKey ? pg.recreateKey : undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() => buildCodeEditorSnippet({ docType: pg.docType, docTypeOn: pg.docTypeOn, editable: pg.editable, editableOn: pg.editableOn, theme: pg.theme, themeOn: pg.themeOn, containerClass: pg.containerClass, containerClassOn: pg.containerClassOn, editorClass: pg.editorClass, editorClassOn: pg.editorClassOn, maxContentLength: pg.maxContentLength, maxContentLengthOn: pg.maxContentLengthOn, selectionEnabled: pg.selectionEnabled, selectionEnabledOn: pg.selectionEnabledOn, autoFocus: pg.autoFocus, autoFocusOn: pg.autoFocusOn, editorAriaLabel: pg.editorAriaLabel, editorAriaLabelOn: pg.editorAriaLabelOn, recreateKey: pg.recreateKey, recreateKeyOn: pg.recreateKeyOn }))

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The document
  // itself is edited in the demo editor and rides scope, so it has no Value
  // editor; `docType` is always emitted (falling back to JSON), so the JSON
  // literal maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    boolField({ name: 'autoFocus', defaultValue: 'false', note: 'Focuses the editor once it mounts.', value: pg.autoFocus, onChange: v => (pg.autoFocus = v as TriState), enabled: pg.autoFocusOn, setEnabled: v => (pg.autoFocusOn = v) }),
    textField({ name: 'containerClass', type: 'string?', defaultValue: "'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950'", note: 'Classes for the outer wrapper; the default renders the framed editor box (override for a light theme).', value: pg.containerClass, onChange: v => (pg.containerClass = v), editorDefaultValue: 'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950', clearable: true, placeholder: 'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950', enabled: pg.containerClassOn, setEnabled: v => (pg.containerClassOn = v) }),
    snippetField({
      name: 'content',
      type: 'string',
      note: 'Bindable editor document. The eye resets to the default content.',
      value: pg.content,
      onChange: value => {
        pg.content = value
        pg.contentEnabled = true
      },
      dialog: { docType: 'html', title: 'Edit content' },
      toggle: resetToggle(
        pg.contentEnabled,
        enabled => (pg.contentEnabled = enabled),
        () => (pg.content = DEFAULT_CONTENT),
      ),
    }),
    { name: 'docType', type: 'string?', defaultValue: "'text'", note: "Language pack key: json, javascript, html, markdown, yaml, or xml (loaded on demand). 'text' loads none.", editor: 'enum', options: DOC_TYPE_OPTIONS, value: pg.docType, onChange: value => { pg.docType = value; pg.docTypeOn = true; }, placeholder: 'text', clearLabel: 'Clear document type', toggle: snippetToggle(pg.docTypeOn, enabled => (pg.docTypeOn = enabled)), sync: { kind: 'text', unsetValues: ['json'] } },
    boolField({ name: 'editable', defaultValue: 'true', note: 'Enables typing; false renders read-only.', value: pg.editable, onChange: v => (pg.editable = v as TriState), enabled: pg.editableOn, setEnabled: v => (pg.editableOn = v) }),
    textField({ name: 'editorAriaLabel', type: 'string?', defaultValue: "'Content'", note: 'Accessible name for the editor textbox.', value: pg.editorAriaLabel, onChange: v => (pg.editorAriaLabel = v), clearable: true, placeholder: 'Content', enabled: pg.editorAriaLabelOn, setEnabled: v => (pg.editorAriaLabelOn = v) }),
    textField({ name: 'editorClass', type: 'string?', defaultValue: "'h-full'", note: 'Classes for the CodeMirror host; it fills the wrapper by default.', value: pg.editorClass, onChange: v => (pg.editorClass = v), editorDefaultValue: 'h-full', clearable: true, placeholder: 'h-full', enabled: pg.editorClassOn, setEnabled: v => (pg.editorClassOn = v) }),
    { name: 'maxContentLength', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Caps the document length; 0 disables the cap.', editor: 'number', clearable: true, value: pg.maxContentLength, onChange: value => { pg.maxContentLength = value; pg.maxContentLengthOn = true; }, placeholder: '0', toggle: snippetToggle(pg.maxContentLengthOn, enabled => (pg.maxContentLengthOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    textField({ name: 'recreateKey', type: 'string?', defaultValue: "''", note: 'Changing it destroys and rebuilds the editor.', value: pg.recreateKey, onChange: v => (pg.recreateKey = v), editorDefaultValue: '', clearable: true, enabled: pg.recreateKeyOn, setEnabled: v => (pg.recreateKeyOn = v) }),
    boolField({ name: 'selectionEnabled', defaultValue: 'true', note: 'Allows text selection and copy.', value: pg.selectionEnabled, onChange: v => (pg.selectionEnabled = v as TriState), enabled: pg.selectionEnabledOn, setEnabled: v => (pg.selectionEnabledOn = v) }),
    enumField({ name: 'theme', type: 'string?', defaultValue: "'dark'", note: "'dark' uses githubDark, any other value githubLight.", options: themeOptions, value: pg.theme, onChange: v => (pg.theme = v), placeholder: 'dark', clearLabel: 'Clear theme', enabled: pg.themeOn, setEnabled: v => (pg.themeOn = v) }),
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
    scope={{ content: pg.content }}

    sync={{ tag: 'CodeEditor' }}
    scopeRefresh={() => [pg.content]}
  >
    <div class="h-64 w-full max-w-xl">
      <CodeEditor
        bind:content={pg.content}
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
