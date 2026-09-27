<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Copyable from '$lib/components/Copyable.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildCopyableSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgText = $state('')
  let pgPosition = $state('')
  let pgAlwaysVisible = $state<TriState>('')
  let pgClassName = $state('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoPosition = $derived((pgPosition || undefined) as 'inline' | 'top-right' | undefined)
  const alwaysVisible = $derived(flagOn(pgAlwaysVisible))
  const demoClassName = $derived(pgClassName || undefined)

  const positionOptions = [
    { value: 'inline', label: 'inline' },
    { value: 'top-right', label: 'top-right' },
  ]
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(pgText !== '' || pgPosition !== '' || pgAlwaysVisible !== '' || pgClassName !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgText = ''
    pgPosition = ''
    pgAlwaysVisible = ''
    pgClassName = ''
  }

  const code = $derived.by(() =>
    buildCopyableSnippet({
      text: pgText,
      copyPosition: pgPosition,
      alwaysVisible: pgAlwaysVisible,
      className: pgClassName,
    }),
  )

  const props: PropRow[] = [
    { name: 'text', type: 'string', defaultValue: '—', note: 'Text to render (or wrap children instead).' },
    { name: 'copyText', type: 'string', defaultValue: 'text', note: 'Copied text; defaults to the rendered text.' },
    { name: 'className', type: 'string', defaultValue: "'text-slate-400'", note: 'Classes for the rendered text.' },
    { name: 'containerClass', type: 'string', defaultValue: "''", note: 'Extra classes for the wrapper.' },
    { name: 'copyAriaLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the copy button.' },
    { name: 'copyTooltip', type: 'string', defaultValue: 'locale', note: 'Tooltip for the copy button.' },
    {
      name: 'alwaysVisible',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Keeps the copy button visible (top-right mode implies it).',
    },
    { name: 'copyPosition', type: "'inline' | 'top-right'", defaultValue: "'inline'", note: 'Copy button placement.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Renders instead of text when passed.' },
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
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Text" htmlFor="pg-text">
      <input
        id="pg-text"
        bind:value={pgText}
        placeholder="Copy me"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Copy position">
      <SelectDropdown
        buttonLabel={pgPosition || 'Default'}
        activeValue={pgPosition}
        ariaLabel="Copy position"
        options={positionOptions}
        onSelect={value => (pgPosition = value)}
        clearable
        clearLabel="Clear copy position"
        onClear={() => (pgPosition = '')} />
    </FormField>
    <FormField label="Always visible">
      <SelectDropdown
        buttonLabel={triLabel(pgAlwaysVisible)}
        activeValue={pgAlwaysVisible}
        ariaLabel="Always visible"
        options={yesNoOptions}
        onSelect={value => (pgAlwaysVisible = value as TriState)}
        clearable
        clearLabel="Clear always visible"
        onClear={() => (pgAlwaysVisible = '')} />
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

<ShowcasePage name="Copyable" props={propsSnippet}>
  <ShowcaseSection title={sectionTitle} {code} footer={settingsPanel}>
    <Copyable text={pgText || 'Copy me'} copyPosition={demoPosition} {alwaysVisible} className={demoClassName} />
  </ShowcaseSection>
</ShowcasePage>
