<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Copyable from '$lib/components/Copyable.svelte'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { DIALOG_SIZE_VARIANTS } from '$lib/components/BaseDialog.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { type TriState } from '$showcase/playground/snippet-build'
  import { enumField, textField, boolField, snippetDialog, snippetField } from '$showcase/playground/snippet-field'
  import { applied, appliedFlag, eye, eyeFlag, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { buildHeaderLine, parseHeaderMarkup } from '$showcase/playground/snippet-header'
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
    widthVariant: staged('md'),
    heightVariant: staged('auto'),
    size: staged(''),
    dirty: staged('no' as TriState),
    confirmOnDismiss: staged('no' as TriState),
    pending: staged('no' as TriState),
    saveDisabled: staged('no' as TriState),
    closeLabel: staged(''),
    discardLabel: staged(''),
    discardMessage: staged(''),
    discardTitle: staged(''),
    resetLabel: staged(''),
    saveLabel: staged(''),
    title: staged(''),
    header: staged(''),
    children: staged('', true),
    actions: staged(''),
    footer: staged(''),
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
    (applied(pg.widthVariant) || undefined) as
      | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'fit' | 'wide'
      | undefined,
  )
  const demoHeightVariant = $derived(
    (applied(pg.heightVariant) || undefined) as 'auto' | (typeof DIALOG_SIZE_VARIANTS)[number] | undefined,
  )
  const demoSize = $derived(
    (applied(pg.size) || undefined) as (typeof DIALOG_SIZE_VARIANTS)[number] | undefined,
  )
  const dirty = $derived(appliedFlag(pg.dirty) ?? false)
  const confirmOnDismiss = $derived(appliedFlag(pg.confirmOnDismiss))
  const pending = $derived(appliedFlag(pg.pending))
  const saveDisabled = $derived(appliedFlag(pg.saveDisabled))
  const demoTitle = $derived(applied(pg.title) || i18n.t('showcase.dialogTitle'))
  // Canonical header markup resolved from the title, matching the row seed
  // while unset.
  const canonicalHeader = $derived(buildHeaderLine({ text: demoTitle, inner: demoTitle }))
  const headerMarkup = $derived(pg.header.value || canonicalHeader)
  const headerContent = $derived(parseHeaderMarkup(pg.header.value) ?? { text: demoTitle, inner: demoTitle })
  const demoCloseLabel = $derived(applied(pg.closeLabel) || i18n.t('common.close'))
  const demoSaveLabel = $derived(applied(pg.saveLabel) || i18n.t('common.ok'))
  const demoResetLabel = $derived(applied(pg.resetLabel) || i18n.t('common.reset'))
  const demoDiscardTitle = $derived(applied(pg.discardTitle) || i18n.t('showcase.discardTitle'))
  const demoDiscardMessage = $derived(applied(pg.discardMessage) || i18n.t('showcase.discardMessage'))
  const demoDiscardLabel = $derived(applied(pg.discardLabel) || i18n.t('showcase.discard'))
  const demoBodyLabel = $derived(i18n.t('showcase.dialogTitle'))
  // Custom markup renders as committed; unset, the canonical TextInput binds
  // the draft with the dialog title as its name. Stored drafts are always
  // valid, so the fallback only covers the empty state.
  const demoBodyChildren = $derived<EditBodySegment[]>(
    parseEditBodySegments(pg.children.value || buildEditBodyMarkup({ type: '', label: '' })) ?? [
      { kind: 'textinput', type: 'text', ariaLabel: { kind: 'scope' } },
    ],
  )
  // Committed actions markup is always valid, so the label resolves; the
  // fallback only covers direct calls with unvalidated text.
  const demoActionsLabel = $derived(
    parseEditActionsLabel(pg.actions.value || buildEditActionsMarkup({ label: '' })) ?? 'Format',
  )
  // The footer row replaces the built-in save/reset row with the caller's own
  // action row; the committed line carries the label only.
  const demoFooterLabel = $derived(pg.footer.on ? (parseEditFooterLabel(pg.footer.value) ?? 'Save') : null)
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
  const bodySnippet = $derived(pg.children.value || buildEditBodyMarkup({ type: '', label: '' }))

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
      heightVariant: pg.heightVariant,
      size: pg.size,
      dirty: pg.dirty,
      confirmOnDismiss: pg.confirmOnDismiss,
      pending: pg.pending,
      saveDisabled: pg.saveDisabled,
      children: pg.children,
      actions: pg.actions,
      footer: pg.footer,
      closeLabel: pg.closeLabel,
      discardLabel: pg.discardLabel,
      discardMessage: pg.discardMessage,
      discardTitle: pg.discardTitle,
      resetLabel: pg.resetLabel,
      saveLabel: pg.saveLabel,
      title: pg.title,
      header: pg.header,
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
      value: pg.actions.value || buildEditActionsMarkup({ label: '' }),
      onChange: (draft: string) => {
        if (!parseEditActionsMarkup(draft)) return
        const normalized = normalizeEditActionsDraft(draft)
        stage(pg.actions, normalized === buildEditActionsMarkup({ label: '' }) ? '' : normalized)
      },
      dialog: snippetDialog(
        parseEditActionsMarkup,
        'Use a single <Button variant="outline" type="button">Label</Button> line.',
      ),
      toggle: eyeToggle(pg.actions),
    }),
    snippetField({
      name: 'footer',
      note: 'Replaces the built-in save/reset row; one submit Button line, committing applies it.',
      value: pg.footer.value || buildEditFooterMarkup({ label: '' }),
      onChange: (draft: string) => {
        if (!parseEditFooterMarkup(draft)) return
        const normalized = normalizeEditActionsDraft(draft)
        stage(pg.footer, normalized === buildEditFooterMarkup({ label: '' }) ? '' : normalized)
      },
      dialog: snippetDialog(
        parseEditFooterMarkup,
        'Use a single <Button variant="primary" type="submit">Label</Button> line.',
      ),
      toggle: eyeToggle(pg.footer),
    }),
    snippetField({
      name: 'children',
      note: 'Form body; TextInput lines and HTML elements, committing applies it.',
      value: bodySnippet,
      onChange: (draft: string) => {
        if (!parseEditBodyMarkup(draft)) return
        const normalized = normalizeEditBodyDraft(draft)
        stage(pg.children, normalized === buildEditBodyMarkup({ type: '', label: '' }) ? '' : normalized)
      },
      dialog: snippetDialog(
        parseEditBodyMarkup,
        'Use <TextInput bind:value={draft} … /> lines and well-formed HTML elements only — no {…} expressions, components, or event handlers.',
      ),
      toggle: eyeToggle(pg.children),
    }),
    textField({ name: 'closeLabel', type: 'string', defaultValue: '—', note: 'Accessible name for dismissals.', clearable: true, ...eye(pg.closeLabel) }),
    boolField({ name: 'confirmOnDismiss', defaultValue: 'false', note: 'Makes the discard confirm’s dismissal perform the discard; off returns to the form.', ...eyeFlag(pg.confirmOnDismiss) }),
    boolField({ name: 'dirty', defaultValue: 'false', note: 'Gates the discard prompt and Reset.', ...eyeFlag(pg.dirty) }),
    textField({ name: 'discardLabel', type: 'string', defaultValue: '—', note: 'Discard-confirm button text.', clearable: true, ...eye(pg.discardLabel) }),
    textField({ name: 'discardMessage', type: 'string', defaultValue: '—', note: 'Discard-confirm body.', clearable: true, ...eye(pg.discardMessage) }),
    textField({ name: 'discardTitle', type: 'string', defaultValue: '—', note: 'Discard-confirm title.', clearable: true, ...eye(pg.discardTitle) }),
    snippetField({
      name: 'header',
      note: 'Copyable title heading; one Copyable line, committing applies it. The plain title keeps rendering while off.',
      value: headerMarkup,
      onChange: (draft: string) => {
        const parsed = parseHeaderMarkup(draft)
        if (!parsed) return
        const normalized = buildHeaderLine(parsed)
        stage(pg.header, normalized === canonicalHeader ? '' : normalized)
      },
      dialog: snippetDialog(
        parseHeaderMarkup,
        'Use a single <Copyable text="…"><span>…</span></Copyable> line with non-blank text and label.',
      ),
      toggle: eyeToggle(pg.header),
    }),
    enumField({ name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content.', options: heightVariantOptions, placeholder: 'auto', clearLabel: 'Clear height', ...eye(pg.heightVariant) }),
    boolField({ name: 'pending', defaultValue: 'false', note: 'Disables Save/Reset while an operation runs.', ...eyeFlag(pg.pending) }),
    textField({ name: 'resetLabel', type: 'string?', defaultValue: '—', note: 'Reset button text; omit it to hide the button.', clearable: true, ...eye(pg.resetLabel) }),
    boolField({ name: 'saveDisabled', defaultValue: 'false', note: 'Caller validity rules; ORed with pending.', ...eyeFlag(pg.saveDisabled) }),
    textField({ name: 'saveLabel', type: 'string', defaultValue: '—', note: 'Save button text.', clearable: true, ...eye(pg.saveLabel) }),
    enumField({ name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both width and height; an explicit variant wins.', options: sizeOptions, clearLabel: 'Clear size', ...eye(pg.size) }),
    textField({ name: 'title', type: 'string?', defaultValue: '—', note: 'Dialog heading.', clearable: true, ...eye(pg.title) }),
    enumField({ name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.', options: widthVariantOptions, placeholder: 'md', clearLabel: 'Clear width', ...eye(pg.widthVariant) }),
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
        header={pg.header.on ? dialogHeader : undefined}
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
        actions={pg.actions.on ? demoActions : undefined}
        footer={pg.footer.on ? demoFooter : undefined}
        onSave={handleSave}
        onReset={() => (pg.draft = pg.saved)}
        onClose={() => (pg.open = false)}
        children={pg.children.on ? dialogChildren : undefined}>
      </FormDialog>
    {/if}
  </ShowcasePage>
