<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte'
  import { DIALOG_SIZE_VARIANTS } from '$lib/components/BaseDialog.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { enumField, textField, boolField, sizeField } from '$showcase/snippet-field'
  import { applied, appliedFlag, eye, eyeFlag, staged } from '$showcase/staged'
  import { type TriState } from '$showcase/snippet-build'
  import { buildConfirmDialogSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `open`/`result` are interaction state, not curated options.
  const INITIAL = {
    open: false,
    result: 'idle',
    widthVariant: staged('md'),
    heightVariant: staged('auto'),
    size: staged(''),
    accent: staged('rose'),
    pending: staged('no' as TriState),
    confirmOnDismiss: staged('no' as TriState),
    className: staged(''),
    closeLabel: staged(''),
    confirmLabel: staged(''),
    message: staged(''),
    title: staged(''),
    buttonSize: staged('md'),
  }
  let pg = $state(structuredClone(INITIAL))

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
  const demoAccent = $derived(
    (applied(pg.accent) || undefined) as 'rose' | 'amber' | 'emerald' | 'cyan' | undefined,
  )
  const pending = $derived(appliedFlag(pg.pending))
  const confirmOnDismiss = $derived(appliedFlag(pg.confirmOnDismiss))
  // Unset, each label renders the localized default (matching the seed's
  // scope refs); set text overrides it in both demo and seed.
  const demoTitle = $derived(applied(pg.title) || i18n.t('showcase.discardTitle'))
  const demoMessage = $derived(applied(pg.message) || i18n.t('showcase.discardMessage'))
  const demoConfirmLabel = $derived(applied(pg.confirmLabel) || i18n.t('showcase.discard'))
  const demoCloseLabel = $derived(applied(pg.closeLabel) || i18n.t('common.close'))
  const demoClassName = $derived(applied(pg.className) || undefined)
  const demoButtonSize = $derived.by(() => {
    const value = applied(pg.buttonSize)
    return value === undefined ? undefined : parseSizeValue(value)
  })

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
      heightVariant: pg.heightVariant,
      size: pg.size,
      accent: pg.accent,
      pending: pg.pending,
      confirmOnDismiss: pg.confirmOnDismiss,
      className: pg.className,
      closeLabel: pg.closeLabel,
      confirmLabel: pg.confirmLabel,
      message: pg.message,
      title: pg.title,
      buttonSize: pg.buttonSize,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'rose'", note: 'Confirm button accent.', options: accentOptions, placeholder: 'rose', clearLabel: 'Clear accent', ...eye(pg.accent) }),
    sizeField({ note: 'Confirm button scale; numbers are icon-scale pixels interpolated between the steps.', name: 'buttonSize', clearLabel: 'Clear button size', ...eye(pg.buttonSize) }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the dialog panel.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    textField({ name: 'closeLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the dismiss affordances.', clearable: true, ...eye(pg.closeLabel) }),
    textField({ name: 'confirmLabel', type: 'string', defaultValue: '—', note: 'Confirm button text.', clearable: true, ...eye(pg.confirmLabel) }),
    boolField({ name: 'confirmOnDismiss', defaultValue: 'false', note: 'Routes Escape, overlay click, and the close icon to onConfirm instead of onCancel.', ...eyeFlag(pg.confirmOnDismiss) }),
    enumField({ name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content.', options: heightVariantOptions, placeholder: 'auto', clearLabel: 'Clear height', ...eye(pg.heightVariant) }),
    textField({ name: 'message', type: 'string', defaultValue: '—', note: 'Body copy explaining the action.', clearable: true, ...eye(pg.message) }),
    boolField({ name: 'pending', defaultValue: 'false', note: 'Disables dismissal and marks the confirm button pending.', ...eyeFlag(pg.pending) }),
    enumField({ name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both panel width and height; an explicit variant wins.', options: sizeOptions, clearLabel: 'Clear size', ...eye(pg.size) }),
    textField({ name: 'title', type: 'string', defaultValue: '—', note: 'Dialog heading.', clearable: true, ...eye(pg.title) }),
    enumField({ name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.', options: widthVariantOptions, placeholder: 'md', clearLabel: 'Clear width', ...eye(pg.widthVariant) }),
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
