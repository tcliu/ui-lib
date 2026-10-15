<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Copyable from '$lib/components/Copyable.svelte'
  import EditDialog from '$lib/components/EditDialog.svelte'
  import { DIALOG_SIZE_VARIANTS } from '$lib/components/BaseDialog.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildHeaderLine, parseHeaderMarkup } from '$lib/showcase/snippet-header'
  import {
    buildEditActionsMarkup,
    buildEditBodyMarkup,
    buildEditDialogSnippet,
    normalizeEditActionsDraft,
    normalizeEditBodyDraft,
    parseEditActionsLabel,
    parseEditActionsMarkup,
    parseEditBodyMarkup,
    parseEditBodySegments,
    type EditBodySegment,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgOpen`/`pgDraft`/`pgSaved` are interaction state, not curated options.
  let pgOpen = $state(false)
  let pgDraft = $state('Editable text')
  let pgSaved = $state('Editable text')
  let pgWidthVariant = $state('md')
  let pgWidthVariantOn = $state(false)
  let pgHeightVariant = $state('auto')
  let pgHeightVariantOn = $state(false)
  let pgSize = $state('')
  let pgSizeOn = $state(false)
  let pgDirty = $state<TriState>('no')
  let pgDirtyOn = $state(false)
  let pgPending = $state<TriState>('no')
  let pgPendingOn = $state(false)
  let pgSaveDisabled = $state<TriState>('no')
  let pgSaveDisabledOn = $state(false)
  // Unset, each label renders the localized default (matching the seed's
  // scope refs); set text overrides it in both demo and seed.
  let pgCloseLabel = $state('')
  let pgCloseLabelOn = $state(false)
  let pgDiscardLabel = $state('')
  let pgDiscardLabelOn = $state(false)
  let pgDiscardMessage = $state('')
  let pgDiscardMessageOn = $state(false)
  let pgDiscardTitle = $state('')
  let pgDiscardTitleOn = $state(false)
  let pgResetLabel = $state('')
  let pgResetLabelOn = $state(false)
  let pgSaveLabel = $state('')
  let pgSaveLabelOn = $state(false)
  let pgTitle = $state('')
  let pgTitleOn = $state(false)
  // The header row edits the Copyable title the dialog heading renders (demo
  // data, so it has no single prop); committing the canonical shape resets to
  // unset, so defaults keep flowing from the title.
  let pgHeader = $state('')
  let pgHeaderOn = $state(false)
  // The body edits as TextInput/HTML lines and applies only while its eye is
  // on; raw markup while customized, empty for the canonical TextInput.
  let pgChildren = $state('')
  let pgChildrenOn = $state(true)
  // The actions snippet applies only while its eye is on; raw markup while
  // customized, empty for the canonical Format button.
  let pgActions = $state('')
  let pgActionsOn = $state(false)

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoWidthVariant = $derived(
    pgWidthVariantOn
      ? ((pgWidthVariant || undefined) as
        | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'fit' | 'wide'
        | undefined)
      : undefined,
  )
  const demoHeightVariant = $derived(
    pgHeightVariantOn
      ? ((pgHeightVariant || undefined) as 'auto' | (typeof DIALOG_SIZE_VARIANTS)[number] | undefined)
      : undefined,
  )
  const demoSize = $derived(
    pgSizeOn ? ((pgSize || undefined) as (typeof DIALOG_SIZE_VARIANTS)[number] | undefined) : undefined,
  )
  const dirty = $derived(pgDirtyOn ? (flagOn(pgDirty) ?? false) : false)
  const pending = $derived(pgPendingOn ? flagOn(pgPending) : undefined)
  const saveDisabled = $derived(pgSaveDisabledOn ? flagOn(pgSaveDisabled) : undefined)
  const demoTitle = $derived(pgTitleOn && pgTitle ? pgTitle : i18n.t('showcase.dialogTitle'))
  // Canonical header markup resolved from the title, matching the row seed
  // while unset.
  const canonicalHeader = $derived(buildHeaderLine({ text: demoTitle, inner: demoTitle }))
  const headerMarkup = $derived(pgHeader || canonicalHeader)
  const headerContent = $derived(parseHeaderMarkup(pgHeader) ?? { text: demoTitle, inner: demoTitle })
  const demoCloseLabel = $derived(pgCloseLabelOn && pgCloseLabel ? pgCloseLabel : i18n.t('common.close'))
  const demoSaveLabel = $derived(pgSaveLabelOn && pgSaveLabel ? pgSaveLabel : i18n.t('common.ok'))
  const demoResetLabel = $derived(pgResetLabelOn && pgResetLabel ? pgResetLabel : i18n.t('common.reset'))
  const demoDiscardTitle = $derived(pgDiscardTitleOn && pgDiscardTitle ? pgDiscardTitle : i18n.t('showcase.discardTitle'))
  const demoDiscardMessage = $derived(pgDiscardMessageOn && pgDiscardMessage ? pgDiscardMessage : i18n.t('showcase.discardMessage'))
  const demoDiscardLabel = $derived(pgDiscardLabelOn && pgDiscardLabel ? pgDiscardLabel : i18n.t('showcase.discard'))
  const demoBodyLabel = $derived(i18n.t('showcase.dialogTitle'))
  // Custom markup renders as committed; unset, the canonical TextInput binds
  // the draft with the dialog title as its name. Stored drafts are always
  // valid, so the fallback only covers the empty state.
  const demoBodyChildren = $derived<EditBodySegment[]>(
    parseEditBodySegments(pgChildren || buildEditBodyMarkup({ type: '', label: '' })) ?? [
      { kind: 'textinput', type: 'text', ariaLabel: { kind: 'scope' } },
    ],
  )
  // Committed actions markup is always valid, so the label resolves; the
  // fallback only covers direct calls with unvalidated text.
  const demoActionsLabel = $derived(
    parseEditActionsLabel(pgActions || buildEditActionsMarkup({ label: '' })) ?? 'Format',
  )
  const demoDraftValid = $derived.by(() => {
    try {
      JSON.parse(pgDraft)
      return true
    } catch {
      return false
    }
  })

  function formatDemoDraft() {
    try {
      pgDraft = JSON.stringify(JSON.parse(pgDraft), null, 2)
    } catch {
      // Unreachable while the button is enabled; never half-applies.
    }
  }
  // The children row edits the form body (demo data, so it has no single
  // prop). Committing the canonical TextInput resets to unset.
  const bodySnippet = $derived(pgChildren || buildEditBodyMarkup({ type: '', label: '' }))

  const widthVariantOptions = [...DIALOG_SIZE_VARIANTS, 'fit', 'wide'].map(value => ({ value, label: value }))
  const heightVariantOptions = ['auto', ...DIALOG_SIZE_VARIANTS].map(value => ({ value, label: value }))
  const sizeOptions = DIALOG_SIZE_VARIANTS.map(value => ({ value, label: value }))

  function clearPlayground() {
    pgOpen = false
    pgDraft = 'Editable text'
    pgSaved = 'Editable text'
    pgWidthVariant = 'md'
    pgWidthVariantOn = false
    pgHeightVariant = 'auto'
    pgHeightVariantOn = false
    pgSize = ''
    pgSizeOn = false
    pgDirty = 'no'
    pgDirtyOn = false
    pgPending = 'no'
    pgPendingOn = false
    pgSaveDisabled = 'no'
    pgSaveDisabledOn = false
    pgChildren = ''
    pgChildrenOn = true
    pgActions = ''
    pgActionsOn = false
    pgCloseLabel = ''
    pgCloseLabelOn = false
    pgDiscardLabel = ''
    pgDiscardLabelOn = false
    pgDiscardMessage = ''
    pgDiscardMessageOn = false
    pgDiscardTitle = ''
    pgDiscardTitleOn = false
    pgResetLabel = ''
    pgResetLabelOn = false
    pgSaveLabel = ''
    pgSaveLabelOn = false
    pgTitle = ''
    pgTitleOn = false
    pgHeader = ''
    pgHeaderOn = false
  }

  function handleSave() {
    pgSaved = pgDraft
    pgOpen = false
  }

  const code = $derived.by(() =>
    buildEditDialogSnippet({
      widthVariant: pgWidthVariant,
      widthVariantOn: pgWidthVariantOn,
      heightVariant: pgHeightVariant,
      heightVariantOn: pgHeightVariantOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      dirty: pgDirty,
      dirtyOn: pgDirtyOn,
      pending: pgPending,
      pendingOn: pgPendingOn,
      saveDisabled: pgSaveDisabled,
      saveDisabledOn: pgSaveDisabledOn,
      children: pgChildren,
      childrenEnabled: pgChildrenOn,
      actions: pgActions,
      actionsEnabled: pgActionsOn,
      closeLabel: pgCloseLabel,
      closeLabelOn: pgCloseLabelOn,
      discardLabel: pgDiscardLabel,
      discardLabelOn: pgDiscardLabelOn,
      discardMessage: pgDiscardMessage,
      discardMessageOn: pgDiscardMessageOn,
      discardTitle: pgDiscardTitle,
      discardTitleOn: pgDiscardTitleOn,
      resetLabel: pgResetLabel,
      resetLabelOn: pgResetLabelOn,
      saveLabel: pgSaveLabel,
      saveLabelOn: pgSaveLabelOn,
      title: pgTitle,
      titleOn: pgTitleOn,
      header: pgHeader,
      headerOn: pgHeaderOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      open: pgOpen,
      draft: pgDraft,
      saved: pgSaved,
      openDialogLabel: i18n.t('showcase.openDialog'),
      dialogTitle: i18n.t('showcase.dialogTitle'),
      closeLabel: i18n.t('common.close'),
      okLabel: i18n.t('common.ok'),
      resetLabel: i18n.t('common.reset'),
      discardTitle: i18n.t('showcase.discardTitle'),
      discardMessage: i18n.t('showcase.discardMessage'),
      discardLabel: i18n.t('showcase.discard'),
    }),
    sync: { tag: 'EditDialog', getFields: () => syncFields },
  })

  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text.
  const fields: SyncableFieldConfig[] = $derived([
    snippetField({
      name: 'actions',
      note: 'Extra footer buttons before OK; one outline Button line, committing applies it.',
      value: pgActions || buildEditActionsMarkup({ label: '' }),
      onChange: (draft: string) => {
        if (!parseEditActionsMarkup(draft)) return
        const normalized = normalizeEditActionsDraft(draft)
        pgActions = normalized === buildEditActionsMarkup({ label: '' }) ? '' : normalized
        pgActionsOn = true
      },
      dialog: snippetDialog(
        parseEditActionsMarkup,
        'Use a single <Button variant="outline" type="button">Label</Button> line.',
      ),
      toggle: snippetToggle(pgActionsOn, enabled => (pgActionsOn = enabled)),
    }),
    snippetField({
      name: 'children',
      note: 'Form body; TextInput lines and HTML elements, committing applies it.',
      value: bodySnippet,
      onChange: (draft: string) => {
        if (!parseEditBodyMarkup(draft)) return
        const normalized = normalizeEditBodyDraft(draft)
        pgChildren = normalized === buildEditBodyMarkup({ type: '', label: '' }) ? '' : normalized
        pgChildrenOn = true
      },
      dialog: snippetDialog(
        parseEditBodyMarkup,
        'Use <TextInput bind:value={draft} … /> lines and well-formed HTML elements only — no {…} expressions, components, or event handlers.',
      ),
      toggle: snippetToggle(pgChildrenOn, enabled => (pgChildrenOn = enabled)),
    }),
    { name: 'closeLabel', type: 'string', defaultValue: '—', note: 'Accessible name for dismissals; the eye stages the customization.', editor: 'text', clearable: true, value: pgCloseLabel, onChange: value => { pgCloseLabel = value; pgCloseLabelOn = true; }, toggle: snippetToggle(pgCloseLabelOn, enabled => (pgCloseLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'dirty', type: 'boolean', defaultValue: 'false', note: 'Gates the discard prompt and Reset; the eye stages the customization.', editor: 'boolean', value: pgDirty, onChange: value => { pgDirty = value as TriState; pgDirtyOn = true; }, toggle: snippetToggle(pgDirtyOn, enabled => (pgDirtyOn = enabled)), sync: { kind: 'tri' } },
    { name: 'discardLabel', type: 'string', defaultValue: '—', note: 'Discard-confirm button text; the eye stages the customization.', editor: 'text', clearable: true, value: pgDiscardLabel, onChange: value => { pgDiscardLabel = value; pgDiscardLabelOn = true; }, toggle: snippetToggle(pgDiscardLabelOn, enabled => (pgDiscardLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'discardMessage', type: 'string', defaultValue: '—', note: 'Discard-confirm body; the eye stages the customization.', editor: 'text', clearable: true, value: pgDiscardMessage, onChange: value => { pgDiscardMessage = value; pgDiscardMessageOn = true; }, toggle: snippetToggle(pgDiscardMessageOn, enabled => (pgDiscardMessageOn = enabled)), sync: { kind: 'text' } },
    { name: 'discardTitle', type: 'string', defaultValue: '—', note: 'Discard-confirm title; the eye stages the customization.', editor: 'text', clearable: true, value: pgDiscardTitle, onChange: value => { pgDiscardTitle = value; pgDiscardTitleOn = true; }, toggle: snippetToggle(pgDiscardTitleOn, enabled => (pgDiscardTitleOn = enabled)), sync: { kind: 'text' } },
    snippetField({
      name: 'header',
      note: 'Copyable title heading; one Copyable line, committing applies it. The plain title keeps rendering while off.',
      value: headerMarkup,
      onChange: (draft: string) => {
        const parsed = parseHeaderMarkup(draft)
        if (!parsed) return
        const normalized = buildHeaderLine(parsed)
        pgHeader = normalized === canonicalHeader ? '' : normalized
        pgHeaderOn = true
      },
      dialog: snippetDialog(
        parseHeaderMarkup,
        'Use a single <Copyable text="…"><span>…</span></Copyable> line with non-blank text and label.',
      ),
      toggle: snippetToggle(pgHeaderOn, enabled => (pgHeaderOn = enabled)),
    }),
    { name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content; the eye stages the customization.', editor: 'enum', options: heightVariantOptions, value: pgHeightVariant, onChange: value => { pgHeightVariant = value; pgHeightVariantOn = true; }, placeholder: 'auto', clearLabel: 'Clear height', toggle: snippetToggle(pgHeightVariantOn, enabled => (pgHeightVariantOn = enabled)), sync: { kind: 'text' } },
    { name: 'pending', type: 'boolean', defaultValue: 'false', note: 'Disables Save/Reset while an operation runs; the eye stages the customization.', editor: 'boolean', value: pgPending, onChange: value => { pgPending = value as TriState; pgPendingOn = true; }, toggle: snippetToggle(pgPendingOn, enabled => (pgPendingOn = enabled)), sync: { kind: 'tri' } },
    { name: 'resetLabel', type: 'string', defaultValue: '—', note: 'Reset button text; the eye stages the customization.', editor: 'text', clearable: true, value: pgResetLabel, onChange: value => { pgResetLabel = value; pgResetLabelOn = true; }, toggle: snippetToggle(pgResetLabelOn, enabled => (pgResetLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'saveDisabled', type: 'boolean', defaultValue: 'false', note: 'Caller validity rules; ORed with pending; the eye stages the customization.', editor: 'boolean', value: pgSaveDisabled, onChange: value => { pgSaveDisabled = value as TriState; pgSaveDisabledOn = true; }, toggle: snippetToggle(pgSaveDisabledOn, enabled => (pgSaveDisabledOn = enabled)), sync: { kind: 'tri' } },
    { name: 'saveLabel', type: 'string', defaultValue: '—', note: 'Save button text; the eye stages the customization.', editor: 'text', clearable: true, value: pgSaveLabel, onChange: value => { pgSaveLabel = value; pgSaveLabelOn = true; }, toggle: snippetToggle(pgSaveLabelOn, enabled => (pgSaveLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both width and height; an explicit variant wins; the eye stages the customization.', editor: 'enum', options: sizeOptions, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'text' } },
    { name: 'title', type: 'string?', defaultValue: '—', note: 'Dialog heading; the eye stages the customization.', editor: 'text', clearable: true, value: pgTitle, onChange: value => { pgTitle = value; pgTitleOn = true; }, toggle: snippetToggle(pgTitleOn, enabled => (pgTitleOn = enabled)), sync: { kind: 'text' } },
    { name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant; the eye stages the customization.', editor: 'enum', options: widthVariantOptions, value: pgWidthVariant, onChange: value => { pgWidthVariant = value; pgWidthVariantOn = true; }, placeholder: 'md', clearLabel: 'Clear width', toggle: snippetToggle(pgWidthVariantOn, enabled => (pgWidthVariantOn = enabled)), sync: { kind: 'text' } },
    { name: 'onClose', type: '() => void', defaultValue: '—', note: 'Final close (direct when clean, after discard confirm).' },
    { name: 'onReset', type: '() => void', defaultValue: '—', note: 'Reset handler.' },
    { name: 'onSave', type: '() => void', defaultValue: '—', note: 'Save handler.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

</script>

{#snippet demoActions()}
  <Button variant="outline" type="button" disabled={!demoDraftValid} onClick={formatDemoDraft}>{demoActionsLabel}</Button>
{/snippet}

{#snippet dialogHeader()}
  <Copyable text={headerContent.text}><span>{headerContent.inner}</span></Copyable>
{/snippet}

<ShowcasePage
    {fields}
    title="EditDialog"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{
      open: pgOpen,
      draft: pgDraft,
      saved: pgSaved,
      openDialogLabel: i18n.t('showcase.openDialog'),
      dialogTitle: i18n.t('showcase.dialogTitle'),
      closeLabel: i18n.t('common.close'),
      okLabel: i18n.t('common.ok'),
      resetLabel: i18n.t('common.reset'),
      discardTitle: i18n.t('showcase.discardTitle'),
      discardMessage: i18n.t('showcase.discardMessage'),
      discardLabel: i18n.t('showcase.discard'),
    }}
>
    <Button variant="primary" onClick={() => (pgOpen = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if pgOpen}
      <EditDialog
        title={demoTitle}
        header={pgHeaderOn ? dialogHeader : undefined}
        widthVariant={demoWidthVariant}
        heightVariant={demoHeightVariant}
        size={demoSize}
        closeLabel={demoCloseLabel}
        saveLabel={demoSaveLabel}
        resetLabel={demoResetLabel}
        discardTitle={demoDiscardTitle}
        discardMessage={demoDiscardMessage}
        discardLabel={demoDiscardLabel}
        {dirty}
        {pending}
        {saveDisabled}
        actions={pgActionsOn ? demoActions : undefined}
        onSave={handleSave}
        onReset={() => (pgDraft = pgSaved)}
        onClose={() => (pgOpen = false)}>
        {#if pgChildrenOn}
          {#each demoBodyChildren as segment}
            {#if segment.kind === 'textinput'}
              <TextInput
                bind:value={pgDraft}
                type={segment.type || undefined}
                ariaLabel={segment.ariaLabel === null
                  ? undefined
                  : segment.ariaLabel.kind === 'scope'
                    ? demoBodyLabel
                    : segment.ariaLabel.value} />
            {:else}
              {@html segment.html}
            {/if}
          {/each}
        {/if}
      </EditDialog>
    {/if}
  </ShowcasePage>
