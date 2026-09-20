<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import EditDialog from '$lib/components/EditDialog.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildEditDialogSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgOpen = $state(false)
  let pgDraft = $state('Editable text')
  let pgSaved = $state('Editable text')
  let pgMaxWidth = $state('')
  let pgDirty = $state<TriState>('')
  let pgPending = $state<TriState>('')
  let pgSaveDisabled = $state<TriState>('')
  let pgShowReset = $state<TriState>('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoMaxWidth = $derived(
    (pgMaxWidth || undefined) as
      | 'md'
      | 'lg'
      | 'xl'
      | '2xl'
      | '3xl'
      | '4xl'
      | '5xl'
      | '6xl'
      | '7xl'
      | 'fit'
      | 'wide'
      | undefined
  )
  const dirty = $derived(flagOn(pgDirty) ?? false)
  const pending = $derived(flagOn(pgPending))
  const saveDisabled = $derived(flagOn(pgSaveDisabled))
  const showReset = $derived(flagOn(pgShowReset))

  const maxWidthOptions = ['md', 'lg', 'xl', '2xl', 'fit', 'wide'].map(value => ({ value, label: value }))
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(
    pgMaxWidth !== '' || pgDirty !== '' || pgPending !== '' || pgSaveDisabled !== '' || pgShowReset !== ''
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgOpen = false
    pgDraft = 'Editable text'
    pgSaved = 'Editable text'
    pgMaxWidth = ''
    pgDirty = ''
    pgPending = ''
    pgSaveDisabled = ''
    pgShowReset = ''
  }

  function handleSave() {
    pgSaved = pgDraft
    pgOpen = false
  }

  const code = $derived.by(() =>
    buildEditDialogSnippet({
      maxWidth: pgMaxWidth,
      dirty: pgDirty,
      pending: pgPending,
      saveDisabled: pgSaveDisabled,
      showReset: pgShowReset,
    })
  )

  const props: PropRow[] = [
    { name: 'title', type: 'string', defaultValue: '—', note: 'Dialog heading.' },
    { name: 'maxWidth', type: "'md' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.' },
    { name: 'closeLabel', type: 'string', defaultValue: '—', note: 'Accessible name for dismissals.' },
    { name: 'saveLabel', type: 'string', defaultValue: '—', note: 'Save button text.' },
    { name: 'resetLabel', type: 'string', defaultValue: '—', note: 'Reset button text.' },
    { name: 'discardTitle', type: 'string', defaultValue: '—', note: 'Discard-confirm title.' },
    { name: 'discardMessage', type: 'string', defaultValue: '—', note: 'Discard-confirm body.' },
    { name: 'discardLabel', type: 'string', defaultValue: '—', note: 'Discard-confirm button text.' },
    { name: 'dirty', type: 'boolean', defaultValue: 'false', note: 'Gates the discard prompt and Reset.' },
    { name: 'saveDisabled', type: 'boolean', defaultValue: 'false', note: 'Caller validity rules; ORed with pending.' },
    { name: 'pending', type: 'boolean', defaultValue: 'false', note: 'Disables Save/Reset while an operation runs.' },
    { name: 'showReset', type: 'boolean', defaultValue: 'true', note: 'Shows the Reset button.' },
    { name: 'onSave', type: '() => void', defaultValue: '—', note: 'Save handler.' },
    { name: 'onReset', type: '() => void', defaultValue: '—', note: 'Reset handler.' },
    { name: 'onClose', type: '() => void', defaultValue: '—', note: 'Final close (direct when clean, after discard confirm).' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Form body.' },
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
    <FormField label="Dirty">
      <SelectDropdown
        buttonLabel={triLabel(pgDirty)}
        activeValue={pgDirty}
        ariaLabel="Dirty"
        options={yesNoOptions}
        onSelect={value => (pgDirty = value as TriState)}
        clearable
        clearLabel="Clear dirty"
        onClear={() => (pgDirty = '')} />
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
    <FormField label="Save disabled">
      <SelectDropdown
        buttonLabel={triLabel(pgSaveDisabled)}
        activeValue={pgSaveDisabled}
        ariaLabel="Save disabled"
        options={yesNoOptions}
        onSelect={value => (pgSaveDisabled = value as TriState)}
        clearable
        clearLabel="Clear save disabled"
        onClear={() => (pgSaveDisabled = '')} />
    </FormField>
    <FormField label="Show reset">
      <SelectDropdown
        buttonLabel={triLabel(pgShowReset)}
        activeValue={pgShowReset}
        ariaLabel="Show reset"
        options={yesNoOptions}
        onSelect={value => (pgShowReset = value as TriState)}
        clearable
        clearLabel="Clear show reset"
        onClear={() => (pgShowReset = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="EditDialog" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    code={code}
    footer={settingsPanel}
    scope={{
      open: pgOpen,
      draft: pgDraft,
      saved: pgSaved,
      dialogTitle: i18n.t('showcase.dialogTitle'),
      closeLabel: i18n.t('common.close'),
      okLabel: i18n.t('common.ok'),
      resetLabel: i18n.t('common.reset'),
      discardTitle: i18n.t('showcase.discardTitle'),
      discardMessage: i18n.t('showcase.discardMessage'),
      discardLabel: i18n.t('showcase.discard'),
    }}>
    <Button variant="primary" onClick={() => (pgOpen = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if pgOpen}
      <EditDialog
        title={i18n.t('showcase.dialogTitle')}
        maxWidth={demoMaxWidth}
        closeLabel={i18n.t('common.close')}
        saveLabel={i18n.t('common.ok')}
        resetLabel={i18n.t('common.reset')}
        discardTitle={i18n.t('showcase.discardTitle')}
        discardMessage={i18n.t('showcase.discardMessage')}
        discardLabel={i18n.t('showcase.discard')}
        {dirty}
        {pending}
        {saveDisabled}
        {showReset}
        onSave={handleSave}
        onReset={() => (pgDraft = pgSaved)}
        onClose={() => (pgOpen = false)}>
        <input
          type="text"
          bind:value={pgDraft}
          aria-label={i18n.t('showcase.dialogTitle')}
          class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus-visible:border-cyan-500" />
      </EditDialog>
    {/if}
  </ShowcaseSection>
</ShowcasePage>
