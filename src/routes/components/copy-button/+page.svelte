<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import CopyButton from '$lib/components/CopyButton.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { DEFAULT_TEXT, buildCopyButtonSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgText = $state('')
  let pgAlwaysVisible = $state<TriState>('')
  let pgAriaLabel = $state('')
  let pgTooltip = $state('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const alwaysVisible = $derived(flagOn(pgAlwaysVisible))

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(pgText !== '' || pgAlwaysVisible !== '' || pgAriaLabel !== '' || pgTooltip !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgText = ''
    pgAlwaysVisible = ''
    pgAriaLabel = ''
    pgTooltip = ''
  }

  const code = $derived.by(() =>
    buildCopyButtonSnippet({
      text: pgText,
      alwaysVisible: pgAlwaysVisible,
      copyAriaLabel: pgAriaLabel,
      copyTooltip: pgTooltip,
    }),
  )

  const props: PropRow[] = [
    { name: 'text', type: 'string', defaultValue: '—', note: 'Text placed on the clipboard (required).' },
    {
      name: 'alwaysVisible',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Keeps the button visible instead of revealing it on hover/focus.',
    },
    { name: 'copyAriaLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the copy button.' },
    { name: 'copyTooltip', type: 'string', defaultValue: 'locale', note: 'Tooltip shown on hover/focus.' },
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
    <FormField label="Text" htmlFor="pg-text">
      <input
        id="pg-text"
        bind:value={pgText}
        placeholder={DEFAULT_TEXT}
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
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
    <FormField label="Aria label" htmlFor="pg-aria">
      <input
        id="pg-aria"
        bind:value={pgAriaLabel}
        placeholder="(locale)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Tooltip" htmlFor="pg-tooltip">
      <input
        id="pg-tooltip"
        bind:value={pgTooltip}
        placeholder="(locale)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="CopyButton" props={propsSnippet}>
  <ShowcaseSection title={sectionTitle} {code} footer={settingsPanel} scope={{ copyHint: i18n.t('copy.toClipboard') }}>
    <div class="group flex flex-wrap items-center gap-3">
      <div class="flex max-w-full items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
        <span class="min-w-0 truncate font-mono text-sm text-slate-300">{pgText || DEFAULT_TEXT}</span>
        <CopyButton
          text={pgText || DEFAULT_TEXT}
          {alwaysVisible}
          copyAriaLabel={pgAriaLabel || undefined}
          copyTooltip={pgTooltip || undefined} />
      </div>
      <span class="text-xs text-slate-500">{i18n.t('copy.toClipboard')}</span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
