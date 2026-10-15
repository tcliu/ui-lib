<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte'
  import { DIALOG_SIZE_VARIANTS } from '$lib/components/BaseDialog.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle } from '$lib/showcase/snippet-field'
  import { buildConfirmDialogSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgOpen`/`pgResult` are interaction state, not curated options.
  let pgOpen = $state(false)
  let pgResult = $state('idle')
  let pgWidthVariant = $state('md')
  let pgWidthVariantOn = $state(false)
  let pgHeightVariant = $state('auto')
  let pgHeightVariantOn = $state(false)
  let pgSize = $state('')
  let pgSizeOn = $state(false)
  let pgAccent = $state('rose')
  let pgAccentOn = $state(false)
  let pgPending = $state<TriState>('no')
  let pgPendingOn = $state(false)
  let pgConfirmOnDismiss = $state<TriState>('no')
  let pgConfirmOnDismissOn = $state(false)
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)
  let pgCloseLabel = $state('')
  let pgCloseLabelOn = $state(false)
  let pgConfirmLabel = $state('')
  let pgConfirmLabelOn = $state(false)
  let pgMessage = $state('')
  let pgMessageOn = $state(false)
  let pgTitle = $state('')
  let pgTitleOn = $state(false)
  let pgButtonSize = $state('md')
  let pgButtonSizeOn = $state(false)

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
  const demoAccent = $derived(
    pgAccentOn
      ? ((pgAccent || undefined) as 'rose' | 'amber' | 'emerald' | 'cyan' | undefined)
      : undefined,
  )
  const pending = $derived(pgPendingOn ? flagOn(pgPending) : undefined)
  const confirmOnDismiss = $derived(pgConfirmOnDismissOn ? flagOn(pgConfirmOnDismiss) : undefined)
  // Unset, each label renders the localized default (matching the seed's
  // scope refs); set text overrides it in both demo and seed.
  const demoTitle = $derived(pgTitleOn && pgTitle ? pgTitle : i18n.t('showcase.discardTitle'))
  const demoMessage = $derived(pgMessageOn && pgMessage ? pgMessage : i18n.t('showcase.discardMessage'))
  const demoConfirmLabel = $derived(pgConfirmLabelOn && pgConfirmLabel ? pgConfirmLabel : i18n.t('showcase.discard'))
  const demoCloseLabel = $derived(pgCloseLabelOn && pgCloseLabel ? pgCloseLabel : i18n.t('common.close'))
  const demoClassName = $derived(pgClassNameOn && pgClassName ? pgClassName : undefined)
  const demoButtonSize = $derived(pgButtonSizeOn ? parseSizeValue(pgButtonSize) : undefined)

  const widthVariantOptions = [...DIALOG_SIZE_VARIANTS, 'fit', 'wide'].map(value => ({ value, label: value }))
  const heightVariantOptions = ['auto', ...DIALOG_SIZE_VARIANTS].map(value => ({ value, label: value }))
  const sizeOptions = DIALOG_SIZE_VARIANTS.map(value => ({ value, label: value }))
  const accentOptions = ['cyan', 'emerald', 'amber', 'violet', 'rose'].map(value => ({ value, label: value }))

  function clearPlayground() {
    pgOpen = false
    pgResult = 'idle'
    pgWidthVariant = 'md'
    pgWidthVariantOn = false
    pgHeightVariant = 'auto'
    pgHeightVariantOn = false
    pgSize = ''
    pgSizeOn = false
    pgAccent = 'rose'
    pgAccentOn = false
    pgPending = 'no'
    pgPendingOn = false
    pgConfirmOnDismiss = 'no'
    pgConfirmOnDismissOn = false
    pgClassName = ''
    pgClassNameOn = false
    pgCloseLabel = ''
    pgCloseLabelOn = false
    pgConfirmLabel = ''
    pgConfirmLabelOn = false
    pgMessage = ''
    pgMessageOn = false
    pgTitle = ''
    pgTitleOn = false
    pgButtonSize = 'md'
    pgButtonSizeOn = false
  }

  const code = $derived.by(() =>
    buildConfirmDialogSnippet({
      widthVariant: pgWidthVariant,
      widthVariantOn: pgWidthVariantOn,
      heightVariant: pgHeightVariant,
      heightVariantOn: pgHeightVariantOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      accent: pgAccent,
      accentOn: pgAccentOn,
      pending: pgPending,
      pendingOn: pgPendingOn,
      confirmOnDismiss: pgConfirmOnDismiss,
      confirmOnDismissOn: pgConfirmOnDismissOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      closeLabel: pgCloseLabel,
      closeLabelOn: pgCloseLabelOn,
      confirmLabel: pgConfirmLabel,
      confirmLabelOn: pgConfirmLabelOn,
      message: pgMessage,
      messageOn: pgMessageOn,
      title: pgTitle,
      titleOn: pgTitleOn,
      buttonSize: pgButtonSize,
      buttonSizeOn: pgButtonSizeOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      open: pgOpen,
      result: pgResult,
      openLabel: i18n.t('showcase.delete'),
      discardTitle: i18n.t('showcase.discardTitle'),
      discardMessage: i18n.t('showcase.discardMessage'),
      discardLabel: i18n.t('showcase.discard'),
      closeLabel: i18n.t('common.close'),
    }),
    sync: { tag: 'ConfirmDialog', getFields: () => syncFields },
  })

  const fields: SyncableFieldConfig[] = $derived([
    { name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'rose'", note: 'Confirm button accent; the eye stages the customization.', editor: 'enum', options: accentOptions, value: pgAccent, onChange: value => { pgAccent = value; pgAccentOn = true; }, placeholder: 'rose', clearLabel: 'Clear accent', toggle: snippetToggle(pgAccentOn, enabled => (pgAccentOn = enabled)), sync: { kind: 'text' } },
    { name: 'buttonSize', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Confirm button scale; numbers are icon-scale pixels interpolated between the steps; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgButtonSize, onChange: value => { pgButtonSize = value; pgButtonSizeOn = true; }, placeholder: 'md', clearLabel: 'Clear button size', toggle: snippetToggle(pgButtonSizeOn, enabled => (pgButtonSizeOn = enabled)), sync: { kind: 'custom', read: attrs => { const attr = attrs?.get('buttonSize'); if (!attr) return 'md'; if (attr.kind === 'string') return attr.value; if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value; return undefined } } },
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the dialog panel; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'closeLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the dismiss affordances; the eye stages the customization.', editor: 'text', clearable: true, value: pgCloseLabel, onChange: value => { pgCloseLabel = value; pgCloseLabelOn = true; }, toggle: snippetToggle(pgCloseLabelOn, enabled => (pgCloseLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'confirmLabel', type: 'string', defaultValue: '—', note: 'Confirm button text; the eye stages the customization.', editor: 'text', clearable: true, value: pgConfirmLabel, onChange: value => { pgConfirmLabel = value; pgConfirmLabelOn = true; }, toggle: snippetToggle(pgConfirmLabelOn, enabled => (pgConfirmLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'confirmOnDismiss', type: 'boolean', defaultValue: 'false', note: 'Routes Escape, overlay click, and the close icon to onConfirm instead of onCancel; the eye stages the customization.', editor: 'boolean', value: pgConfirmOnDismiss, onChange: value => { pgConfirmOnDismiss = value as TriState; pgConfirmOnDismissOn = true; }, toggle: snippetToggle(pgConfirmOnDismissOn, enabled => (pgConfirmOnDismissOn = enabled)), sync: { kind: 'tri' } },
    { name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content; the eye stages the customization.', editor: 'enum', options: heightVariantOptions, value: pgHeightVariant, onChange: value => { pgHeightVariant = value; pgHeightVariantOn = true; }, placeholder: 'auto', clearLabel: 'Clear height', toggle: snippetToggle(pgHeightVariantOn, enabled => (pgHeightVariantOn = enabled)), sync: { kind: 'text' } },
    { name: 'message', type: 'string', defaultValue: '—', note: 'Body copy explaining the action; the eye stages the customization.', editor: 'text', clearable: true, value: pgMessage, onChange: value => { pgMessage = value; pgMessageOn = true; }, toggle: snippetToggle(pgMessageOn, enabled => (pgMessageOn = enabled)), sync: { kind: 'text' } },
    { name: 'pending', type: 'boolean', defaultValue: 'false', note: 'Disables dismissal and marks the confirm button pending; the eye stages the customization.', editor: 'boolean', value: pgPending, onChange: value => { pgPending = value as TriState; pgPendingOn = true; }, toggle: snippetToggle(pgPendingOn, enabled => (pgPendingOn = enabled)), sync: { kind: 'tri' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both panel width and height; an explicit variant wins; the eye stages the customization.', editor: 'enum', options: sizeOptions, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'text' } },
    { name: 'title', type: 'string', defaultValue: '—', note: 'Dialog heading; the eye stages the customization.', editor: 'text', clearable: true, value: pgTitle, onChange: value => { pgTitle = value; pgTitleOn = true; }, toggle: snippetToggle(pgTitleOn, enabled => (pgTitleOn = enabled)), sync: { kind: 'text' } },
    { name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant; the eye stages the customization.', editor: 'enum', options: widthVariantOptions, value: pgWidthVariant, onChange: value => { pgWidthVariant = value; pgWidthVariantOn = true; }, placeholder: 'md', clearLabel: 'Clear width', toggle: snippetToggle(pgWidthVariantOn, enabled => (pgWidthVariantOn = enabled)), sync: { kind: 'text' } },
    { name: 'onCancel', type: '() => void', defaultValue: 'onConfirm', note: 'Dismiss handler; falls back to onConfirm when omitted.' },
    { name: 'onConfirm', type: '() => void', defaultValue: '—', note: 'Confirm handler.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

</script>

<ShowcasePage
    {fields}
    title="ConfirmDialog"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{
      open: pgOpen,
      result: pgResult,
      openLabel: i18n.t('showcase.delete'),
      discardTitle: i18n.t('showcase.discardTitle'),
      discardMessage: i18n.t('showcase.discardMessage'),
      discardLabel: i18n.t('showcase.discard'),
      closeLabel: i18n.t('common.close'),
    }}
>
    <Button variant="primary" accent="rose" onClick={() => (pgOpen = true)}>{i18n.t('showcase.delete')}</Button>
    {#if pgOpen}
      <ConfirmDialog
        title={demoTitle}
        message={demoMessage}
        confirmLabel={demoConfirmLabel}
        closeLabel={demoCloseLabel}
        className={demoClassName}
        widthVariant={demoWidthVariant}
        heightVariant={demoHeightVariant}
        size={demoSize}
        accent={demoAccent}
        {pending}
        buttonSize={demoButtonSize}
        {confirmOnDismiss}
        onConfirm={() => {
          pgResult = 'confirmed'
          pgOpen = false
        }}
        onCancel={() => {
          pgResult = 'cancelled'
          pgOpen = false
        }} />
    {/if}
    <p class="text-sm text-slate-400">result: {pgResult}</p>
  </ShowcasePage>
