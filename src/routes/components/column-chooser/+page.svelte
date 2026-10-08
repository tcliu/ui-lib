<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import ColumnChooser from '$lib/components/ColumnChooser.svelte'
  import EditDialog from '$lib/components/EditDialog.svelte'
  import LazyCodeEditor from '$lib/components/LazyCodeEditor.svelte'
  import Resizable from '$lib/components/Resizable.svelte'
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
    buildColumnChooserSnippet,
    CHOOSER_LABEL,
    CHOOSER_RESET_LABEL,
    COLUMNS_STAGE_DEFAULT_WIDTH,
    COLUMNS_STAGE_HOST,
    COLUMNS_STAGE_MIN_WIDTH,
    COLUMNS_STAGE_PANE,
    parseColumnsJson,
    parseColumnsValue,
    seedColumns,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. The column list is committed state (all
  // checked to start); labels start unset so the component default renders.
  // The cleared form restores all three.
  let pgColumns = $state(seedColumns())
  let pgLabel = $state('')
  let pgResetLabel = $state('')
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(COLUMNS_STAGE_DEFAULT_WIDTH)

  const hiddenCount = $derived(pgColumns.filter(column => !column.checked).length)

  function handleToggleColumn(key: string, checked: boolean): void {
    pgColumns = pgColumns.map(column => (column.key === key ? { ...column, checked } : column))
  }

  function handleResetColumns(): void {
    pgColumns = pgColumns.map(column => ({ ...column, checked: true }))
  }

  function clearPlayground(): void {
    pgLabel = ''
    pgResetLabel = ''
    pgColumns = seedColumns()
    pgStageWidth = COLUMNS_STAGE_DEFAULT_WIDTH
    pgColumnsOpen = false
  }

  // Columns JSON editor dialog. The draft is seeded on open and only committed
  // on OK, so cancelling (or a dirty-dismiss) never touches the live columns.
  let pgColumnsOpen = $state(false)
  let pgColumnsDraft = $state('')
  const parsedColumns = $derived(parseColumnsJson(pgColumnsDraft))
  const columnsDirty = $derived(pgColumnsDraft !== JSON.stringify(pgColumns, null, 2))

  function openColumnsEditor() {
    pgColumnsDraft = JSON.stringify(pgColumns, null, 2)
    pgColumnsOpen = true
  }

  function saveColumnsEditor() {
    if (!parsedColumns) return
    pgColumns = parsedColumns
    pgColumnsOpen = false
  }

  const code = $derived.by(() =>
    buildColumnChooserSnippet({ label: pgLabel, resetLabel: pgResetLabel, columns: pgColumns }),
  )

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ chooserLabel: CHOOSER_LABEL, resetLabel: CHOOSER_RESET_LABEL }),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Write a compiled snippet's recognized demo-tag attributes back into
  // playground state, so snippet edits show up in the Value column. Only
  // canonical shapes map (literals, scope refs for the two labels, a seeded
  // columns const); custom expressions are left alone, and a draft without a
  // complete demo tag (a free-form experiment) touches nothing. Absent means
  // unset, matching what the builder omits. `syncSeed` then holds the
  // regenerated seed back so the editor keeps the user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const attrs = extractComponentAttributes(source, 'ColumnChooser')
    if (!attrs) {
      return
    }
    const label = attrs.get('label')
    if (!label || (label.kind === 'expression' && label.value === 'chooserLabel')) {
      pgLabel = ''
    } else if (label.kind === 'string') {
      pgLabel = label.value
    }
    const reset = attrs.get('resetLabel')
    if (!reset || (reset.kind === 'expression' && reset.value === 'resetLabel')) {
      pgResetLabel = ''
    } else if (reset.kind === 'string') {
      pgResetLabel = reset.value
    }
    const columns = parseColumnsValue(extractScriptJsonConst(splitLeadingScript(source).declarations, 'columns'))
    if (columns) {
      pgColumns = columns
    }
    preview.syncSeed()
  }

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const props: PropRow[] = [
    {
      name: 'columns',
      type: 'ChooserColumn[]',
      defaultValue: '—',
      note: 'Entries with key, header, and checked state.',
    },
    { name: 'label', type: 'string', defaultValue: '—', note: 'Accessible name and tooltip for the trigger.' },
    {
      name: 'resetLabel',
      type: 'string',
      defaultValue: '—',
      note: 'Accessible name and tooltip for the reset button.',
    },
    { name: 'onReset', type: '() => void', defaultValue: '—', note: 'Fires when the reset button is pressed.' },
    {
      name: 'onToggle',
      type: '(key: string, checked: boolean) => void',
      defaultValue: '—',
      note: 'Fires when a column checkbox changes.',
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
  {#if row.name === 'label'}
    <TextInput bind:value={pgLabel} ariaLabel="label value" placeholder={CHOOSER_LABEL} />
  {:else if row.name === 'resetLabel'}
    <TextInput bind:value={pgResetLabel} ariaLabel="resetLabel value" placeholder={CHOOSER_RESET_LABEL} />
  {:else if row.name === 'columns'}
    <Button
      variant="ghost"
      size="sm"
      icon={editIcon}
      ariaLabel="Edit columns"
      tooltip="Edit columns as JSON"
      onClick={openColumnsEditor} />
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

<ShowcasePage name="ColumnChooser" props={propsSnippet} actions={pageActions} wide>
  <ShowcaseSection
    title="ColumnChooser"
    {code}
    {preview}
    showHeader={false}
    bordered={false}
    footer={settingsPanel}
    scope={{ chooserLabel: CHOOSER_LABEL, resetLabel: CHOOSER_RESET_LABEL }}>
    <div class={COLUMNS_STAGE_HOST}>
      <Resizable
        width={pgStageWidth}
        minWidth={COLUMNS_STAGE_MIN_WIDTH}
        maxWidth="parent"
        onResize={nextWidth => (pgStageWidth = nextWidth)}>
        <div class={COLUMNS_STAGE_PANE}>
          <ColumnChooser
            label={pgLabel || CHOOSER_LABEL}
            resetLabel={pgResetLabel || CHOOSER_RESET_LABEL}
            columns={pgColumns}
            onToggle={handleToggleColumn}
            onReset={handleResetColumns} />
          <span class="text-sm text-slate-400">hidden: {hiddenCount}</span>
        </div>
      </Resizable>
    </div>
  </ShowcaseSection>
</ShowcasePage>

{#if pgColumnsOpen}
  <EditDialog
    title="Edit columns"
    maxWidth="2xl"
    closeLabel={i18n.t('common.close')}
    saveLabel={i18n.t('common.ok')}
    resetLabel={i18n.t('common.reset')}
    discardTitle={i18n.t('showcase.discardTitle')}
    discardMessage={i18n.t('showcase.discardMessage')}
    discardLabel={i18n.t('showcase.discard')}
    dirty={columnsDirty}
    saveDisabled={!parsedColumns}
    onSave={saveColumnsEditor}
    onReset={() => (pgColumnsDraft = JSON.stringify(pgColumns, null, 2))}
    onClose={() => (pgColumnsOpen = false)}>
    <div class="flex min-h-0 flex-col gap-3">
      <LazyCodeEditor
        bind:content={pgColumnsDraft}
        docType="json"
        editorAriaLabel="Columns JSON"
        containerClass="h-96 overflow-hidden rounded-md border border-slate-700 bg-slate-950"
        editorClass="h-full" />
      {#if !parsedColumns}
        <p role="alert" class="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          Invalid columns JSON. Use an array of {'{ key, header, checked? }'} objects.
        </p>
      {/if}
    </div>
  </EditDialog>
{/if}
