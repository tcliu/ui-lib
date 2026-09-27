<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildButtonSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgClicks = $state(0)
  let pgVariant = $state('')
  let pgAccent = $state('')
  let pgSize = $state('')
  let pgDisabled = $state<TriState>('')
  let pgPending = $state<TriState>('')
  let pgIcon = $state('')
  let pgBadge = $state('')
  let pgLabel = $state('')
  let pgClassName = $state('')

  const variants = ['primary', 'secondary', 'danger', 'outline', 'ghost']
  const accents = ['cyan', 'emerald', 'amber', 'violet', 'rose']
  const sizes = ['xs', 'sm', 'md', 'lg']
  const iconOptions = [{ value: 'yes', label: 'Check icon' }]

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoVariant = $derived(
    (pgVariant || undefined) as 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | undefined,
  )
  const demoAccent = $derived((pgAccent || undefined) as 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | undefined)
  const demoSize = $derived((pgSize || undefined) as 'xs' | 'sm' | 'md' | 'lg' | undefined)
  const disabled = $derived(flagOn(pgDisabled))
  const pending = $derived(flagOn(pgPending))
  const demoLabel = $derived(pgLabel || i18n.t('common.apply'))

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const isCustomized = $derived(
    pgVariant !== '' ||
      pgAccent !== '' ||
      pgSize !== '' ||
      pgDisabled !== '' ||
      pgPending !== '' ||
      pgIcon !== '' ||
      pgBadge !== '' ||
      pgLabel !== '' ||
      pgClassName !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgClicks = 0
    pgVariant = ''
    pgAccent = ''
    pgSize = ''
    pgDisabled = ''
    pgPending = ''
    pgIcon = ''
    pgBadge = ''
    pgLabel = ''
    pgClassName = ''
  }

  const code = $derived.by(() =>
    buildButtonSnippet({
      variant: pgVariant,
      accent: pgAccent,
      size: pgSize,
      disabled: pgDisabled,
      pending: pgPending,
      icon: pgIcon,
      badge: pgBadge,
      className: pgClassName,
    }),
  )

  const props: PropRow[] = [
    {
      name: 'variant',
      type: "'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'",
      defaultValue: "'secondary'",
      note: 'Visual treatment.',
    },
    {
      name: 'accent',
      type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'",
      defaultValue: "'cyan'",
      note: 'Tint for primary, outline, and badge.',
    },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", note: 'Control size.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Native disabled + reduced opacity.' },
    { name: 'pending', type: 'boolean', defaultValue: 'false', note: 'Disabled state with a spinner slot.' },
    { name: 'type', type: "'button' | 'submit' | 'reset'", defaultValue: "'button'", note: 'Native button type.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes appended to the button.' },
    { name: 'ariaPressed', type: 'boolean', defaultValue: '—', note: 'Toggle state for pressable buttons.' },
    { name: 'ariaExpanded', type: 'boolean', defaultValue: '—', note: 'Disclosure state for popover triggers.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for icon-only buttons.' },
    { name: 'onClick', type: '(event: MouseEvent) => void', defaultValue: '—', note: 'Click handler.' },
    { name: 'onKeyDown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown handler.' },
    {
      name: 'preventFocusSteal',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Keeps focus on the current element when clicked.',
    },
    { name: 'dataTip', type: 'string', defaultValue: '—', note: 'data-tip attribute for the host tooltip engine.' },
    { name: 'tooltip', type: 'string', defaultValue: '—', note: 'Wraps the button with the positioned Tooltip.' },
    { name: 'tooltipAlign', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Tooltip alignment.' },
    { name: 'badge', type: 'string | number', defaultValue: '—', note: 'Count pill overhanging the top-right corner.' },
    { name: 'icon', type: 'Snippet', defaultValue: '—', note: 'Leading icon; icon-only when no children.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Button label/content.' },
    {
      name: 'buttonEl',
      type: 'HTMLButtonElement | null',
      defaultValue: 'null',
      note: 'Bindable native button element.',
    },
  ]
</script>

{#snippet checkIcon()}
  <CheckIcon className="h-4 w-4" />
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
    <FormField label="Variant">
      <SelectDropdown
        buttonLabel={pgVariant || 'Default'}
        activeValue={pgVariant}
        ariaLabel="Variant"
        options={variants.map(value => ({ value, label: value }))}
        onSelect={value => (pgVariant = value)}
        clearable
        clearLabel="Clear variant"
        onClear={() => (pgVariant = '')} />
    </FormField>
    <FormField label="Accent">
      <SelectDropdown
        buttonLabel={pgAccent || 'Default'}
        activeValue={pgAccent}
        ariaLabel="Accent"
        options={accents.map(value => ({ value, label: value }))}
        onSelect={value => (pgAccent = value)}
        clearable
        clearLabel="Clear accent"
        onClear={() => (pgAccent = '')} />
    </FormField>
    <FormField label="Size">
      <SelectDropdown
        buttonLabel={pgSize || 'Default'}
        activeValue={pgSize}
        ariaLabel="Size"
        options={sizes.map(value => ({ value, label: value }))}
        onSelect={value => (pgSize = value)}
        clearable
        clearLabel="Clear size"
        onClear={() => (pgSize = '')} />
    </FormField>
    <FormField label="Disabled">
      <SelectDropdown
        buttonLabel={triLabel(pgDisabled)}
        activeValue={pgDisabled}
        ariaLabel="Disabled"
        options={yesNoOptions}
        onSelect={value => (pgDisabled = value as TriState)}
        clearable
        clearLabel="Clear disabled"
        onClear={() => (pgDisabled = '')} />
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
    <FormField label="Icon">
      <SelectDropdown
        buttonLabel={pgIcon ? 'Check icon' : 'Default'}
        activeValue={pgIcon}
        ariaLabel="Icon"
        options={iconOptions}
        onSelect={value => (pgIcon = value)}
        clearable
        clearLabel="Clear icon"
        onClear={() => (pgIcon = '')} />
    </FormField>
    <FormField label="Badge" htmlFor="pg-badge">
      <input
        id="pg-badge"
        bind:value={pgBadge}
        placeholder="new"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Label" htmlFor="pg-label">
      <input
        id="pg-label"
        bind:value={pgLabel}
        placeholder="Apply"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
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

<ShowcasePage name="Button" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{ clicks: pgClicks, label: demoLabel, checkIcon }}>
    <Button
      variant={demoVariant}
      accent={demoAccent}
      size={demoSize}
      {disabled}
      {pending}
      icon={pgIcon ? checkIcon : undefined}
      badge={pgBadge || undefined}
      className={pgClassName || undefined}
      onClick={() => (pgClicks += 1)}>
      {demoLabel} ({pgClicks})
    </Button>
  </ShowcaseSection>
</ShowcasePage>
