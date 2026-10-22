<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import Button from '$lib/components/Button.svelte'
  import Copyable from '$lib/components/Copyable.svelte'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { DIALOG_SIZE_VARIANTS } from '$lib/components/BaseDialog.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, boolField, snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildHeaderLine, parseHeaderMarkup } from '$lib/showcase/snippet-header'
  import {
    buildEditActionsMarkup,
    buildEditBodyMarkup,
    buildEditFooterMarkup,
    buildFormDialogSnippet,
    normalizeEditActionsDraft,
    normalizeEditBodyDraft,
    parseEditActionsLabel,
    parseEditActionsMarkup,
    parseEditBodyMarkup,
    parseEditBodySegments,
    parseEditFooterLabel,
    parseEditFooterMarkup,
    type EditBodySegment,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgOpen`/`pgDraft`/`pgSaved` are interaction state, not curated options.
  const INITIAL = {
    open: false,
    draft: 'Editable text',
    saved: 'Editable text',
    widthVariant: 'md',
    widthVariantOn: false,
    heightVariant: 'auto',
    heightVariantOn: false,
    size: '',
    sizeOn: false,
    dirty: 'no' as TriState,
    dirtyOn: false,
    confirmOnDismiss: 'no' as TriState,
    confirmOnDismissOn: false,
    pending: 'no' as TriState,
    pendingOn: false,
    saveDisabled: 'no' as TriState,
    saveDisabledOn: false,
    closeLabel: '',
    closeLabelOn: false,
    discardLabel: '',
    discardLabelOn: false,
    discardMessage: '',
    discardMessageOn: false,
    discardTitle: '',
    discardTitleOn: false,
    resetLabel: '',
    resetLabelOn: false,
    saveLabel: '',
    saveLabelOn: false,
    title: '',
    titleOn: false,
    header: '',
    headerOn: false,
    children: '',
    childrenOn: true,
    actions: '',
    actionsOn: false,
    footer: '',
    footerOn: false,
  }
  let pg = $state(structuredClone(INITIAL))
  // Unset, each label renders the localized default (matching the seed's
  // scope refs); set text overrides it in both demo and seed.
  // The header row edits the Copyable title the dialog heading renders (demo
  // data, so it has no single prop); committing the canonical shape resets to
  // unset, so defaults keep flowing from the title.
  // The body edits as TextInput/HTML lines and applies only while its eye is
  // on; raw markup while customized, empty for the canonical TextInput.
  // The actions snippet applies only while its eye is on; raw markup while
  // customized, empty for the canonical Format button.

  const demoWidthVariant = $derived(
    pg.widthVariantOn
      ? ((pg.widthVariant || undefined) as
        | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'fit' | 'wide'
        | undefined)
      : undefined,
  )
  const demoHeightVariant = $derived(
    pg.heightVariantOn
      ? ((pg.heightVariant || undefined) as 'auto' | (typeof DIALOG_SIZE_VARIANTS)[number] | undefined)
      : undefined,
  )
  const demoSize = $derived(
    pg.sizeOn ? ((pg.size || undefined) as (typeof DIALOG_SIZE_VARIANTS)[number] | undefined) : undefined,
  )
  const dirty = $derived(pg.dirtyOn ? (flagOn(pg.dirty) ?? false) : false)
  const confirmOnDismiss = $derived(pg.confirmOnDismissOn ? flagOn(pg.confirmOnDismiss) : undefined)
  const pending = $derived(pg.pendingOn ? flagOn(pg.pending) : undefined)
  const saveDisabled = $derived(pg.saveDisabledOn ? flagOn(pg.saveDisabled) : undefined)
  const demoTitle = $derived(pg.titleOn && pg.title ? pg.title : i18n.t('showcase.dialogTitle'))
  // Canonical header markup resolved from the title, matching the row seed
  // while unset.
  const canonicalHeader = $derived(buildHeaderLine({ text: demoTitle, inner: demoTitle }))
  const headerMarkup = $derived(pg.header || canonicalHeader)
  const headerContent = $derived(parseHeaderMarkup(pg.header) ?? { text: demoTitle, inner: demoTitle })
  const demoCloseLabel = $derived(pg.closeLabelOn && pg.closeLabel ? pg.closeLabel : i18n.t('common.close'))
  const demoSaveLabel = $derived(pg.saveLabelOn && pg.saveLabel ? pg.saveLabel : i18n.t('common.ok'))
  const demoResetLabel = $derived(pg.resetLabelOn && pg.resetLabel ? pg.resetLabel : i18n.t('common.reset'))
  const demoDiscardTitle = $derived(pg.discardTitleOn && pg.discardTitle ? pg.discardTitle : i18n.t('showcase.discardTitle'))
  const demoDiscardMessage = $derived(pg.discardMessageOn && pg.discardMessage ? pg.discardMessage : i18n.t('showcase.discardMessage'))
  const demoDiscardLabel = $derived(pg.discardLabelOn && pg.discardLabel ? pg.discardLabel : i18n.t('showcase.discard'))
  const demoBodyLabel = $derived(i18n.t('showcase.dialogTitle'))
  // Custom markup renders as committed; unset, the canonical TextInput binds
  // the draft with the dialog title as its name. Stored drafts are always
  // valid, so the fallback only covers the empty state.
  const demoBodyChildren = $derived<EditBodySegment[]>(
    parseEditBodySegments(pg.children || buildEditBodyMarkup({ type: '', label: '' })) ?? [
      { kind: 'textinput', type: 'text', ariaLabel: { kind: 'scope' } },
    ],
  )
  // Committed actions markup is always valid, so the label resolves; the
  // fallback only covers direct calls with unvalidated text.
  const demoActionsLabel = $derived(
    parseEditActionsLabel(pg.actions || buildEditActionsMarkup({ label: '' })) ?? 'Format',
  )
  // The footer row replaces the built-in save/reset row with the caller's own
  // action row; the committed line carries the label only.
  const demoFooterLabel = $derived(pg.footerOn ? (parseEditFooterLabel(pg.footer) ?? 'Save') : null)
  const demoDraftValid = $derived.by(() => {
    try {
      JSON.parse(pg.draft)
      return true
    } catch {
      return false
    }
  })

  function formatDemoDraft() {
    try {
      pg.draft = JSON.stringify(JSON.parse(pg.draft), null, 2)
    } catch {
      // Unreachable while the button is enabled; never half-applies.
    }
  }
  // The children row edits the form body (demo data, so it has no single
  // prop). Committing the canonical TextInput resets to unset.
  const bodySnippet = $derived(pg.children || buildEditBodyMarkup({ type: '', label: '' }))

  const widthVariantOptions = [...DIALOG_SIZE_VARIANTS, 'fit', 'wide'].map(value => ({ value, label: value }))
  const heightVariantOptions = ['auto', ...DIALOG_SIZE_VARIANTS].map(value => ({ value, label: value }))
  const sizeOptions = DIALOG_SIZE_VARIANTS.map(value => ({ value, label: value }))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  function handleSave() {
    pg.saved = pg.draft
    pg.open = false
  }

  const code = $derived.by(() =>
    buildFormDialogSnippet({
      widthVariant: pg.widthVariant,
      widthVariantOn: pg.widthVariantOn,
      heightVariant: pg.heightVariant,
      heightVariantOn: pg.heightVariantOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      dirty: pg.dirty,
      dirtyOn: pg.dirtyOn,
      confirmOnDismiss: pg.confirmOnDismiss,
      confirmOnDismissOn: pg.confirmOnDismissOn,
      pending: pg.pending,
      pendingOn: pg.pendingOn,
      saveDisabled: pg.saveDisabled,
      saveDisabledOn: pg.saveDisabledOn,
      children: pg.children,
      childrenEnabled: pg.childrenOn,
      actions: pg.actions,
      actionsEnabled: pg.actionsOn,
      footer: pg.footer,
      footerEnabled: pg.footerOn,
      closeLabel: pg.closeLabel,
      closeLabelOn: pg.closeLabelOn,
      discardLabel: pg.discardLabel,
      discardLabelOn: pg.discardLabelOn,
      discardMessage: pg.discardMessage,
      discardMessageOn: pg.discardMessageOn,
      discardTitle: pg.discardTitle,
      discardTitleOn: pg.discardTitleOn,
      resetLabel: pg.resetLabel,
      resetLabelOn: pg.resetLabelOn,
      saveLabel: pg.saveLabel,
      saveLabelOn: pg.saveLabelOn,
      title: pg.title,
      titleOn: pg.titleOn,
      header: pg.header,
      headerOn: pg.headerOn,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text.
  const fields: SyncableFieldConfig[] = $derived([
    snippetField({
      name: 'actions',
      note: 'Extra footer buttons before OK; one outline Button line, committing applies it.',
      value: pg.actions || buildEditActionsMarkup({ label: '' }),
      onChange: (draft: string) => {
        if (!parseEditActionsMarkup(draft)) return
        const normalized = normalizeEditActionsDraft(draft)
        pg.actions = normalized === buildEditActionsMarkup({ label: '' }) ? '' : normalized
        pg.actionsOn = true
      },
      dialog: snippetDialog(
        parseEditActionsMarkup,
        'Use a single <Button variant="outline" type="button">Label</Button> line.',
      ),
      toggle: snippetToggle(pg.actionsOn, enabled => (pg.actionsOn = enabled)),
    }),
    snippetField({
      name: 'footer',
      note: 'Replaces the built-in save/reset row; one submit Button line, committing applies it.',
      value: pg.footer || buildEditFooterMarkup({ label: '' }),
      onChange: (draft: string) => {
        if (!parseEditFooterMarkup(draft)) return
        const normalized = normalizeEditActionsDraft(draft)
        pg.footer = normalized === buildEditFooterMarkup({ label: '' }) ? '' : normalized
        pg.footerOn = true
      },
      dialog: snippetDialog(
        parseEditFooterMarkup,
        'Use a single <Button variant="primary" type="submit">Label</Button> line.',
      ),
      toggle: snippetToggle(pg.footerOn, enabled => (pg.footerOn = enabled)),
    }),
    snippetField({
      name: 'children',
      note: 'Form body; TextInput lines and HTML elements, committing applies it.',
      value: bodySnippet,
      onChange: (draft: string) => {
        if (!parseEditBodyMarkup(draft)) return
        const normalized = normalizeEditBodyDraft(draft)
        pg.children = normalized === buildEditBodyMarkup({ type: '', label: '' }) ? '' : normalized
        pg.childrenOn = true
      },
      dialog: snippetDialog(
        parseEditBodyMarkup,
        'Use <TextInput bind:value={draft} … /> lines and well-formed HTML elements only — no {…} expressions, components, or event handlers.',
      ),
      toggle: snippetToggle(pg.childrenOn, enabled => (pg.childrenOn = enabled)),
    }),
    textField({ name: 'closeLabel', type: 'string', defaultValue: '—', note: 'Accessible name for dismissals.', value: pg.closeLabel, onChange: v => (pg.closeLabel = v), clearable: true, enabled: pg.closeLabelOn, setEnabled: v => (pg.closeLabelOn = v) }),
    boolField({ name: 'confirmOnDismiss', defaultValue: 'false', note: 'Makes the discard confirm’s dismissal perform the discard; off returns to the form.', value: pg.confirmOnDismiss, onChange: v => (pg.confirmOnDismiss = v as TriState), enabled: pg.confirmOnDismissOn, setEnabled: v => (pg.confirmOnDismissOn = v) }),
    boolField({ name: 'dirty', defaultValue: 'false', note: 'Gates the discard prompt and Reset.', value: pg.dirty, onChange: v => (pg.dirty = v as TriState), enabled: pg.dirtyOn, setEnabled: v => (pg.dirtyOn = v) }),
    textField({ name: 'discardLabel', type: 'string', defaultValue: '—', note: 'Discard-confirm button text.', value: pg.discardLabel, onChange: v => (pg.discardLabel = v), clearable: true, enabled: pg.discardLabelOn, setEnabled: v => (pg.discardLabelOn = v) }),
    textField({ name: 'discardMessage', type: 'string', defaultValue: '—', note: 'Discard-confirm body.', value: pg.discardMessage, onChange: v => (pg.discardMessage = v), clearable: true, enabled: pg.discardMessageOn, setEnabled: v => (pg.discardMessageOn = v) }),
    textField({ name: 'discardTitle', type: 'string', defaultValue: '—', note: 'Discard-confirm title.', value: pg.discardTitle, onChange: v => (pg.discardTitle = v), clearable: true, enabled: pg.discardTitleOn, setEnabled: v => (pg.discardTitleOn = v) }),
    snippetField({
      name: 'header',
      note: 'Copyable title heading; one Copyable line, committing applies it. The plain title keeps rendering while off.',
      value: headerMarkup,
      onChange: (draft: string) => {
        const parsed = parseHeaderMarkup(draft)
        if (!parsed) return
        const normalized = buildHeaderLine(parsed)
        pg.header = normalized === canonicalHeader ? '' : normalized
        pg.headerOn = true
      },
      dialog: snippetDialog(
        parseHeaderMarkup,
        'Use a single <Copyable text="…"><span>…</span></Copyable> line with non-blank text and label.',
      ),
      toggle: snippetToggle(pg.headerOn, enabled => (pg.headerOn = enabled)),
    }),
    enumField({ name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content.', options: heightVariantOptions, value: pg.heightVariant, onChange: v => (pg.heightVariant = v), placeholder: 'auto', clearLabel: 'Clear height', enabled: pg.heightVariantOn, setEnabled: v => (pg.heightVariantOn = v) }),
    boolField({ name: 'pending', defaultValue: 'false', note: 'Disables Save/Reset while an operation runs.', value: pg.pending, onChange: v => (pg.pending = v as TriState), enabled: pg.pendingOn, setEnabled: v => (pg.pendingOn = v) }),
    textField({ name: 'resetLabel', type: 'string?', defaultValue: '—', note: 'Reset button text; omit it to hide the button.', value: pg.resetLabel, onChange: v => (pg.resetLabel = v), clearable: true, enabled: pg.resetLabelOn, setEnabled: v => (pg.resetLabelOn = v) }),
    boolField({ name: 'saveDisabled', defaultValue: 'false', note: 'Caller validity rules; ORed with pending.', value: pg.saveDisabled, onChange: v => (pg.saveDisabled = v as TriState), enabled: pg.saveDisabledOn, setEnabled: v => (pg.saveDisabledOn = v) }),
    textField({ name: 'saveLabel', type: 'string', defaultValue: '—', note: 'Save button text.', value: pg.saveLabel, onChange: v => (pg.saveLabel = v), clearable: true, enabled: pg.saveLabelOn, setEnabled: v => (pg.saveLabelOn = v) }),
    enumField({ name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both width and height; an explicit variant wins.', options: sizeOptions, value: pg.size, onChange: v => (pg.size = v), clearLabel: 'Clear size', enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    textField({ name: 'title', type: 'string?', defaultValue: '—', note: 'Dialog heading.', value: pg.title, onChange: v => (pg.title = v), clearable: true, enabled: pg.titleOn, setEnabled: v => (pg.titleOn = v) }),
    enumField({ name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.', options: widthVariantOptions, value: pg.widthVariant, onChange: v => (pg.widthVariant = v), placeholder: 'md', clearLabel: 'Clear width', enabled: pg.widthVariantOn, setEnabled: v => (pg.widthVariantOn = v) }),
    { name: 'onClose', type: '() => void', defaultValue: '—', note: 'Final close (direct when clean, after discard confirm).' },
    { name: 'onReset', type: '() => void', defaultValue: '—', note: 'Reset handler.' },
    { name: 'onSave', type: '() => void', defaultValue: '—', note: 'Save handler.' },
  ])

</script>

{#snippet demoActions()}
  <Button variant="outline" type="button" disabled={!demoDraftValid} onClick={formatDemoDraft}>{demoActionsLabel}</Button>
{/snippet}

{#snippet demoFooter()}
  <Button variant="primary" type="submit">{demoFooterLabel}</Button>
{/snippet}

{#snippet dialogChildren()}
  {#each demoBodyChildren as segment}
    {#if segment.kind === 'textinput'}
      <TextInput
        bind:value={pg.draft}
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
{/snippet}

{#snippet dialogHeader()}
  <Copyable text={headerContent.text}><span>{headerContent.inner}</span></Copyable>
{/snippet}

<ShowcasePage
    {fields}
    title="FormDialog"
    {code}
    onReset={clearPlayground}
    scope={{
      open: pg.open,
      draft: pg.draft,
      saved: pg.saved,
      openDialogLabel: i18n.t('showcase.openDialog'),
      dialogTitle: i18n.t('showcase.dialogTitle'),
      closeLabel: i18n.t('common.close'),
      okLabel: i18n.t('common.ok'),
      resetLabel: i18n.t('common.reset'),
      discardTitle: i18n.t('showcase.discardTitle'),
      discardMessage: i18n.t('showcase.discardMessage'),
      discardLabel: i18n.t('showcase.discard'),
    }}

    sync={{ tag: 'FormDialog' }}
  >
    <Button variant="primary" onClick={() => (pg.open = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if pg.open}
      <FormDialog
        title={demoTitle}
        header={pg.headerOn ? dialogHeader : undefined}
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
        {confirmOnDismiss}
        actions={pg.actionsOn ? demoActions : undefined}
        footer={pg.footerOn ? demoFooter : undefined}
        onSave={handleSave}
        onReset={() => (pg.draft = pg.saved)}
        onClose={() => (pg.open = false)}
        children={pg.childrenOn ? dialogChildren : undefined}>
      </FormDialog>
    {/if}
  </ShowcasePage>
