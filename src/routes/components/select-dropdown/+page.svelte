<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Checkbox from '$lib/components/Checkbox.svelte'
  import EditDialog from '$lib/components/EditDialog.svelte'
  import LazyCodeEditor from '$lib/components/LazyCodeEditor.svelte'
  import Resizable from '$lib/components/Resizable.svelte'
  import SelectDropdown, { type SelectOption } from '$lib/components/SelectDropdown.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import EditIcon from '$lib/icons/EditIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { extractComponentAttributes, extractScriptValue } from '$lib/showcase/snippet-attributes'
  import { parseOptionArrayJson } from '$lib/showcase/option-json'
  import { splitLeadingScript } from '$lib/showcase/snippet-source'
  import {
    buildSelectDropdownSnippet,
    SELECT_STAGE_DEFAULT_WIDTH,
    SELECT_STAGE_HOST,
    SELECT_STAGE_MIN_WIDTH,
    SELECT_STAGE_PANE,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  const DEFAULT_OPTIONS: SelectOption[] = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
    { value: 'three', label: 'Three' },
    { value: 'four', label: 'Four' },
    { value: 'five', label: 'Five' },
    { value: 'six', label: 'Six' },
    { value: 'seven', label: 'Seven' },
    { value: 'eight', label: 'Eight' },
    { value: 'nine', label: 'Nine' },
    { value: 'ten', label: 'Ten' },
    { value: 'eleven', label: 'Eleven' },
    { value: 'twelve', label: 'Twelve' },
    { value: 'thirteen', label: 'Thirteen' },
    { value: 'fourteen', label: 'Fourteen' },
    { value: 'fifteen', label: 'Fifteen' },
    { value: 'sixteen', label: 'Sixteen' },
    { value: 'seventeen', label: 'Seventeen' },
    { value: 'eighteen', label: 'Eighteen' },
    { value: 'nineteen', label: 'Nineteen' },
    { value: 'twenty', label: 'Twenty' },
  ]

  // Customizer playground state. Every override starts unset (the component
  // default renders), so the cleared form applies no overrides; `ariaLabel` is
  // the one always-present value, seeded to the demo's accessible name.
  // Options are committed state edited through the JSON dialog below.
  let pgOptions = $state(DEFAULT_OPTIONS)
  let pgValue = $state('two')
  let pgAriaLabel = $state('default')
  let pgButtonLabel = $state('')
  let pgSize = $state('')
  let pgFilterable = $state<TriState>('')
  let pgAllowCustomValue = $state<TriState>('')
  let pgButtonClass = $state('')
  let pgControlClass = $state('')
  let pgOptionClass = $state('')
  let pgEmptyLabel = $state('')
  let pgClearable = $state<TriState>('')
  let pgClearLabel = $state('')
  let pgAlign = $state('')
  let pgAutoPlace = $state<TriState>('')
  let pgPanelClass = $state('')
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(SELECT_STAGE_DEFAULT_WIDTH)

  function labelFor(list: SelectOption[], current: string): string {
    for (const option of list) {
      if (typeof option === 'string') {
        if (option === current) return option
      } else if (option.value === current) {
        return option.label ?? option.value
      }
    }
    return current
  }

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoSize = $derived(parseSizeValue(pgSize))
  const filterable = $derived(flagOn(pgFilterable))
  const allowCustomValue = $derived(flagOn(pgAllowCustomValue))
  const clearable = $derived(flagOn(pgClearable))
  const autoPlace = $derived(flagOn(pgAutoPlace))
  const demoAlign = $derived((pgAlign || undefined) as 'left' | 'right' | undefined)
  const demoButtonClass = $derived(pgButtonClass || undefined)
  const demoControlClass = $derived(pgControlClass || undefined)
  const demoOptionClass = $derived(pgOptionClass || undefined)
  const demoEmptyLabel = $derived(pgEmptyLabel || undefined)
  const demoClearLabel = $derived(pgClearLabel || undefined)
  const demoPanelClass = $derived(pgPanelClass || undefined)

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
  ]
  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  function clearPlayground() {
    pgOptions = DEFAULT_OPTIONS
    pgValue = 'two'
    pgAriaLabel = 'default'
    pgButtonLabel = ''
    pgSize = ''
    pgFilterable = ''
    pgAllowCustomValue = ''
    pgButtonClass = ''
    pgControlClass = ''
    pgOptionClass = ''
    pgEmptyLabel = ''
    pgClearable = ''
    pgClearLabel = ''
    pgAlign = ''
    pgAutoPlace = ''
    pgPanelClass = ''
    pgStageWidth = SELECT_STAGE_DEFAULT_WIDTH
    pgOptionsOpen = false
  }

  // Options JSON editor dialog. The draft is seeded on open and only committed
  // on OK, so cancelling (or a dirty-dismiss) never touches the live options.
  let pgOptionsOpen = $state(false)
  let pgOptionsDraft = $state('')
  const parsedOptions = $derived(parseOptionArrayJson(pgOptionsDraft))
  const optionsDirty = $derived(pgOptionsDraft !== JSON.stringify(pgOptions, null, 2))

  function openOptionsEditor() {
    pgOptionsDraft = JSON.stringify(pgOptions, null, 2)
    pgOptionsOpen = true
  }

  function saveOptionsEditor() {
    if (!parsedOptions) return
    pgOptions = parsedOptions
    pgOptionsOpen = false
  }

  const code = $derived.by(() =>
    buildSelectDropdownSnippet({
      ariaLabel: pgAriaLabel,
      buttonLabel: pgButtonLabel,
      value: pgValue,
      size: pgSize,
      filterable: pgFilterable,
      allowCustomValue: pgAllowCustomValue,
      buttonClass: pgButtonClass,
      controlClass: pgControlClass,
      optionClass: pgOptionClass,
      emptyLabel: pgEmptyLabel,
      clearable: pgClearable,
      clearLabel: pgClearLabel,
      align: pgAlign,
      autoPlace: pgAutoPlace,
      panelClass: pgPanelClass,
    }),
  )

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ options: pgOptions }),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Write a compiled snippet's recognized demo-tag attributes back into
  // playground state, so snippet edits show up in the Value column. Only
  // canonical shapes map (literals, bare flags, `{true}`/`{false}`); custom
  // expressions are left alone, and a draft without a complete demo tag (a
  // free-form experiment) touches nothing. Absent means unset, matching what
  // the builder omits. `syncSeed` then holds the regenerated seed back so the
  // editor keeps the user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const attrs = extractComponentAttributes(source, 'SelectDropdown')
    if (!attrs) {
      return
    }
    const text = (name: string): string | undefined => {
      if (!attrs.has(name)) {
        return ''
      }
      const attr = attrs.get(name)!
      return attr.kind === 'string' ? attr.value : undefined
    }
    const tri = (name: string): TriState | undefined => {
      if (!attrs.has(name)) {
        return ''
      }
      const attr = attrs.get(name)!
      if (attr.kind === 'bare') {
        return 'yes'
      }
      if (attr.kind === 'expression' && (attr.value === 'true' || attr.value === 'false')) {
        return attr.value === 'true' ? 'yes' : 'no'
      }
      return undefined
    }
    const applyText = (name: string, assign: (value: string) => void) => {
      const next = text(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    const applyTri = (name: string, assign: (value: TriState) => void) => {
      const next = tri(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    applyText('ariaLabel', value => (pgAriaLabel = value))
    applyText('buttonLabel', value => (pgButtonLabel = value))
    applyText('size', value => (pgSize = value))
    applyText('buttonClass', value => (pgButtonClass = value))
    applyText('controlClass', value => (pgControlClass = value))
    applyText('optionClass', value => (pgOptionClass = value))
    applyText('emptyLabel', value => (pgEmptyLabel = value))
    applyText('clearLabel', value => (pgClearLabel = value))
    applyText('align', value => (pgAlign = value))
    applyText('panelClass', value => (pgPanelClass = value))
    applyTri('filterable', value => (pgFilterable = value))
    applyTri('allowCustomValue', value => (pgAllowCustomValue = value))
    applyTri('clearable', value => (pgClearable = value))
    applyTri('autoPlace', value => (pgAutoPlace = value))
    const active = attrs.get('activeValue')
    if (active?.kind === 'string') {
      pgValue = active.value
    } else {
      // The builder seeds the value as script-local state; a hand-written
      // `activeValue="…"` literal takes precedence when both exist (the prop
      // governs the trigger).
      const scriptValue = extractScriptValue(splitLeadingScript(source).declarations)
      if (scriptValue !== null) {
        pgValue = scriptValue
      }
    }
    preview.syncSeed()
  }

  // The seed covers every override except the options array (the snippet reads
  // it from scope), so only options edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  $effect(() => {
    pgOptions
    if (preview.live) preview.refresh()
  })

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). Snippet edits map the same way through `syncPlaygroundFromSnippet`.
  const props: PropRow[] = [
    { name: 'activeValue', type: 'string', defaultValue: "''", note: 'Committed value; marked in the panel.' },
    { name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.' },
    {
      name: 'allowCustomValue',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Enter commits typed text that matches no option (filterable only).',
    },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the control.' },
    { name: 'autoPlace', type: 'boolean', defaultValue: 'true', note: 'Flips the panel when crowded.' },
    {
      name: 'buttonClass',
      type: 'string',
      defaultValue: 'built-in',
      note: 'Replaces the trigger button box classes.',
    },
    {
      name: 'buttonLabel',
      type: 'string',
      defaultValue: 'derived',
      note: "Overrides the trigger label; omit it and the trigger shows the committed option's label (or the raw value).",
    },
    {
      name: 'clearLabel',
      type: 'string',
      defaultValue: "'Clear selection'",
      note: 'Accessible name for the clear button.',
    },
    {
      name: 'clearable',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Appends a cross button that clears the value.',
    },
    {
      name: 'controlClass',
      type: 'string',
      defaultValue: 'built-in',
      note: 'Replaces the filterable trigger box classes.',
    },
    { name: 'emptyLabel', type: 'string', defaultValue: '—', note: 'Shown when the filtered list is empty.' },
    { name: 'filterable', type: 'boolean', defaultValue: 'false', note: 'Renders a combobox input with filtering.' },
    { name: 'optionClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the option row classes.' },
    {
      name: 'options',
      type: '(string | { value: string; label?: string })[]',
      defaultValue: '—',
      note: 'Selectable options; a bare string (or a missing label) displays as its own value.',
    },
    { name: 'panelClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the floating panel classes.' },
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | number",
      defaultValue: "'sm'",
      note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.',
    },
    {
      name: 'onClear',
      type: '() => void',
      defaultValue: "onSelect('')",
      note: 'Clear handler; selects empty when omitted.',
    },
    { name: 'onSelect', type: '(value: string) => void', defaultValue: '—', note: 'Called with the chosen value.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet codeIcon()}
  <CodeIcon size="sm" />
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

{#snippet editIcon()}
  <EditIcon size="sm" />
{/snippet}

{#snippet propValue(row: PropRow)}
  {#if row.name === 'ariaLabel'}
    <TextInput bind:value={pgAriaLabel} ariaLabel="ariaLabel value" placeholder="(none)" />
  {:else if row.name === 'filterable'}
    <Checkbox
      checked={filterable ?? false}
      ariaLabel="filterable value"
      onChange={value => (pgFilterable = value ? 'yes' : 'no')} />
  {:else if row.name === 'allowCustomValue'}
    <Checkbox
      checked={allowCustomValue ?? false}
      ariaLabel="allowCustomValue value"
      onChange={value => (pgAllowCustomValue = value ? 'yes' : 'no')} />
  {:else if row.name === 'size'}
    <SelectDropdown
      buttonLabel={pgSize || 'Default'}
      activeValue={pgSize}
      ariaLabel="size value"
      options={sizeOptions}
      filterable
      allowCustomValue
      onSelect={value => (pgSize = value)}
      clearable
      clearLabel="Clear size"
      onClear={() => (pgSize = '')} />
  {:else if row.name === 'options'}
    <Button
      variant="ghost"
      size="sm"
      icon={editIcon}
      ariaLabel="Edit options"
      tooltip="Edit options as JSON"
      onClick={openOptionsEditor} />
  {:else if row.name === 'buttonClass'}
    <TextInput bind:value={pgButtonClass} ariaLabel="buttonClass value" placeholder="(built-in)" />
  {:else if row.name === 'controlClass'}
    <TextInput bind:value={pgControlClass} ariaLabel="controlClass value" placeholder="(built-in)" />
  {:else if row.name === 'optionClass'}
    <TextInput bind:value={pgOptionClass} ariaLabel="optionClass value" placeholder="(built-in)" />
  {:else if row.name === 'emptyLabel'}
    <TextInput bind:value={pgEmptyLabel} ariaLabel="emptyLabel value" placeholder="(none)" />
  {:else if row.name === 'clearable'}
    <Checkbox
      checked={clearable ?? false}
      ariaLabel="clearable value"
      onChange={value => (pgClearable = value ? 'yes' : 'no')} />
  {:else if row.name === 'clearLabel'}
    <TextInput bind:value={pgClearLabel} ariaLabel="clearLabel value" placeholder="Clear selection" />
  {:else if row.name === 'align'}
    <SelectDropdown
      buttonLabel={pgAlign || 'left'}
      activeValue={pgAlign || 'left'}
      ariaLabel="align value"
      options={alignOptions}
      onSelect={value => (pgAlign = value)}
      clearable
      clearLabel="Clear align"
      onClear={() => (pgAlign = '')} />
  {:else if row.name === 'autoPlace'}
    <Checkbox
      checked={autoPlace ?? true}
      ariaLabel="autoPlace value"
      onChange={value => (pgAutoPlace = value ? 'yes' : 'no')} />
  {:else if row.name === 'panelClass'}
    <TextInput bind:value={pgPanelClass} ariaLabel="panelClass value" placeholder="(built-in)" />
  {:else if row.name === 'buttonLabel'}
    <TextInput bind:value={pgButtonLabel} ariaLabel="buttonLabel value" placeholder={labelFor(pgOptions, pgValue)} />
  {:else if row.name === 'activeValue'}
    <TextInput bind:value={pgValue} ariaLabel="activeValue value" />
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

<ShowcasePage name="SelectDropdown" props={propsSnippet} actions={pageActions} wide>
  <ShowcaseSection
    title="SelectDropdown"
    {code}
    {preview}
    showHeader={false}
    bordered={false}
    footer={settingsPanel}
    scope={{ options: pgOptions }}>
    <div class={SELECT_STAGE_HOST}>
      <Resizable
        width={pgStageWidth}
        minWidth={SELECT_STAGE_MIN_WIDTH}
        maxWidth="parent"
        onResize={nextWidth => (pgStageWidth = nextWidth)}>
        <div class={SELECT_STAGE_PANE}>
          <SelectDropdown
            buttonLabel={pgButtonLabel || undefined}
            activeValue={pgValue}
            ariaLabel={pgAriaLabel}
            size={demoSize}
            {filterable}
            {allowCustomValue}
            buttonClass={demoButtonClass}
            controlClass={demoControlClass}
            optionClass={demoOptionClass}
            emptyLabel={demoEmptyLabel}
            {clearable}
            clearLabel={demoClearLabel}
            align={demoAlign}
            {autoPlace}
            panelClass={demoPanelClass}
            options={pgOptions}
            onSelect={next => (pgValue = next)} />
          <span class="text-sm text-slate-400">value: {pgValue}</span>
        </div>
      </Resizable>
    </div>
  </ShowcaseSection>
</ShowcasePage>

{#if pgOptionsOpen}
  <EditDialog
    title="Edit options"
    maxWidth="2xl"
    closeLabel={i18n.t('common.close')}
    saveLabel={i18n.t('common.ok')}
    resetLabel={i18n.t('common.reset')}
    discardTitle={i18n.t('showcase.discardTitle')}
    discardMessage={i18n.t('showcase.discardMessage')}
    discardLabel={i18n.t('showcase.discard')}
    dirty={optionsDirty}
    saveDisabled={!parsedOptions}
    onSave={saveOptionsEditor}
    onReset={() => (pgOptionsDraft = JSON.stringify(pgOptions, null, 2))}
    onClose={() => (pgOptionsOpen = false)}>
    <div class="flex min-h-0 flex-col gap-3">
      <LazyCodeEditor
        bind:content={pgOptionsDraft}
        docType="json"
        editorAriaLabel="Options JSON"
        containerClass="h-96 overflow-hidden rounded-md border border-slate-700 bg-slate-950"
        editorClass="h-full" />
      {#if !parsedOptions}
        <p role="alert" class="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          Invalid options JSON. Use an array of strings or {'{ value, label? }'} objects.
        </p>
      {/if}
    </div>
  </EditDialog>
{/if}
