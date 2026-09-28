<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildConfirmDialogSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgOpen = $state(false)
  let pgResult = $state('idle')
  let pgMaxWidth = $state('')
  let pgConfirmColor = $state('')
  let pgPending = $state<TriState>('')
  let pgConfirmOnDismiss = $state<TriState>('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoMaxWidth = $derived(
    (pgMaxWidth || undefined) as
      'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'fit' | 'wide' | undefined,
  )
  const demoConfirmColor = $derived((pgConfirmColor || undefined) as 'rose' | 'amber' | 'emerald' | 'cyan' | undefined)
  const pending = $derived(flagOn(pgPending))
  const confirmOnDismiss = $derived(flagOn(pgConfirmOnDismiss))

  const maxWidthOptions = ['md', 'lg', 'xl', '2xl', 'fit', 'wide'].map(value => ({ value, label: value }))
  const confirmColorOptions = ['rose', 'amber', 'emerald', 'cyan'].map(value => ({ value, label: value }))
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(
    pgMaxWidth !== '' || pgConfirmColor !== '' || pgPending !== '' || pgConfirmOnDismiss !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgOpen = false
    pgResult = 'idle'
    pgMaxWidth = ''
    pgConfirmColor = ''
    pgPending = ''
    pgConfirmOnDismiss = ''
  }

  const code = $derived.by(() =>
    buildConfirmDialogSnippet({
      maxWidth: pgMaxWidth,
      confirmColor: pgConfirmColor,
      pending: pgPending,
      confirmOnDismiss: pgConfirmOnDismiss,
    }),
  )

  const props: PropRow[] = [
    { name: 'title', type: 'string', defaultValue: '—', note: 'Dialog heading.' },
    { name: 'message', type: 'string', defaultValue: '—', note: 'Body copy explaining the action.' },
    { name: 'confirmLabel', type: 'string', defaultValue: '—', note: 'Confirm button text.' },
    {
      name: 'closeLabel',
      type: 'string',
      defaultValue: 'locale',
      note: 'Accessible name for the dismiss affordances.',
    },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the dialog panel.' },
    { name: 'maxWidth', type: "'md' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.' },
    {
      name: 'confirmColor',
      type: "'rose' | 'amber' | 'emerald' | 'cyan'",
      defaultValue: "'rose'",
      note: 'Confirm button accent.',
    },
    {
      name: 'pending',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Disables dismissal and marks the confirm button pending.',
    },
    {
      name: 'confirmOnDismiss',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Routes Escape, overlay click, and the close icon to onConfirm instead of onCancel.',
    },
    { name: 'onConfirm', type: '() => void', defaultValue: '—', note: 'Confirm handler.' },
    {
      name: 'onCancel',
      type: '() => void',
      defaultValue: 'onConfirm',
      note: 'Dismiss handler; falls back to onConfirm when omitted.',
    },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Max width">
      <SelectDropdown
        buttonLabel={pgMaxWidth || 'Default'}
        activeValue={pgMaxWidth}
        ariaLabel="Max width"
        options={maxWidthOptions}
        onSelect={value => (pgMaxWidth = value)}
        clearable
        clearLabel="Clear max width"
        onClear={() => (pgMaxWidth = '')} />
    </FormField>
    <FormField label="Confirm color">
      <SelectDropdown
        buttonLabel={pgConfirmColor || 'Default'}
        activeValue={pgConfirmColor}
        ariaLabel="Confirm color"
        options={confirmColorOptions}
        onSelect={value => (pgConfirmColor = value)}
        clearable
        clearLabel="Clear confirm color"
        onClear={() => (pgConfirmColor = '')} />
    </FormField>
    <FormField label="Pending">
      <SelectDropdown
        buttonLabel={triLabel(pgPending)}
        activeValue={pgPending}
        ariaLabel="Pending"
        options={yesNoOptions}
        onSelect={value => (pgPending = value as TriState)}
        clearable
        clearLabel="Clear pending"
        onClear={() => (pgPending = '')} />
    </FormField>
    <FormField label="Confirm on dismiss">
      <SelectDropdown
        buttonLabel={triLabel(pgConfirmOnDismiss)}
        activeValue={pgConfirmOnDismiss}
        ariaLabel="Confirm on dismiss"
        options={yesNoOptions}
        onSelect={value => (pgConfirmOnDismiss = value as TriState)}
        clearable
        clearLabel="Clear confirm on dismiss"
        onClear={() => (pgConfirmOnDismiss = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="ConfirmDialog" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{
      open: pgOpen,
      result: pgResult,
      openLabel: i18n.t('showcase.delete'),
      discardTitle: i18n.t('showcase.discardTitle'),
      discardMessage: i18n.t('showcase.discardMessage'),
      discardLabel: i18n.t('showcase.discard'),
      closeLabel: i18n.t('common.close'),
    }}>
    <Button variant="primary" accent="rose" onClick={() => (pgOpen = true)}>{i18n.t('showcase.delete')}</Button>
    {#if pgOpen}
      <ConfirmDialog
        title={i18n.t('showcase.discardTitle')}
        message={i18n.t('showcase.discardMessage')}
        confirmLabel={i18n.t('showcase.discard')}
        closeLabel={i18n.t('common.close')}
        maxWidth={demoMaxWidth}
        confirmColor={demoConfirmColor}
        {pending}
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
  </ShowcaseSection>
</ShowcasePage>
