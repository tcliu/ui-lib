<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import Toast from '$lib/components/Toast.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildToastSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgOpen = $state(false)
  let pgActionTaken = $state('')
  let pgMessage = $state('')
  let pgType = $state('')
  let pgPosition = $state('')
  let pgSize = $state('')
  let pgAction = $state('')

  const typeOptions = ['success', 'info', 'warning', 'error'].map(value => ({ value, label: value }))
  const positionOptions = ['top-right', 'top-center', 'bottom-right', 'bottom-center'].map(value => ({
    value,
    label: value,
  }))
  const sizeOptions = [
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
  ]

  const demoType = $derived((pgType || undefined) as 'success' | 'info' | 'warning' | 'error' | undefined)
  const demoPosition = $derived(
    (pgPosition || undefined) as 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center' | undefined
  )
  const demoSize = $derived((pgSize || undefined) as 'sm' | 'md' | undefined)

  const isCustomized = $derived(
    pgMessage !== '' || pgType !== '' || pgPosition !== '' || pgSize !== '' || pgAction !== ''
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgOpen = false
    pgActionTaken = ''
    pgMessage = ''
    pgType = ''
    pgPosition = ''
    pgSize = ''
    pgAction = ''
  }

  const code = $derived.by(() =>
    buildToastSnippet({
      message: pgMessage,
      toastType: pgType,
      position: pgPosition,
      size: pgSize,
      action: pgAction,
    })
  )

  const props: PropRow[] = [
    { name: 'message', type: 'string', defaultValue: '—', note: 'Toast body text.' },
    { name: 'closeLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the dismiss button.' },
    { name: 'position', type: "'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'", defaultValue: "'bottom-right'", note: 'Viewport edge the toast docks to.' },
    { name: 'size', type: "'sm' | 'md'", defaultValue: "'sm'", note: 'Text scale.' },
    { name: 'type', type: "'success' | 'info' | 'warning' | 'error'", defaultValue: "'info'", note: 'Accent treatment.' },
    { name: 'actionLabel', type: 'string', defaultValue: '—', note: 'Paired action button; renders only with onAction.' },
    { name: 'onAction', type: '() => void', defaultValue: '—', note: 'Action button handler.' },
    { name: 'onClose', type: '() => void', defaultValue: '—', note: 'Dismiss handler (button and Escape).' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon className="h-4 w-4" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>
      Reset
    </Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Message" htmlFor="pg-message">
      <input
        id="pg-message"
        bind:value={pgMessage}
        placeholder="Default"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Type">
      <SelectDropdown
        buttonLabel={pgType || 'Default'}
        activeValue={pgType}
        ariaLabel="Type"
        options={typeOptions}
        onSelect={value => (pgType = value)}
        clearable
        clearLabel="Clear type"
        onClear={() => (pgType = '')} />
    </FormField>
    <FormField label="Position">
      <SelectDropdown
        buttonLabel={pgPosition || 'Default'}
        activeValue={pgPosition}
        ariaLabel="Position"
        options={positionOptions}
        onSelect={value => (pgPosition = value)}
        clearable
        clearLabel="Clear position"
        onClear={() => (pgPosition = '')} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        buttonLabel={pgSize || 'Default'}
        activeValue={pgSize}
        ariaLabel="Size"
        options={sizeOptions}
        onSelect={value => (pgSize = value)}
        clearable
        clearLabel="Clear size"
        onClear={() => (pgSize = '')} />
    </FormField>
    <FormField label="Action label" htmlFor="pg-action">
      <input
        id="pg-action"
        bind:value={pgAction}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Toast" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    code={code}
    footer={settingsPanel}
    scope={{
      open: pgOpen,
      actionTaken: pgActionTaken,
      actionLabel: pgAction,
      defaultMessage: i18n.t('showcase.default'),
      closeLabel: i18n.t('common.close'),
      showLabel: i18n.t('showcase.openDialog'),
    }}>
    <Button variant="primary" onClick={() => (pgOpen = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if pgOpen}
      <Toast
        message={pgMessage || i18n.t('showcase.default')}
        closeLabel={i18n.t('common.close')}
        type={demoType}
        position={demoPosition}
        size={demoSize}
        actionLabel={pgAction || undefined}
        onAction={pgAction ? () => (pgActionTaken = pgAction) : undefined}
        onClose={() => (pgOpen = false)} />
    {/if}
    <span class="text-sm text-slate-400">action: {pgActionTaken || '—'}</span>
  </ShowcaseSection>
</ShowcasePage>
