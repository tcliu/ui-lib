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
  let pgMode = $state('')
  let pgCollapseMode = $state('')
  let pgVisibility = $state('')
  let pgRightPane = $state('')

  const modeOptions = [
    { value: 'docked', label: 'Docked' },
    { value: 'floating', label: 'Floating' },
  ]
  const collapseModeOptions = [
    { value: 'hide', label: 'hide' },
    { value: 'rail', label: 'rail' },
  ]
  const visibilityOptions = [{ value: 'closed', label: 'Closed' }]
  const rightPaneOptions = [{ value: 'open', label: 'Open' }]

  const demoDrawerMode = $derived((pgMode || undefined) as 'docked' | 'floating' | undefined)
  const demoMode = $derived((pgCollapseMode || undefined) as 'hide' | 'rail' | undefined)
  const demoOpen = $derived(pgVisibility !== 'closed')
  const demoRightOpen = $derived(pgRightPane === 'open')

  const isCustomized = $derived(pgMode !== '' || pgCollapseMode !== '' || pgVisibility !== '' || pgRightPane !== '')
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgMode = ''
    pgCollapseMode = ''
    pgVisibility = ''
    pgRightPane = ''
  }

  const code = $derived.by(() =>
    buildAppShellSnippet({
      collapseMode: pgCollapseMode,
      visibility: pgVisibility,
      mode: pgMode,
      rightPane: pgRightPane,
    }),
  )

  const props: PropRow[] = [
    {
      name: 'mode',
      type: "'auto' | 'docked' | 'floating'",
      defaultValue: "'auto'",
      note: 'Auto docks beside content while the shell container is wide and floats above it when narrow (measured on the shell, not the viewport). Rail panes always dock.',
    },
    {
      name: 'open',
      type: 'boolean',
      defaultValue: 'true',
      note: 'Left pane visibility. Bindable; or drive via onOpenChange.',
    },
    {
      name: 'paneSize',
      type: 'number',
      defaultValue: '288',
      note: 'Bindable left pane width in px; clamped to min/max.',
    },
    {
      name: 'collapseMode',
      type: "'hide' | 'rail'",
      defaultValue: "'hide'",
      note: 'Rail keeps a 64px rail with drag-to-collapse; hide removes the pane.',
    },
    {
      name: 'railWidth',
      type: 'number',
      defaultValue: '64',
      note: 'Rail width and drag-collapse threshold in rail mode.',
    },
    {
      name: 'min',
      type: 'number',
      defaultValue: '160',
      note: 'Minimum drag width (rail mode uses railWidth instead).',
    },
    { name: 'max', type: 'number', defaultValue: '480', note: 'Maximum drag width.' },
    { name: 'defaultSize', type: 'number', defaultValue: '288', note: 'Width used on rail re-open and NaN fallback.' },
    {
      name: 'storageKey',
      type: 'string | undefined',
      defaultValue: 'undefined',
      note: 'Optional persistence; default none (session-only, no storage touch).',
    },
    { name: 'showToggle', type: 'boolean', defaultValue: 'true', note: 'Header collapse toggle (Button + MenuIcon).' },
    {
      name: 'toggleShowLabel',
      type: 'string | undefined',
      defaultValue: "i18n 'appShell.showPane'",
      note: 'Label override for the closed toggle.',
    },
    {
      name: 'toggleHideLabel',
      type: 'string | undefined',
      defaultValue: "i18n 'appShell.hidePane'",
      note: 'Label override for the open toggle.',
    },
    {
      name: 'resizeLabel',
      type: 'string | undefined',
      defaultValue: "i18n 'appShell.resize'",
      note: 'Splitter aria label override.',
    },
    {
      name: 'leftPaneLabel',
      type: 'string | undefined',
      defaultValue: "i18n 'appShell.leftPane'",
      note: 'Left pane aria label override.',
    },
    {
      name: 'rightPaneLabel',
      type: 'string | undefined',
      defaultValue: "i18n 'appShell.rightPane'",
      note: 'Right pane aria label override.',
    },
    {
      name: 'closeLabel',
      type: 'string | undefined',
      defaultValue: "i18n 'appShell.closePane'",
      note: 'Floating backdrop aria label override.',
    },
    {
      name: 'rightOpen',
      type: 'boolean',
      defaultValue: 'false',
      note: 'Right pane visibility. Bindable; or drive via onRightOpenChange.',
    },
    {
      name: 'rightPaneSize',
      type: 'number',
      defaultValue: '288',
      note: 'Bindable right pane width in px; clamped to min/max.',
    },
    {
      name: 'rightCollapseMode',
      type: "'hide' | 'rail'",
      defaultValue: "'hide'",
      note: 'Rail behavior for the right pane (docked only).',
    },
    {
      name: 'rightStorageKey',
      type: 'string | undefined',
      defaultValue: 'undefined',
      note: 'Optional persistence for the right pane width.',
    },
    {
      name: 'showRightToggle',
      type: 'boolean',
      defaultValue: 'true',
      note: 'Header toggle for the right pane (renders when rightPane is passed).',
    },
    {
      name: 'rightToggleShowLabel',
      type: 'string | undefined',
      defaultValue: "i18n 'appShell.showRightPane'",
      note: 'Label override for the closed right toggle.',
    },
    {
      name: 'rightToggleHideLabel',
      type: 'string | undefined',
      defaultValue: "i18n 'appShell.hideRightPane'",
      note: 'Label override for the open right toggle.',
    },
    {
      name: 'rightResizeLabel',
      type: 'string | undefined',
      defaultValue: "i18n 'appShell.resizeRight'",
      note: 'Right splitter aria label override.',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      defaultValue: '—',
      note: 'Fires on left toggle and rail collapse.',
    },
    { name: 'onPaneChange', type: '(size: number) => void', defaultValue: '—', note: 'Fires on left splitter drag.' },
    {
      name: 'onDragEnd',
      type: '() => void',
      defaultValue: '—',
      note: 'Fires after left drag; width already persisted.',
    },
    {
      name: 'onRightOpenChange',
      type: '(open: boolean) => void',
      defaultValue: '—',
      note: 'Fires on right toggle and rail collapse.',
    },
    {
      name: 'onRightPaneChange',
      type: '(size: number) => void',
      defaultValue: '—',
      note: 'Fires on right splitter drag.',
    },
    {
      name: 'onRightDragEnd',
      type: '() => void',
      defaultValue: '—',
      note: 'Fires after right drag; width already persisted.',
    },
    { name: 'headerLeft', type: 'Snippet', defaultValue: '—', note: 'Brand content left of the header toggle row.' },
    {
      name: 'headerRight',
      type: 'Snippet',
      defaultValue: '—',
      note: 'Controls (theme, language) at the header right.',
    },
    {
      name: 'leftPane',
      type: 'Snippet',
      defaultValue: '—',
      note: 'Left pane content; render a rail variant when closed.',
    },
    { name: 'rightPane', type: 'Snippet', defaultValue: '—', note: 'Right pane content; enables the right drawer.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Main content.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon className="h-4 w-4" />
{/snippet}

{#snippet rightPaneContent()}
  <p class="px-3 py-2 text-sm text-slate-300">{i18n.t('showcase.intro')}</p>
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Drawer mode">
      <SelectDropdown
        buttonLabel={modeOptions.find(option => option.value === pgMode)?.label ?? 'Default'}
        activeValue={pgMode}
        ariaLabel="Drawer mode"
        options={modeOptions}
        onSelect={value => (pgMode = value)}
        clearable
        clearLabel="Clear drawer mode"
        onClear={() => (pgMode = '')} />
    </FormField>
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
    <FormField label="Right pane">
      <SelectDropdown
        buttonLabel={rightPaneOptions.find(option => option.value === pgRightPane)?.label ?? 'Default'}
        activeValue={pgRightPane}
        ariaLabel="Right pane"
        options={rightPaneOptions}
        onSelect={value => (pgRightPane = value)}
        clearable
        clearLabel="Clear right pane"
        onClear={() => (pgRightPane = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="AppShell" props={propsSnippet} wide>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{
      demoTitle: i18n.t('showcase.title'),
      navLabel: i18n.t('showcase.components'),
      bodyText: i18n.t('showcase.intro'),
    }}>
    <!-- The stage keeps the shell's own container at or above the dock
      breakpoint so the demo shows the docked layout instead of `auto` floating
      the pane over the text whenever the page (or an embedding preview pane)
      is narrower. Narrower viewports scroll this stage instead of the page. -->
    <div class="w-full min-w-0 overflow-x-auto" tabindex="-1">
      <div class="flex h-80 w-full min-w-[49rem] flex-col overflow-hidden rounded-lg border border-slate-800">
        <AppShell
          mode={demoDrawerMode}
          collapseMode={demoMode}
          open={demoOpen}
          rightOpen={demoRightOpen}
          rightPane={demoRightOpen ? rightPaneContent : undefined}>
          {#snippet headerLeft()}
            <span class="text-sm font-semibold text-slate-200">{i18n.t('showcase.title')}</span>
          {/snippet}
          {#snippet leftPane()}
            <p class="px-3 py-2 text-sm text-slate-300">{i18n.t('showcase.components')}</p>
          {/snippet}
          <p class="p-4 text-sm text-slate-300">{i18n.t('showcase.intro')}</p>
        </AppShell>
      </div>
    </div>
  </ShowcaseSection>
</ShowcasePage>


