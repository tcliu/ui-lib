<script lang="ts">
  import { flagOn } from '$showcase/snippet-build'
  import Button from '$lib/components/Button.svelte'
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte'
  import { DIALOG_SIZE_VARIANTS } from '$lib/components/BaseDialog.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField, snippetToggle } from '$showcase/snippet-field'
  import { buildConfirmDialogSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgOpen`/`pgResult` are interaction state, not curated options.
  const INITIAL = {
    open: false,
    result: 'idle',
    widthVariant: 'md',
    widthVariantOn: false,
    heightVariant: 'auto',
    heightVariantOn: false,
    size: '',
    sizeOn: false,
    accent: 'rose',
    accentOn: false,
    pending: 'no' as TriState,
    pendingOn: false,
    confirmOnDismiss: 'no' as TriState,
    confirmOnDismissOn: false,
    className: '',
    classNameOn: false,
    closeLabel: '',
    closeLabelOn: false,
    confirmLabel: '',
    confirmLabelOn: false,
    message: '',
    messageOn: false,
    title: '',
    titleOn: false,
    buttonSize: 'md',
    buttonSizeOn: false,
  }
  let pg = $state(structuredClone(INITIAL))

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
  const demoAccent = $derived(
    pg.accentOn
      ? ((pg.accent || undefined) as 'rose' | 'amber' | 'emerald' | 'cyan' | undefined)
      : undefined,
  )
  const pending = $derived(pg.pendingOn ? flagOn(pg.pending) : undefined)
  const confirmOnDismiss = $derived(pg.confirmOnDismissOn ? flagOn(pg.confirmOnDismiss) : undefined)
  // Unset, each label renders the localized default (matching the seed's
  // scope refs); set text overrides it in both demo and seed.
  const demoTitle = $derived(pg.titleOn && pg.title ? pg.title : i18n.t('showcase.discardTitle'))
  const demoMessage = $derived(pg.messageOn && pg.message ? pg.message : i18n.t('showcase.discardMessage'))
  const demoConfirmLabel = $derived(pg.confirmLabelOn && pg.confirmLabel ? pg.confirmLabel : i18n.t('showcase.discard'))
  const demoCloseLabel = $derived(pg.closeLabelOn && pg.closeLabel ? pg.closeLabel : i18n.t('common.close'))
  const demoClassName = $derived(pg.classNameOn && pg.className ? pg.className : undefined)
  const demoButtonSize = $derived(pg.buttonSizeOn ? parseSizeValue(pg.buttonSize) : undefined)

  const widthVariantOptions = [...DIALOG_SIZE_VARIANTS, 'fit', 'wide'].map(value => ({ value, label: value }))
  const heightVariantOptions = ['auto', ...DIALOG_SIZE_VARIANTS].map(value => ({ value, label: value }))
  const sizeOptions = DIALOG_SIZE_VARIANTS.map(value => ({ value, label: value }))
  const accentOptions = ['cyan', 'emerald', 'amber', 'violet', 'rose'].map(value => ({ value, label: value }))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildConfirmDialogSnippet({
      widthVariant: pg.widthVariant,
      widthVariantOn: pg.widthVariantOn,
      heightVariant: pg.heightVariant,
      heightVariantOn: pg.heightVariantOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      accent: pg.accent,
      accentOn: pg.accentOn,
      pending: pg.pending,
      pendingOn: pg.pendingOn,
      confirmOnDismiss: pg.confirmOnDismiss,
      confirmOnDismissOn: pg.confirmOnDismissOn,
      className: pg.className,
      classNameOn: pg.classNameOn,
      closeLabel: pg.closeLabel,
      closeLabelOn: pg.closeLabelOn,
      confirmLabel: pg.confirmLabel,
      confirmLabelOn: pg.confirmLabelOn,
      message: pg.message,
      messageOn: pg.messageOn,
      title: pg.title,
      titleOn: pg.titleOn,
      buttonSize: pg.buttonSize,
      buttonSizeOn: pg.buttonSizeOn,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'rose'", note: 'Confirm button accent.', options: accentOptions, value: pg.accent, onChange: v => (pg.accent = v), placeholder: 'rose', clearLabel: 'Clear accent', enabled: pg.accentOn, setEnabled: v => (pg.accentOn = v) }),
    sizeField({ note: 'Confirm button scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.buttonSize, onChange: v => (pg.buttonSize = v), enabled: pg.buttonSizeOn, setEnabled: v => (pg.buttonSizeOn = v), name: 'buttonSize', clearLabel: 'Clear button size' }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the dialog panel.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: '', clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    textField({ name: 'closeLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the dismiss affordances.', value: pg.closeLabel, onChange: v => (pg.closeLabel = v), clearable: true, enabled: pg.closeLabelOn, setEnabled: v => (pg.closeLabelOn = v) }),
    textField({ name: 'confirmLabel', type: 'string', defaultValue: '—', note: 'Confirm button text.', value: pg.confirmLabel, onChange: v => (pg.confirmLabel = v), clearable: true, enabled: pg.confirmLabelOn, setEnabled: v => (pg.confirmLabelOn = v) }),
    boolField({ name: 'confirmOnDismiss', defaultValue: 'false', note: 'Routes Escape, overlay click, and the close icon to onConfirm instead of onCancel.', value: pg.confirmOnDismiss, onChange: v => (pg.confirmOnDismiss = v as TriState), enabled: pg.confirmOnDismissOn, setEnabled: v => (pg.confirmOnDismissOn = v) }),
    enumField({ name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content.', options: heightVariantOptions, value: pg.heightVariant, onChange: v => (pg.heightVariant = v), placeholder: 'auto', clearLabel: 'Clear height', enabled: pg.heightVariantOn, setEnabled: v => (pg.heightVariantOn = v) }),
    textField({ name: 'message', type: 'string', defaultValue: '—', note: 'Body copy explaining the action.', value: pg.message, onChange: v => (pg.message = v), clearable: true, enabled: pg.messageOn, setEnabled: v => (pg.messageOn = v) }),
    boolField({ name: 'pending', defaultValue: 'false', note: 'Disables dismissal and marks the confirm button pending.', value: pg.pending, onChange: v => (pg.pending = v as TriState), enabled: pg.pendingOn, setEnabled: v => (pg.pendingOn = v) }),
    enumField({ name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both panel width and height; an explicit variant wins.', options: sizeOptions, value: pg.size, onChange: v => (pg.size = v), clearLabel: 'Clear size', enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    textField({ name: 'title', type: 'string', defaultValue: '—', note: 'Dialog heading.', value: pg.title, onChange: v => (pg.title = v), clearable: true, enabled: pg.titleOn, setEnabled: v => (pg.titleOn = v) }),
    enumField({ name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.', options: widthVariantOptions, value: pg.widthVariant, onChange: v => (pg.widthVariant = v), placeholder: 'md', clearLabel: 'Clear width', enabled: pg.widthVariantOn, setEnabled: v => (pg.widthVariantOn = v) }),
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
      open: pg.open,
      result: pg.result,
      openLabel: i18n.t('showcase.delete'),
      discardTitle: i18n.t('showcase.discardTitle'),
      discardMessage: i18n.t('showcase.discardMessage'),
      discardLabel: i18n.t('showcase.discard'),
      closeLabel: i18n.t('common.close'),
    }}

    sync={{ tag: 'ConfirmDialog' }}
  >
    <Button variant="primary" accent="rose" onClick={() => (pg.open = true)}>{i18n.t('showcase.delete')}</Button>
    {#if pg.open}
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
          pg.result = 'confirmed'
          pg.open = false
        }}
        onCancel={() => {
          pg.result = 'cancelled'
          pg.open = false
        }} />
    {/if}
    <p class="text-sm text-slate-400">result: {pg.result}</p>
  </ShowcasePage>
