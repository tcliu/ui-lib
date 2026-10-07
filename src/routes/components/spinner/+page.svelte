<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import Spinner from '$lib/components/Spinner.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildSpinnerSnippet } from './demo-snippet'
  import { parseSizeValue } from '$lib/showcase/size-input'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgSize = $state('')
  let pgTint = $state('')

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
  ]
  const tintOptions = [
    { value: 'text-cyan-400', label: 'cyan' },
    { value: 'text-amber-400', label: 'amber' },
    { value: 'text-emerald-400', label: 'emerald' },
  ]

  const demoSize = $derived(parseSizeValue(pgSize))
  const demoTint = $derived(pgTint || undefined)

  const isCustomized = $derived(pgSize !== '' || pgTint !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgSize = ''
    pgTint = ''
  }

  const code = $derived.by(() => buildSpinnerSnippet({ size: pgSize, tint: pgTint }))

  const props: PropRow[] = [
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | number",
      defaultValue: "'xs'",
      note: 'Width/height attributes (16/24/32/40px for names, passthrough for numbers); composes with className.',
    },
    {
      name: 'className',
      type: 'string',
      defaultValue: "''",
      note: 'Color and extra classes; explicit size classes win over the size attributes.',
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
        filterable
        allowCustomValue
        onSelect={value => (pgSize = value)}
        clearable
        clearLabel="Clear size"
        onClear={() => (pgSize = '')} />
    </FormField>
    <FormField label="Tint">
      <SelectDropdown
        buttonLabel={tintOptions.find(option => option.value === pgTint)?.label ?? 'Default'}
        activeValue={pgTint}
        ariaLabel="Tint"
        options={tintOptions}
        onSelect={value => (pgTint = value)}
        clearable
        clearLabel="Clear tint"
        onClear={() => (pgTint = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Spinner" props={propsSnippet}>
  <ShowcaseSection title={sectionTitle} {code} footer={settingsPanel} scope={{ reloadLabel: i18n.t('common.reload') }}>
    <Spinner size={demoSize} className={demoTint} />
    <span class="inline-flex items-center gap-2 text-sm text-slate-300">
      <Spinner size={demoSize} className={demoTint} />
      {i18n.t('common.reload')}
    </span>
  </ShowcaseSection>
</ShowcasePage>
