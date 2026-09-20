<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte'
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { buildAppShellSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgCollapseMode = $state('')
  let pgVisibility = $state('')

  const collapseModeOptions = [
    { value: 'hide', label: 'hide' },
    { value: 'rail', label: 'rail' },
  ]
  const visibilityOptions = [{ value: 'closed', label: 'Closed' }]

  const demoMode = $derived((pgCollapseMode || undefined) as 'hide' | 'rail' | undefined)
  const demoOpen = $derived(pgVisibility !== 'closed')

  const isCustomized = $derived(pgCollapseMode !== '' || pgVisibility !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgCollapseMode = ''
    pgVisibility = ''
  }

  const code = $derived.by(() => buildAppShellSnippet({ collapseMode: pgCollapseMode, visibility: pgVisibility }))

  const props: PropRow[] = [
    { name: 'open', type: 'boolean', defaultValue: 'true', note: 'Pane visibility. Bindable; or drive via onOpenChange.' },
    { name: 'paneSize', type: 'number', defaultValue: '288', note: 'Bindable pane width in px; clamped to min/max.' },
    { name: 'collapseMode', type: "'hide' | 'rail'", defaultValue: "'hide'", note: "Rail keeps a 64px rail with drag-to-collapse; hide removes the pane." },
    { name: 'railWidth', type: 'number', defaultValue: '64', note: 'Rail width and drag-collapse threshold in rail mode.' },
    { name: 'min', type: 'number', defaultValue: '160', note: 'Minimum drag width (rail mode uses railWidth instead).' },
    { name: 'max', type: 'number', defaultValue: '480', note: 'Maximum drag width.' },
    { name: 'defaultSize', type: 'number', defaultValue: '288', note: 'Width used on rail re-open and NaN fallback.' },
    { name: 'storageKey', type: 'string | undefined', defaultValue: 'undefined', note: 'Optional persistence; default none (session-only, no storage touch).' },
    { name: 'showToggle', type: 'boolean', defaultValue: 'true', note: 'Header collapse toggle (Button + MenuIcon).' },
    { name: 'toggleShowLabel', type: 'string | undefined', defaultValue: "i18n 'appShell.showPane'", note: 'Label override for the closed toggle.' },
    { name: 'toggleHideLabel', type: 'string | undefined', defaultValue: "i18n 'appShell.hidePane'", note: 'Label override for the open toggle.' },
    { name: 'resizeLabel', type: 'string | undefined', defaultValue: "i18n 'appShell.resize'", note: 'Splitter aria label override.' },
    { name: 'onOpenChange', type: '(open: boolean) => void', defaultValue: '—', note: 'Fires on toggle and rail collapse.' },
    { name: 'onPaneChange', type: '(size: number) => void', defaultValue: '—', note: 'Fires on splitter drag.' },
    { name: 'onDragEnd', type: '() => void', defaultValue: '—', note: 'Fires after drag; width already persisted.' },
    { name: 'headerLeft', type: 'Snippet', defaultValue: '—', note: 'Brand content left of the header toggle row.' },
    { name: 'headerRight', type: 'Snippet', defaultValue: '—', note: 'Controls (theme, language) at the header right.' },
    { name: 'leftPane', type: 'Snippet', defaultValue: '—', note: 'Left pane content; render a rail variant when closed.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Main content.' },
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
    <FormField label="Collapse mode">
      <SelectDropdown
        buttonLabel={collapseModeOptions.find(option => option.value === pgCollapseMode)?.label ?? 'Default'}
        activeValue={pgCollapseMode}
        ariaLabel="Collapse mode"
        options={collapseModeOptions}
        onSelect={value => (pgCollapseMode = value)}
        clearable
        clearLabel="Clear collapse mode"
        onClear={() => (pgCollapseMode = '')} />
    </FormField>
    <FormField label="Visibility">
      <SelectDropdown
        buttonLabel={visibilityOptions.find(option => option.value === pgVisibility)?.label ?? 'Default'}
        activeValue={pgVisibility}
        ariaLabel="Visibility"
        options={visibilityOptions}
        onSelect={value => (pgVisibility = value)}
        clearable
        clearLabel="Clear visibility"
        onClear={() => (pgVisibility = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="AppShell" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    code={code}
    footer={settingsPanel}
    scope={{
      demoTitle: i18n.t('showcase.title'),
      navLabel: i18n.t('showcase.components'),
      bodyText: i18n.t('showcase.intro'),
    }}>
    <div class="flex h-80 flex-col overflow-hidden rounded-lg border border-slate-800">
      <AppShell collapseMode={demoMode} open={demoOpen}>
        {#snippet headerLeft()}
          <span class="text-sm font-semibold text-slate-200">{i18n.t('showcase.title')}</span>
        {/snippet}
        {#snippet leftPane()}
          <p class="px-3 py-2 text-sm text-slate-300">{i18n.t('showcase.components')}</p>
        {/snippet}
        <p class="p-4 text-sm text-slate-300">{i18n.t('showcase.intro')}</p>
      </AppShell>
    </div>
  </ShowcaseSection>
</ShowcasePage>
