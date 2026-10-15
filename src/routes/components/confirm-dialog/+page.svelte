<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import Button from '$lib/components/Button.svelte'
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte'
  import { DIALOG_SIZE_VARIANTS } from '$lib/components/BaseDialog.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, snippetToggle } from '$lib/showcase/snippet-field'
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

  
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'rose'", note: 'Confirm button accent.', options: accentOptions, value: pgAccent, onChange: v => (pgAccent = v), placeholder: 'rose', clearLabel: 'Clear accent', enabled: pgAccentOn, setEnabled: v => (pgAccentOn = v) }),
    sizeField({ note: 'Confirm button scale; numbers are icon-scale pixels interpolated between the steps.', value: pgButtonSize, onChange: v => (pgButtonSize = v), enabled: pgButtonSizeOn, setEnabled: v => (pgButtonSizeOn = v), name: 'buttonSize', clearLabel: 'Clear button size' }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the dialog panel.', value: pgClassName, onChange: v => (pgClassName = v), editorDefaultValue: '', clearable: true, enabled: pgClassNameOn, setEnabled: v => (pgClassNameOn = v) }),
    textField({ name: 'closeLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the dismiss affordances.', value: pgCloseLabel, onChange: v => (pgCloseLabel = v), clearable: true, enabled: pgCloseLabelOn, setEnabled: v => (pgCloseLabelOn = v) }),
    textField({ name: 'confirmLabel', type: 'string', defaultValue: '—', note: 'Confirm button text.', value: pgConfirmLabel, onChange: v => (pgConfirmLabel = v), clearable: true, enabled: pgConfirmLabelOn, setEnabled: v => (pgConfirmLabelOn = v) }),
    boolField({ name: 'confirmOnDismiss', defaultValue: 'false', note: 'Routes Escape, overlay click, and the close icon to onConfirm instead of onCancel.', value: pgConfirmOnDismiss, onChange: v => (pgConfirmOnDismiss = v as TriState), enabled: pgConfirmOnDismissOn, setEnabled: v => (pgConfirmOnDismissOn = v) }),
    enumField({ name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content.', options: heightVariantOptions, value: pgHeightVariant, onChange: v => (pgHeightVariant = v), placeholder: 'auto', clearLabel: 'Clear height', enabled: pgHeightVariantOn, setEnabled: v => (pgHeightVariantOn = v) }),
    textField({ name: 'message', type: 'string', defaultValue: '—', note: 'Body copy explaining the action.', value: pgMessage, onChange: v => (pgMessage = v), clearable: true, enabled: pgMessageOn, setEnabled: v => (pgMessageOn = v) }),
    boolField({ name: 'pending', defaultValue: 'false', note: 'Disables dismissal and marks the confirm button pending.', value: pgPending, onChange: v => (pgPending = v as TriState), enabled: pgPendingOn, setEnabled: v => (pgPendingOn = v) }),
    enumField({ name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both panel width and height; an explicit variant wins.', options: sizeOptions, value: pgSize, onChange: v => (pgSize = v), clearLabel: 'Clear size', enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    textField({ name: 'title', type: 'string', defaultValue: '—', note: 'Dialog heading.', value: pgTitle, onChange: v => (pgTitle = v), clearable: true, enabled: pgTitleOn, setEnabled: v => (pgTitleOn = v) }),
    enumField({ name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.', options: widthVariantOptions, value: pgWidthVariant, onChange: v => (pgWidthVariant = v), placeholder: 'md', clearLabel: 'Clear width', enabled: pgWidthVariantOn, setEnabled: v => (pgWidthVariantOn = v) }),
    { name: 'onCancel', type: '() => void', defaultValue: 'onConfirm', note: 'Dismiss handler; falls back to onConfirm when omitted.' },
    { name: 'onConfirm', type: '() => void', defaultValue: '—', note: 'Confirm handler.' },
  ])


</script>

<ShowcasePage
    {fields}
    title="ConfirmDialog"
    {code}
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

    sync={{ tag: 'ConfirmDialog' }}
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
