<script lang="ts">
  import BaseDialog from '$lib/components/BaseDialog.svelte'
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { STYLED_PANEL, STYLED_TITLE, buildBaseDialogSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgOpen = $state(false)
  let pgMaxWidth = $state('')
  let pgHeight = $state('')
  let pgFullscreen = $state<TriState>('')
  let pgPending = $state<TriState>('')
  let pgAllowPendingCancel = $state<TriState>('')
  let pgStyled = $state('')
  let pgTitleClass = $state('')
  let pgClassName = $state('')
  let pgCustomHeader = $state('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoMaxWidth = $derived(
    (pgMaxWidth || undefined) as
      'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'fit' | 'wide' | undefined,
  )
  const demoHeight = $derived((pgHeight || undefined) as 'auto' | 'fixed' | 'tall' | undefined)
  const fullscreen = $derived(flagOn(pgFullscreen))
  const pending = $derived(flagOn(pgPending))
  const allowPendingCancel = $derived(flagOn(pgAllowPendingCancel))

  const maxWidthOptions = ['md', 'lg', 'xl', '2xl', 'fit', 'wide'].map(value => ({ value, label: value }))
  const heightOptions = ['auto', 'fixed', 'tall'].map(value => ({ value, label: value }))
  const styledOptions = [{ value: 'yes', label: 'Styled' }]
  const headerOptions = [{ value: 'yes', label: 'Custom header' }]
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(
    pgMaxWidth !== '' ||
      pgHeight !== '' ||
      pgFullscreen !== '' ||
      pgPending !== '' ||
      pgAllowPendingCancel !== '' ||
      pgStyled !== '' ||
      pgTitleClass !== '' ||
      pgClassName !== '' ||
      pgCustomHeader !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgOpen = false
    pgMaxWidth = ''
    pgHeight = ''
    pgFullscreen = ''
    pgPending = ''
    pgAllowPendingCancel = ''
    pgStyled = ''
    pgTitleClass = ''
    pgClassName = ''
    pgCustomHeader = ''
  }

  const code = $derived.by(() =>
    buildBaseDialogSnippet({
      maxWidth: pgMaxWidth,
      height: pgHeight,
      fullscreen: pgFullscreen,
      pending: pgPending,
      allowPendingCancel: pgAllowPendingCancel,
      titleClass: pgTitleClass,
      className: pgClassName,
      customHeader: pgCustomHeader,
    }),
  )

  const props: PropRow[] = [
    { name: 'title', type: 'string', defaultValue: '—', note: 'Heading rendered when no header snippet is passed.' },
    { name: 'titleClass', type: 'string', defaultValue: "''", note: 'Extra classes for the title element.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the dialog panel.' },
    { name: 'maxWidth', type: "'md' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.' },
    { name: 'height', type: "'auto' | 'fixed' | 'tall'", defaultValue: "'auto'", note: 'Panel height variant.' },
    { name: 'pending', type: 'boolean', defaultValue: 'false', note: 'Disables dismissal while an operation runs.' },
    {
      name: 'allowPendingCancel',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Keeps dismissal enabled while pending.',
    },
    {
      name: 'dismissKeydownCapture',
      type: 'boolean',
      defaultValue: 'true',
      note: 'Registers the capture-phase Escape/Tab handler.',
    },
    { name: 'fullscreen', type: 'boolean', defaultValue: 'false', note: 'Fills the viewport on an opaque surface.' },
    { name: 'closeLabel', type: 'string', defaultValue: 'locale', note: 'Overrides the close accessible name.' },
    { name: 'onCancel', type: '() => void', defaultValue: '—', note: 'Called by every dismissal affordance.' },
    { name: 'header', type: 'Snippet', defaultValue: '—', note: 'Replaces the title with custom header markup.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Dialog body content.' },
  ]
</script>

{#snippet customHeader()}
  <h2 class="text-xl font-semibold tracking-tight text-cyan-200">{i18n.t('showcase.dialogTitle')}</h2>
  <p class="mt-1 text-sm text-slate-400">{i18n.t('showcase.dialogBody')}</p>
{/snippet}

{#snippet resetIcon()}
  <ResetIcon className="h-4 w-4" />
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
    <FormField label="Height">
      <SelectDropdown
        buttonLabel={pgHeight || 'Default'}
        activeValue={pgHeight}
        ariaLabel="Height"
        options={heightOptions}
        onSelect={value => (pgHeight = value)}
        clearable
        clearLabel="Clear height"
        onClear={() => (pgHeight = '')} />
    </FormField>
    <FormField label="Fullscreen">
      <SelectDropdown
        buttonLabel={triLabel(pgFullscreen)}
        activeValue={pgFullscreen}
        ariaLabel="Fullscreen"
        options={yesNoOptions}
        onSelect={value => (pgFullscreen = value as TriState)}
        clearable
        clearLabel="Clear fullscreen"
        onClear={() => (pgFullscreen = '')} />
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
    <FormField label="Allow pending cancel">
      <SelectDropdown
        buttonLabel={triLabel(pgAllowPendingCancel)}
        activeValue={pgAllowPendingCancel}
        ariaLabel="Allow pending cancel"
        options={yesNoOptions}
        onSelect={value => (pgAllowPendingCancel = value as TriState)}
        clearable
        clearLabel="Clear allow pending cancel"
        onClear={() => (pgAllowPendingCancel = '')} />
    </FormField>
    <FormField label="Style">
      <SelectDropdown
        buttonLabel={pgStyled ? 'Styled' : 'Default'}
        activeValue={pgStyled}
        ariaLabel="Style"
        options={styledOptions}
        onSelect={value => {
          pgStyled = value
          pgTitleClass = STYLED_TITLE
          pgClassName = STYLED_PANEL
        }}
        clearable
        clearLabel="Clear style"
        onClear={() => {
          pgStyled = ''
          pgTitleClass = ''
          pgClassName = ''
        }} />
    </FormField>
    <FormField label="Title class" htmlFor="pg-titleclass">
      <input
        id="pg-titleclass"
        bind:value={pgTitleClass}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Class name" htmlFor="pg-classname">
      <input
        id="pg-classname"
        bind:value={pgClassName}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Header">
      <SelectDropdown
        buttonLabel={pgCustomHeader ? 'Custom header' : 'Default'}
        activeValue={pgCustomHeader}
        ariaLabel="Header"
        options={headerOptions}
        onSelect={value => (pgCustomHeader = value)}
        clearable
        clearLabel="Clear header"
        onClear={() => (pgCustomHeader = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="BaseDialog" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{
      customHeader,
      open: pgOpen,
      openDialogLabel: i18n.t('showcase.openDialog'),
      dialogTitle: i18n.t('showcase.dialogTitle'),
      dialogBody: i18n.t('showcase.dialogBody'),
      cancelLabel: i18n.t('common.cancel'),
      okLabel: i18n.t('common.ok'),
    }}>
    <Button variant="primary" onClick={() => (pgOpen = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if pgOpen}
      <BaseDialog
        title={pgCustomHeader ? undefined : i18n.t('showcase.dialogTitle')}
        header={pgCustomHeader ? customHeader : undefined}
        titleClass={pgTitleClass || undefined}
        className={pgClassName || undefined}
        maxWidth={demoMaxWidth}
        height={demoHeight}
        {fullscreen}
        {pending}
        {allowPendingCancel}
        onCancel={() => (pgOpen = false)}>
        <p data-testid="dialog-body">{i18n.t('showcase.dialogBody')}</p>
        <Buttons className="mt-4 flex w-full shrink-0 flex-wrap items-center justify-end gap-3">
          <Button onClick={() => (pgOpen = false)}>{i18n.t('common.cancel')}</Button>
          <Button variant="primary" onClick={() => (pgOpen = false)}>{i18n.t('common.ok')}</Button>
        </Buttons>
      </BaseDialog>
    {/if}
  </ShowcaseSection>
</ShowcasePage>
