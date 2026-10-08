<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Checkbox from '$lib/components/Checkbox.svelte'
  import EditDialog from '$lib/components/EditDialog.svelte'
  import LazyCodeEditor from '$lib/components/LazyCodeEditor.svelte'
  import Resizable from '$lib/components/Resizable.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import TagInput from '$lib/components/TagInput.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import EditIcon from '$lib/icons/EditIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { extractComponentAttributes, extractScriptJsonConst } from '$lib/showcase/snippet-attributes'
  import { splitLeadingScript } from '$lib/showcase/snippet-source'
  import {
    buildTagInputSnippet,
    parseTagListJson,
    parseTagListValue,
    TAG_STAGE_DEFAULT_WIDTH,
    TAG_STAGE_HOST,
    TAG_STAGE_MIN_WIDTH,
    TAG_STAGE_PANE,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  const INITIAL_TAGS = ['svelte', 'kit']
  const DEFAULT_AVAILABLE_TAGS = ['svelte', 'kit', 'icons', 'forms', 'tables']

  // An alternate palette, to show the `palette` prop overriding the built-in
  // per-tag colours.
  const ALT_PALETTE = [
    'border-amber-700 bg-amber-950/50 text-amber-200',
    'border-teal-700 bg-teal-950/50 text-teal-200',
    'border-fuchsia-700 bg-fuchsia-950/50 text-fuchsia-200',
  ]

  // Customizer playground state. The tag lists are committed state seeded from
  // the defaults above; every other override starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgValue = $state([...INITIAL_TAGS])
  let pgAvailableTags = $state([...DEFAULT_AVAILABLE_TAGS])
  let pgPlaceholder = $state('')
  let pgPalette = $state('')
  let pgDisabled = $state<TriState>('')
  let pgInputId = $state('')
  let pgChipClass = $state('')
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(TAG_STAGE_DEFAULT_WIDTH)

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const disabled = $derived(flagOn(pgDisabled))

  const paletteOptions = [{ value: 'alt', label: 'Alt palette' }]

  function clearPlayground() {
    pgValue = [...INITIAL_TAGS]
    pgAvailableTags = [...DEFAULT_AVAILABLE_TAGS]
    pgPlaceholder = ''
    pgPalette = ''
    pgDisabled = ''
    pgInputId = ''
    pgChipClass = ''
    pgStageWidth = TAG_STAGE_DEFAULT_WIDTH
    pgValueOpen = false
    pgAvailableOpen = false
  }

  // Tag-list JSON editor dialogs. Each draft is seeded on open and only
  // committed on OK, so cancelling (or a dirty-dismiss) never touches the live
  // lists.
  let pgValueOpen = $state(false)
  let pgValueDraft = $state('')
  const parsedValue = $derived(parseTagListJson(pgValueDraft))
  const valueDirty = $derived(pgValueDraft !== JSON.stringify(pgValue, null, 2))

  let pgAvailableOpen = $state(false)
  let pgAvailableDraft = $state('')
  const parsedAvailable = $derived(parseTagListJson(pgAvailableDraft))
  const availableDirty = $derived(pgAvailableDraft !== JSON.stringify(pgAvailableTags, null, 2))

  function openValueEditor() {
    pgValueDraft = JSON.stringify(pgValue, null, 2)
    pgValueOpen = true
  }

  function openAvailableEditor() {
    pgAvailableDraft = JSON.stringify(pgAvailableTags, null, 2)
    pgAvailableOpen = true
  }

  function saveValueEditor() {
    if (!parsedValue) return
    pgValue = parsedValue
    pgValueOpen = false
  }

  function saveAvailableEditor() {
    if (!parsedAvailable) return
    pgAvailableTags = parsedAvailable
    pgAvailableOpen = false
  }

  const code = $derived.by(() =>
    buildTagInputSnippet({
      value: pgValue,
      availableTags: pgAvailableTags,
      placeholder: pgPlaceholder,
      palette: pgPalette,
      disabled: pgDisabled,
      inputId: pgInputId,
      chipClass: pgChipClass,
    }),
  )

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ altPalette: ALT_PALETTE }),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Write a compiled snippet's recognized demo-tag attributes back into
  // playground state, so snippet edits show up in the Value column. Only
  // canonical shapes map (literals, the `altPalette` scope ref, bare flags);
  // custom expressions are left alone, and a draft without a complete demo tag
  // (a free-form experiment) touches nothing. Absent means unset, matching
  // what the builder omits — including the default placeholder, which reads as
  // unset. `syncSeed` then holds the regenerated seed back so the editor keeps
  // the user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const attrs = extractComponentAttributes(source, 'TagInput')
    if (!attrs) {
      return
    }
    const placeholder = attrs.get('placeholder')
    if (!placeholder) {
      pgPlaceholder = ''
    } else if (placeholder.kind === 'string') {
      pgPlaceholder = placeholder.value === 'Add a tag' ? '' : placeholder.value
    }
    const palette = attrs.get('palette')
    if (!palette || (palette.kind === 'expression' && palette.value === 'altPalette')) {
      pgPalette = ''
    }
    const disabled = attrs.get('disabled')
    if (!disabled) {
      pgDisabled = ''
    } else if (disabled.kind === 'bare') {
      pgDisabled = 'yes'
    } else if (disabled.kind === 'expression' && (disabled.value === 'true' || disabled.value === 'false')) {
      pgDisabled = disabled.value === 'true' ? 'yes' : 'no'
    }
    const inputId = attrs.get('inputId')
    if (!inputId) {
      pgInputId = ''
    } else if (inputId.kind === 'string') {
      pgInputId = inputId.value
    }
    const chipClass = attrs.get('chipClass')
    if (!chipClass) {
      pgChipClass = ''
    } else if (chipClass.kind === 'string') {
      pgChipClass = chipClass.value
    }
    const declarations = splitLeadingScript(source).declarations
    const value = parseTagListValue(extractScriptJsonConst(declarations, 'value'))
    if (value) {
      pgValue = value
    }
    const availableTags = parseTagListValue(extractScriptJsonConst(declarations, 'availableTags'))
    if (availableTags) {
      pgAvailableTags = availableTags
    }
    preview.syncSeed()
  }

  // Editable rows first (primitives, plain data, and snippets, A–Z), then the
  // function props (A–Z). Snippet rows keep no Value editor yet; the snippet
  // playground remains their customization surface.
  const props: PropRow[] = [
    { name: 'availableTags', type: 'string[]', defaultValue: '[]', note: 'Suggestions offered while typing.' },
    { name: 'chip', type: 'Snippet<[tag, remove]>', defaultValue: '—', note: 'Custom chip renderer.' },
    {
      name: 'chipClass',
      type: 'string',
      defaultValue: '—',
      note: 'Uniform classes for every chip; wins over the palette.',
    },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input.' },
    { name: 'inputId', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'option', type: 'Snippet<[tag]>', defaultValue: '—', note: 'Custom suggestion renderer.' },
    {
      name: 'palette',
      type: 'readonly string[]',
      defaultValue: 'built-in',
      note: 'Per-tag colour classes; replaces the built-in palette.',
    },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Placeholder text.' },
    { name: 'value', type: 'string[]', defaultValue: '[]', note: 'Selected tags.' },
    {
      name: 'chipClassFor',
      type: '(tag: string) => string',
      defaultValue: '—',
      note: 'Per-tag chip classes; wins over chipClass.',
    },
    { name: 'onChange', type: '(next: string[]) => void', defaultValue: '—', note: 'Called with the new tag list.' },
    {
      name: 'onQueryChange',
      type: '(query: string) => void',
      defaultValue: '—',
      note: 'Called on every keystroke; supply externally filtered availableTags.',
    },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet codeIcon()}
  <CodeIcon size="sm" />
{/snippet}

{#snippet editIcon()}
  <EditIcon size="sm" />
{/snippet}

{#snippet pageActions()}
  <Button
    variant="ghost"
    size="sm"
    icon={codeIcon}
    ariaLabel={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    ariaExpanded={preview.open}
    tooltip={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    onClick={() => preview.toggle()} />
{/snippet}

{#snippet propValue(row: PropRow)}
  {#if row.name === 'value'}
    <Button
      variant="ghost"
      size="sm"
      icon={editIcon}
      ariaLabel="Edit value"
      tooltip="Edit value as JSON"
      onClick={openValueEditor} />
  {:else if row.name === 'availableTags'}
    <Button
      variant="ghost"
      size="sm"
      icon={editIcon}
      ariaLabel="Edit available tags"
      tooltip="Edit available tags as JSON"
      onClick={openAvailableEditor} />
  {:else if row.name === 'placeholder'}
    <TextInput bind:value={pgPlaceholder} ariaLabel="placeholder value" placeholder="Add a tag" />
  {:else if row.name === 'disabled'}
    <Checkbox
      checked={disabled ?? false}
      ariaLabel="disabled value"
      onChange={value => (pgDisabled = value ? 'yes' : 'no')} />
  {:else if row.name === 'inputId'}
    <TextInput bind:value={pgInputId} ariaLabel="inputId value" placeholder="(none)" />
  {:else if row.name === 'chipClass'}
    <TextInput bind:value={pgChipClass} ariaLabel="chipClass value" placeholder="(none)" />
  {:else if row.name === 'palette'}
    <SelectDropdown
      buttonLabel={pgPalette ? 'Alt palette' : 'Default'}
      activeValue={pgPalette}
      ariaLabel="palette value"
      options={paletteOptions}
      onSelect={value => (pgPalette = value)}
      clearable
      clearLabel="Clear palette"
      onClear={() => (pgPalette = '')} />
  {:else}
    <span class="text-slate-500">—</span>
  {/if}
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} value={propValue} />
{/snippet}

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; this panel
    keeps only Reset (and any future composite preset that drives several props
    at once). -->
  <Buttons className="flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
{/snippet}

<ShowcasePage name="TagInput" props={propsSnippet} actions={pageActions} wide>
  <ShowcaseSection
    title="TagInput"
    {code}
    {preview}
    showHeader={false}
    bordered={false}
    footer={settingsPanel}
    scope={{ altPalette: ALT_PALETTE }}>
    <div class={TAG_STAGE_HOST}>
      <Resizable
        width={pgStageWidth}
        minWidth={TAG_STAGE_MIN_WIDTH}
        maxWidth="parent"
        onResize={nextWidth => (pgStageWidth = nextWidth)}>
        <div class={TAG_STAGE_PANE}>
          <TagInput
            value={pgValue}
            availableTags={pgAvailableTags}
            placeholder={pgPlaceholder || 'Add a tag'}
            palette={pgPalette === 'alt' ? ALT_PALETTE : undefined}
            {disabled}
            inputId={pgInputId || undefined}
            chipClass={pgChipClass || undefined}
            onChange={next => (pgValue = next)} />
          <span class="text-sm text-slate-400">tags: {pgValue.join(', ')}</span>
        </div>
      </Resizable>
    </div>
  </ShowcaseSection>
</ShowcasePage>

{#if pgValueOpen}
  <EditDialog
    title="Edit value"
    maxWidth="2xl"
    closeLabel={i18n.t('common.close')}
    saveLabel={i18n.t('common.ok')}
    resetLabel={i18n.t('common.reset')}
    discardTitle={i18n.t('showcase.discardTitle')}
    discardMessage={i18n.t('showcase.discardMessage')}
    discardLabel={i18n.t('showcase.discard')}
    dirty={valueDirty}
    saveDisabled={!parsedValue}
    onSave={saveValueEditor}
    onReset={() => (pgValueDraft = JSON.stringify(pgValue, null, 2))}
    onClose={() => (pgValueOpen = false)}>
    <div class="flex min-h-0 flex-col gap-3">
      <LazyCodeEditor
        bind:content={pgValueDraft}
        docType="json"
        editorAriaLabel="Value JSON"
        containerClass="h-96 overflow-hidden rounded-md border border-slate-700 bg-slate-950"
        editorClass="h-full" />
      {#if !parsedValue}
        <p role="alert" class="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          Invalid value JSON. Use an array of strings.
        </p>
      {/if}
    </div>
  </EditDialog>
{/if}

{#if pgAvailableOpen}
  <EditDialog
    title="Edit available tags"
    maxWidth="2xl"
    closeLabel={i18n.t('common.close')}
    saveLabel={i18n.t('common.ok')}
    resetLabel={i18n.t('common.reset')}
    discardTitle={i18n.t('showcase.discardTitle')}
    discardMessage={i18n.t('showcase.discardMessage')}
    discardLabel={i18n.t('showcase.discard')}
    dirty={availableDirty}
    saveDisabled={!parsedAvailable}
    onSave={saveAvailableEditor}
    onReset={() => (pgAvailableDraft = JSON.stringify(pgAvailableTags, null, 2))}
    onClose={() => (pgAvailableOpen = false)}>
    <div class="flex min-h-0 flex-col gap-3">
      <LazyCodeEditor
        bind:content={pgAvailableDraft}
        docType="json"
        editorAriaLabel="Available tags JSON"
        containerClass="h-96 overflow-hidden rounded-md border border-slate-700 bg-slate-950"
        editorClass="h-full" />
      {#if !parsedAvailable}
        <p role="alert" class="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          Invalid available-tags JSON. Use an array of strings.
        </p>
      {/if}
    </div>
  </EditDialog>
{/if}
