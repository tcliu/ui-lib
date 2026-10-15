<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import CodeEditor from '$lib/components/CodeEditor.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { textField, boolField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
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
  let pgContent = $state(DEFAULT_CONTENT)
  // The component requires content, so the eye resets to the default document
  // instead of omitting; committing re-applies.
  let pgContentEnabled = $state(true)
  let pgDocType = $state('text')
  let pgDocTypeOn = $state(true)
  let pgEditable = $state<TriState>('yes')
  let pgEditableOn = $state(true)
  let pgTheme = $state('dark')
  let pgThemeOn = $state(false)
  let pgContainerClass = $state('h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950')
  let pgContainerClassOn = $state(false)
  let pgEditorClass = $state('h-full')
  let pgEditorClassOn = $state(false)
  let pgMaxContentLength = $state('0')
  let pgMaxContentLengthOn = $state(false)
  let pgSelectionEnabled = $state<TriState>('yes')
  let pgSelectionEnabledOn = $state(true)
  let pgAutoFocus = $state<TriState>('no')
  let pgAutoFocusOn = $state(false)
  let pgEditorAriaLabel = $state('')
  let pgEditorAriaLabelOn = $state(false)
  let pgRecreateKey = $state('')
  let pgRecreateKeyOn = $state(false)

  const themeOptions = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ]

  const editable = $derived(pgEditableOn ? flagOn(pgEditable) : undefined)
  const demoDocType = $derived((pgDocTypeOn && pgDocType ? pgDocType : DEFAULT_DOC_TYPE) as DocType)
  const demoTheme = $derived(pgThemeOn ? pgTheme || undefined : undefined)
  const demoContainerClass = $derived(pgContainerClassOn && pgContainerClass ? pgContainerClass : undefined)
  const demoEditorClass = $derived(pgEditorClassOn && pgEditorClass ? pgEditorClass : undefined)
  const selectionEnabled = $derived(pgSelectionEnabledOn ? flagOn(pgSelectionEnabled) : undefined)

  function asMaxLength(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
  }

  const demoMaxContentLength = $derived(pgMaxContentLengthOn ? asMaxLength(pgMaxContentLength) : undefined)
  const demoAutoFocus = $derived(pgAutoFocusOn ? flagOn(pgAutoFocus) : undefined)
  const demoEditorAriaLabel = $derived(pgEditorAriaLabelOn && pgEditorAriaLabel ? pgEditorAriaLabel : undefined)
  const demoRecreateKey = $derived(pgRecreateKeyOn && pgRecreateKey ? pgRecreateKey : undefined)

  function clearPlayground() {
    pgContent = DEFAULT_CONTENT
    pgContentEnabled = true
    pgDocType = 'text'
    pgDocTypeOn = true
    pgEditable = 'yes'
    pgEditableOn = true
    pgTheme = 'dark'
    pgThemeOn = false
    pgContainerClass = 'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950'
    pgContainerClassOn = false
    pgEditorClass = 'h-full'
    pgEditorClassOn = false
    pgMaxContentLength = '0'
    pgMaxContentLengthOn = false
    pgSelectionEnabled = 'yes'
    pgSelectionEnabledOn = true
    pgAutoFocus = 'no'
    pgAutoFocusOn = false
    pgEditorAriaLabel = ''
    pgEditorAriaLabelOn = false
    pgRecreateKey = ''
    pgRecreateKeyOn = false
  }

  const code = $derived.by(() => buildCodeEditorSnippet({ docType: pgDocType, docTypeOn: pgDocTypeOn, editable: pgEditable, editableOn: pgEditableOn, theme: pgTheme, themeOn: pgThemeOn, containerClass: pgContainerClass, containerClassOn: pgContainerClassOn, editorClass: pgEditorClass, editorClassOn: pgEditorClassOn, maxContentLength: pgMaxContentLength, maxContentLengthOn: pgMaxContentLengthOn, selectionEnabled: pgSelectionEnabled, selectionEnabledOn: pgSelectionEnabledOn, autoFocus: pgAutoFocus, autoFocusOn: pgAutoFocusOn, editorAriaLabel: pgEditorAriaLabel, editorAriaLabelOn: pgEditorAriaLabelOn, recreateKey: pgRecreateKey, recreateKeyOn: pgRecreateKeyOn }))

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The document
  // itself is edited in the demo editor and rides scope, so it has no Value
  // editor; `docType` is always emitted (falling back to JSON), so the JSON
  // literal maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    boolField({ name: 'autoFocus', defaultValue: 'false', note: 'Focuses the editor once it mounts.', value: pgAutoFocus, onChange: v => (pgAutoFocus = v as TriState), enabled: pgAutoFocusOn, setEnabled: v => (pgAutoFocusOn = v) }),
    textField({ name: 'containerClass', type: 'string?', defaultValue: "'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950'", note: 'Classes for the outer wrapper; the default renders the framed editor box (override for a light theme).', value: pgContainerClass, onChange: v => (pgContainerClass = v), editorDefaultValue: 'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950', clearable: true, placeholder: 'h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950', enabled: pgContainerClassOn, setEnabled: v => (pgContainerClassOn = v) }),
    { name: 'content', type: 'string', defaultValue: '—', note: 'Bindable editor document. The eye resets to the default content.', editor: 'snippet', value: pgContent, onChange: value => {
      pgContent = value
      pgContentEnabled = true
    }, dialog: { docType: 'html', title: 'Edit content' }, toggle: resetToggle(
      pgContentEnabled,
      enabled => (pgContentEnabled = enabled),
      () => (pgContent = DEFAULT_CONTENT),
    ) },
    { name: 'docType', type: 'string', defaultValue: "'text'", note: "Language pack key: json, javascript, html, markdown, yaml, or xml (loaded on demand). 'text' loads none.", editor: 'enum', options: DOC_TYPE_OPTIONS, value: pgDocType, onChange: value => { pgDocType = value; pgDocTypeOn = true; }, placeholder: 'text', clearLabel: 'Clear document type', toggle: snippetToggle(pgDocTypeOn, enabled => (pgDocTypeOn = enabled)), sync: { kind: 'text', unsetValues: ['json'] } },
    boolField({ name: 'editable', defaultValue: 'true', note: 'Enables typing; false renders read-only.', value: pgEditable, onChange: v => (pgEditable = v as TriState), enabled: pgEditableOn, setEnabled: v => (pgEditableOn = v) }),
    textField({ name: 'editorAriaLabel', type: 'string?', defaultValue: "'Content'", note: 'Accessible name for the editor textbox.', value: pgEditorAriaLabel, onChange: v => (pgEditorAriaLabel = v), clearable: true, placeholder: 'Content', enabled: pgEditorAriaLabelOn, setEnabled: v => (pgEditorAriaLabelOn = v) }),
    textField({ name: 'editorClass', type: 'string?', defaultValue: "'h-full'", note: 'Classes for the CodeMirror host; it fills the wrapper by default.', value: pgEditorClass, onChange: v => (pgEditorClass = v), editorDefaultValue: 'h-full', clearable: true, placeholder: 'h-full', enabled: pgEditorClassOn, setEnabled: v => (pgEditorClassOn = v) }),
    { name: 'maxContentLength', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Caps the document length; 0 disables the cap.', editor: 'number', clearable: true, value: pgMaxContentLength, onChange: value => { pgMaxContentLength = value; pgMaxContentLengthOn = true; }, placeholder: '0', toggle: snippetToggle(pgMaxContentLengthOn, enabled => (pgMaxContentLengthOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    textField({ name: 'recreateKey', type: 'string?', defaultValue: "''", note: 'Changing it destroys and rebuilds the editor.', value: pgRecreateKey, onChange: v => (pgRecreateKey = v), editorDefaultValue: '', clearable: true, enabled: pgRecreateKeyOn, setEnabled: v => (pgRecreateKeyOn = v) }),
    boolField({ name: 'selectionEnabled', defaultValue: 'true', note: 'Allows text selection and copy.', value: pgSelectionEnabled, onChange: v => (pgSelectionEnabled = v as TriState), enabled: pgSelectionEnabledOn, setEnabled: v => (pgSelectionEnabledOn = v) }),
    { name: 'theme', type: 'string', defaultValue: "'dark'", note: "'dark' uses githubDark, any other value githubLight.", editor: 'enum', options: themeOptions, value: pgTheme, onChange: value => { pgTheme = value; pgThemeOn = true; }, placeholder: 'dark', clearLabel: 'Clear theme', toggle: snippetToggle(pgThemeOn, enabled => (pgThemeOn = enabled)), sync: { kind: 'text' } },
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
    scope={{ content: pgContent }}

    sync={{ tag: 'CodeEditor' }}
    scopeRefresh={() => [pgContent]}
  >
    <div class="h-64 w-full max-w-xl">
      <CodeEditor
        bind:content={pgContent}
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
