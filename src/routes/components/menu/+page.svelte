<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import Menu, { type MenuItemState } from '$lib/components/Menu.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import KebabIcon from '$lib/icons/KebabIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildMenuSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  interface DemoItem {
    id: string
    label: string
    disabled?: boolean
    onClick: () => void
  }

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgAlign = $state('')
  let pgTriggerLabel = $state('')
  let pgFirstLabel = $state('')
  let pgSecondLabel = $state('')
  let pgLastAction = $state('')

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  const demoAlign = $derived((pgAlign || undefined) as 'left' | 'right' | undefined)
  const triggerLabel = $derived(pgTriggerLabel || i18n.t('kebab.label'))
  const firstLabel = $derived(pgFirstLabel || i18n.t('showcase.edit'))
  const secondLabel = $derived(pgSecondLabel || i18n.t('showcase.delete'))

  function menuItemClass(item: DemoItem, state: MenuItemState): string {
    return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm outline-none transition ${
      state.disabled
        ? 'cursor-not-allowed text-slate-600'
        : 'text-slate-300 hover:bg-slate-800 hover:text-cyan-200 focus:bg-slate-800 focus:text-cyan-200'
    }`
  }

  const demoItems = $derived<DemoItem[]>([
    { id: 'edit', label: firstLabel, onClick: () => (pgLastAction = firstLabel) },
    { id: 'delete', label: secondLabel, onClick: () => (pgLastAction = secondLabel) },
  ])

  const isCustomized = $derived(pgAlign !== '' || pgTriggerLabel !== '' || pgFirstLabel !== '' || pgSecondLabel !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgAlign = ''
    pgTriggerLabel = ''
    pgFirstLabel = ''
    pgSecondLabel = ''
    pgLastAction = ''
  }

  const code = $derived.by(() =>
    buildMenuSnippet({ align: pgAlign, triggerLabel: pgTriggerLabel, firstLabel: pgFirstLabel, secondLabel: pgSecondLabel })
  )

  const props: PropRow[] = [
    { name: 'items', type: 'T[]', defaultValue: '—', note: 'Row entries.' },
    { name: 'itemKey', type: '(item: T) => string', defaultValue: '—', note: 'Stable key per row.' },
    { name: 'onSelect', type: '(index: number) => void', defaultValue: '—', note: 'Called with the picked row index.' },
    { name: 'icon', type: 'Snippet', defaultValue: '—', note: 'Trigger icon.' },
    { name: 'item', type: 'Snippet<[item, state]>', defaultValue: '—', note: 'Row renderer.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger.' },
    { name: 'align', type: "'left' | 'right'", defaultValue: "'left'", note: 'Panel edge anchored to the trigger.' },
    { name: 'autoPlace', type: 'boolean', defaultValue: 'true', note: 'Flips the panel when crowded.' },
    { name: 'triggerClass', type: 'string', defaultValue: "''", note: 'Extra classes for the trigger button.' },
    { name: 'panelClass', type: 'string', defaultValue: "''", note: 'Extra classes for the floating panel.' },
    { name: 'itemClass', type: '(item, state) => string', defaultValue: '—', note: 'Row classes by state.' },
    { name: 'itemDisabled', type: '(item: T) => boolean', defaultValue: '() => false', note: 'Disables a row.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon className="h-4 w-4" />
{/snippet}

{#snippet menuTriggerIcon()}
  <KebabIcon className="h-4 w-4" />
{/snippet}

{#snippet menuRow(item: DemoItem, _state: MenuItemState)}
  {item.label}
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
    <FormField label="Align">
      <SelectDropdown
        buttonLabel={pgAlign || 'Default'}
        activeValue={pgAlign}
        ariaLabel="Align"
        options={alignOptions}
        onSelect={value => (pgAlign = value)}
        clearable
        clearLabel="Clear align"
        onClear={() => (pgAlign = '')} />
    </FormField>
    <FormField label="Trigger label" htmlFor="pg-trigger">
      <input
        id="pg-trigger"
        bind:value={pgTriggerLabel}
        placeholder="More actions"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="First item" htmlFor="pg-first">
      <input
        id="pg-first"
        bind:value={pgFirstLabel}
        placeholder="Edit"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
    <FormField label="Second item" htmlFor="pg-second">
      <input
        id="pg-second"
        bind:value={pgSecondLabel}
        placeholder="Delete"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Menu" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    code={code}
    footer={settingsPanel}
    scope={{
      menuItemClass,
      editLabel: i18n.t('showcase.edit'),
      deleteLabel: i18n.t('showcase.delete'),
      triggerLabel: i18n.t('kebab.label'),
      lastAction: pgLastAction,
    }}>
    <div class="flex items-center gap-4">
      <Menu
        items={demoItems}
        itemKey={item => item.id}
        onSelect={index => demoItems[index].onClick()}
        icon={menuTriggerIcon}
        item={menuRow}
        ariaLabel={triggerLabel}
        align={demoAlign}
        triggerClass="p-2"
        panelClass="w-44"
        itemClass={menuItemClass}
        itemDisabled={item => item.disabled ?? false} />
      <span class="text-sm text-slate-400">last action: {pgLastAction || '—'}</span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
