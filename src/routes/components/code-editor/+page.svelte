<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import CodeEditor from '$lib/components/CodeEditor.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import {
    DEFAULT_CONTENT,
    DEFAULT_DOC_TYPE,
    DOC_TYPE_OPTIONS,
    buildCodeEditorSnippet,
    type DocType,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset, so the
  // cleared form applies no overrides beyond the demo baseline: the content
  // seeds from the shared default and the language field falls back to JSON.
  let pgContent = $state(DEFAULT_CONTENT)
  let pgDocType = $state('')
  let pgEditable = $state<TriState>('')
  let pgTheme = $state('')

  const themeOptions = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ]

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const editable = $derived(flagOn(pgEditable))
  const demoDocType = $derived((pgDocType || DEFAULT_DOC_TYPE) as DocType)
  const demoTheme = $derived(pgTheme || undefined)

  function docTypeLabel(value: string): string {
    return DOC_TYPE_OPTIONS.find(option => option.value === value)?.label ?? 'JSON'
  }

  function themeLabel(value: string): string {
    return value === 'light' ? 'Light' : 'Dark'
  }

  const isCustomized = $derived(pgDocType !== '' || pgEditable !== '' || pgTheme !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgContent = DEFAULT_CONTENT
    pgDocType = ''
    pgEditable = ''
    pgTheme = ''
  }

  const code = $derived.by(() => buildCodeEditorSnippet({ docType: pgDocType, editable: pgEditable, theme: pgTheme }))

  const props: PropRow[] = [
    { name: 'content', type: 'string', defaultValue: '—', note: 'Bindable editor document.' },
    { name: 'editable', type: 'boolean', defaultValue: 'true', note: 'Enables typing; false renders read-only.' },
    {
      name: 'docType',
      type: 'string',
      defaultValue: "'text'",
      note: "Language pack key: json, javascript, html, markdown, yaml, or xml (loaded on demand). 'text' loads none.",
    },
    { name: 'selectionEnabled', type: 'boolean', defaultValue: 'true', note: 'Allows text selection and copy.' },
    {
      name: 'theme',
      type: 'string',
      defaultValue: "'dark'",
      note: "'dark' uses githubDark, any other value githubLight.",
    },
    {
      name: 'containerClass',
      type: 'string',
      defaultValue: "''",
      note: 'Classes for the outer wrapper; give it a bounded height.',
    },
    {
      name: 'editorClass',
      type: 'string',
      defaultValue: "''",
      note: 'Classes for the CodeMirror host; use h-full inside a sized wrapper.',
    },
    {
      name: 'editorAriaLabel',
      type: 'string',
      defaultValue: "'Content'",
      note: 'Accessible name for the editor textbox.',
    },
    { name: 'autoFocus', type: 'boolean', defaultValue: 'false', note: 'Focuses the editor once it mounts.' },
    { name: 'recreateKey', type: 'string', defaultValue: "''", note: 'Changing it destroys and rebuilds the editor.' },
    {
      name: 'maxContentLength',
      type: 'number',
      defaultValue: '0',
      note: 'Caps the document length; 0 disables the cap.',
    },
    { name: 'onReady', type: '() => void', defaultValue: '—', note: 'Called once the EditorView exists.' },
    { name: 'onAutoFocused', type: '() => void', defaultValue: '—', note: 'Called after an autofocus.' },
    {
      name: 'onContentChange',
      type: '(content: string) => void',
      defaultValue: '—',
      note: 'Called with the document after every edit.',
    },
    {
      name: 'onSelectionChange',
      type: '(range: { from; to } | null) => void',
      defaultValue: '—',
      note: 'Called with the selection range, or null when collapsed.',
    },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon className="h-4 w-4" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Document type">
      <SelectDropdown
        buttonLabel={docTypeLabel(pgDocType)}
        activeValue={pgDocType}
        ariaLabel="Document type"
        options={DOC_TYPE_OPTIONS}
        onSelect={value => (pgDocType = value)}
        clearable
        clearLabel="Clear document type"
        onClear={() => (pgDocType = '')} />
    </FormField>
    <FormField label="Editable">
      <SelectDropdown
        buttonLabel={pgEditable === '' ? 'Default' : pgEditable === 'yes' ? 'Yes' : 'No'}
        activeValue={pgEditable}
        ariaLabel="Editable"
        options={[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]}
        onSelect={value => (pgEditable = value as TriState)}
        clearable
        clearLabel="Clear editable"
        onClear={() => (pgEditable = '')} />
    </FormField>
    <FormField label="Theme">
      <SelectDropdown
        buttonLabel={themeLabel(pgTheme)}
        activeValue={pgTheme}
        ariaLabel="Theme"
        options={themeOptions}
        onSelect={value => (pgTheme = value)}
        clearable
        clearLabel="Clear theme"
        onClear={() => (pgTheme = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="CodeEditor" props={propsSnippet}>
  <ShowcaseSection title={sectionTitle} {code} footer={settingsPanel} scope={{ content: pgContent }}>
    <div class="h-64 w-full max-w-xl">
      <CodeEditor
        bind:content={pgContent}
        docType={demoDocType}
        {editable}
        theme={demoTheme}
        containerClass="h-full overflow-hidden rounded-md border border-slate-700 bg-slate-950"
        editorClass="h-full" />
    </div>
  </ShowcaseSection>
</ShowcasePage>
