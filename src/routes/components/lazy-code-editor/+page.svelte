<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import LazyCodeEditor from '$lib/components/LazyCodeEditor.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { textField, boolField, snippetField, resetToggle, snippetToggle } from '$lib/showcase/snippet-field'
  import {
    DEFAULT_CONTENT,
    DEFAULT_DOC_TYPE,
    DOC_TYPE_OPTIONS,
    buildLazyCodeEditorSnippet,
    type DocType,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. The content
  // seeds from the shared default and the language field falls back to the
  // component default (`text`, which loads no pack).
  const INITIAL = {
    content: DEFAULT_CONTENT,
    contentEnabled: true,
    docType: 'text',
    docTypeOn: true,
    editable: 'yes' as TriState,
    editableOn: false,
    containerClass: '',
    containerClassOn: false,
    editorClass: '',
    editorClassOn: false,
    maxContentLength: '0',
    maxContentLengthOn: false,
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

  const editable = $derived(pg.editableOn ? flagOn(pg.editable) : undefined)
  const demoDocType = $derived((pg.docTypeOn && pg.docType ? pg.docType : DEFAULT_DOC_TYPE) as DocType)
  const demoContainerClass = $derived(pg.containerClassOn && pg.containerClass ? pg.containerClass : undefined)
  const demoEditorClass = $derived(pg.editorClassOn && pg.editorClass ? pg.editorClass : undefined)

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

  const code = $derived.by(() => buildLazyCodeEditorSnippet({ docType: pg.docType, docTypeOn: pg.docTypeOn, editable: pg.editable, editableOn: pg.editableOn, containerClass: pg.containerClass, containerClassOn: pg.containerClassOn, editorClass: pg.editorClass, editorClassOn: pg.editorClassOn, maxContentLength: pg.maxContentLength, maxContentLengthOn: pg.maxContentLengthOn, autoFocus: pg.autoFocus, autoFocusOn: pg.autoFocusOn, editorAriaLabel: pg.editorAriaLabel, editorAriaLabelOn: pg.editorAriaLabelOn, recreateKey: pg.recreateKey, recreateKeyOn: pg.recreateKeyOn }))

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The document
  // itself is edited in the demo editor and rides scope, so it has no Value
  // editor; `docType` is always emitted (falling back to Markdown), so the
  // Markdown literal maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    boolField({ name: 'autoFocus', defaultValue: 'false', note: 'Focuses the editor once it mounts.', value: pg.autoFocus, onChange: v => (pg.autoFocus = v as TriState), enabled: pg.autoFocusOn, setEnabled: v => (pg.autoFocusOn = v) }),
    textField({ name: 'containerClass', type: 'string?', defaultValue: "''", note: 'Classes for the outer wrapper; give it a bounded height.', value: pg.containerClass, onChange: v => (pg.containerClass = v), editorDefaultValue: '', clearable: true, enabled: pg.containerClassOn, setEnabled: v => (pg.containerClassOn = v) }),
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
    { name: 'docType', type: 'string', defaultValue: "'text'", note: "Language pack key: json, javascript, html, markdown, yaml, or xml (loaded on demand). 'text' loads none.", editor: 'enum', options: DOC_TYPE_OPTIONS, value: pg.docType, onChange: value => { pg.docType = value; pg.docTypeOn = true; }, placeholder: 'text', clearLabel: 'Clear document type', toggle: snippetToggle(pg.docTypeOn, enabled => (pg.docTypeOn = enabled)), sync: { kind: 'text', unsetValues: ['markdown'] } },
    boolField({ name: 'editable', defaultValue: 'true', note: 'Enables typing; false renders read-only.', value: pg.editable, onChange: v => (pg.editable = v as TriState), enabled: pg.editableOn, setEnabled: v => (pg.editableOn = v) }),
    textField({ name: 'editorClass', type: 'string?', defaultValue: "''", note: 'Classes for the CodeMirror host; use h-full inside a sized wrapper.', value: pg.editorClass, onChange: v => (pg.editorClass = v), editorDefaultValue: '', clearable: true, enabled: pg.editorClassOn, setEnabled: v => (pg.editorClassOn = v) }),
    { name: 'maxContentLength', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Caps the document length; 0 disables the cap.', editor: 'number', clearable: true, value: pg.maxContentLength, onChange: value => { pg.maxContentLength = value; pg.maxContentLengthOn = true; }, placeholder: '0', toggle: snippetToggle(pg.maxContentLengthOn, enabled => (pg.maxContentLengthOn = enabled)), sync: { kind: 'number', pattern: /^\d+$/ } },
    textField({ name: 'editorAriaLabel', type: 'string?', defaultValue: 'editor.content', note: 'Accessible name for the editor textbox; unset, the localized editor.content key renders.', value: pg.editorAriaLabel, onChange: v => (pg.editorAriaLabel = v), clearable: true, enabled: pg.editorAriaLabelOn, setEnabled: v => (pg.editorAriaLabelOn = v) }),
    textField({ name: 'recreateKey', type: 'string?', defaultValue: "''", note: 'Changing it destroys and rebuilds the editor.', value: pg.recreateKey, onChange: v => (pg.recreateKey = v), editorDefaultValue: '', clearable: true, enabled: pg.recreateKeyOn, setEnabled: v => (pg.recreateKeyOn = v) }),
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
    scope={{ content: pg.content }}

    sync={{ tag: 'LazyCodeEditor' }}
    scopeRefresh={() => [pg.content]}
  >
    <div class="h-64 w-full max-w-xl">
      <LazyCodeEditor
        bind:content={pg.content}
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
