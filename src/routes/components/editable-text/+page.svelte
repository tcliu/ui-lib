<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import EditableText from '$lib/components/EditableText.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { DEFAULT_TEXT, buildEditableTextSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // The committed value is demo state: double-clicking the label opens the
  // input and the accepted text is written back, so the demo stays controlled.
  let pgValue = $state(DEFAULT_TEXT)

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgSize = $state('')
  let pgCopyable = $state<TriState>('')
  let pgClassName = $state('')

  const sizeOptions = ['xs', 'sm', 'md', 'lg'].map(value => ({ value, label: value }))
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoSize = $derived((pgSize || undefined) as 'xs' | 'sm' | 'md' | 'lg' | undefined)
  const copyable = $derived(flagOn(pgCopyable))
  const demoClassName = $derived(pgClassName || undefined)

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(pgSize !== '' || pgCopyable !== '' || pgClassName !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgValue = DEFAULT_TEXT
    pgSize = ''
    pgCopyable = ''
    pgClassName = ''
  }

  const code = $derived.by(() =>
    buildEditableTextSnippet({
      value: pgValue,
      size: pgSize,
      copyable: pgCopyable,
      className: pgClassName,
    }),
  )

  const props: PropRow[] = [
    {
      name: 'text',
      type: 'string',
      defaultValue: '—',
      note: 'Displayed value; double-click or use the edit button to change it (required).',
    },
    {
      name: 'onChange',
      type: '(text: string) => void | boolean',
      defaultValue: '—',
      note: 'Called with the committed value; return false to reject it and keep editing.',
    },
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg'",
      defaultValue: "'md'",
      note: 'Text size for the label and the input.',
    },
    { name: 'copyable', type: 'boolean', defaultValue: 'false', note: 'Adds a copy button beside the label.' },
    { name: 'className', type: 'string', defaultValue: "'text-slate-200'", note: 'Classes for the display label.' },
    {
      name: 'maxWidth',
      type: 'number',
      defaultValue: '480',
      note: 'Maximum input width in px, clamped to the remaining horizontal space.',
    },
    {
      name: 'onActivate',
      type: '() => void',
      defaultValue: '—',
      note: 'Called on a single click after a short delay, distinct from the double-click edit.',
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
    <FormField label="Copyable">
      <SelectDropdown
        buttonLabel={triLabel(pgCopyable)}
        activeValue={pgCopyable}
        ariaLabel="Copyable"
        options={yesNoOptions}
        onSelect={value => (pgCopyable = value as TriState)}
        clearable
        clearLabel="Clear copyable"
        onClear={() => (pgCopyable = '')} />
    </FormField>
    <FormField label="Class name" htmlFor="pg-classname">
      <input
        id="pg-classname"
        bind:value={pgClassName}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="EditableText" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{ editHint: i18n.t('edit.doubleClickToEdit') }}>
    <div class="group flex flex-wrap items-center gap-2">
      <EditableText
        text={pgValue}
        onChange={next => {
          pgValue = next
        }}
        size={demoSize}
        {copyable}
        className={demoClassName} />
      <span class="text-xs text-slate-500">{i18n.t('edit.doubleClickToEdit')}</span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
