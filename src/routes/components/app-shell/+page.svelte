<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte'
  import Button from '$lib/components/Button.svelte'
  import MenuIcon from '$lib/icons/MenuIcon.svelte'
  import type { AppShellHeaderApi } from '$lib/app-shell'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import Resizable from '$lib/components/Resizable.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import {
    buildAppShellSnippet,
    SHELL_STAGE_DEFAULT_HEIGHT,
    SHELL_STAGE_DEFAULT_WIDTH,
    SHELL_STAGE_HOST,
    SHELL_STAGE_MAX_HEIGHT,
    SHELL_STAGE_MIN_HEIGHT,
    SHELL_STAGE_MIN_WIDTH,
    SHELL_STAGE_PANE,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgMode = $state('')
  let pgCollapseMode = $state('')
  let pgVisibility = $state('')
  let pgRightPane = $state('')
  let pgFooter = $state('')
  // Stage size is interaction state, not a curated option, so it stays out of
  // isCustomized; Reset restores the default.
  let pgStageWidth = $state(SHELL_STAGE_DEFAULT_WIDTH)
  let pgStageHeight = $state(SHELL_STAGE_DEFAULT_HEIGHT)

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
  const footerOptions = [{ value: 'show', label: 'Show' }]

  const demoDrawerMode = $derived((pgMode || undefined) as 'docked' | 'floating' | undefined)
  const demoMode = $derived((pgCollapseMode || undefined) as 'hide' | 'rail' | undefined)
  const demoOpen = $derived(pgVisibility !== 'closed')
  const demoRightOpen = $derived(pgRightPane === 'open')
  const demoFooterOpen = $derived(pgFooter === 'show')

  const isCustomized = $derived(
    pgMode !== '' || pgCollapseMode !== '' || pgVisibility !== '' || pgRightPane !== '' || pgFooter !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground(): void {
    pgMode = ''
    pgCollapseMode = ''
    pgVisibility = ''
    pgRightPane = ''
    pgFooter = ''
    pgStageWidth = SHELL_STAGE_DEFAULT_WIDTH
    pgStageHeight = SHELL_STAGE_DEFAULT_HEIGHT
  }

  const code = $derived.by(() =>
    buildAppShellSnippet({
      collapseMode: pgCollapseMode,
      visibility: pgVisibility,
      mode: pgMode,
      rightPane: pgRightPane,
      footer: pgFooter,
    }),
  )

  const props: PropRow[] = [
    {
      name: 'mode',
      type: "'auto' | 'docked' | 'floating'",
      defaultValue: "'auto'",
      note: 'Auto docks beside content while the shell container is wide and floats above it when narrow (measured on the shell, not the viewport). Pinned docked stays an in-flow row at every width; rail panes float as an open-or-closed overlay below the breakpoint.',
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
    {
      name: 'header',
      type: 'Snippet<[AppShellHeaderApi]>',
      defaultValue: '—',
      note: 'Header content; receives open/rightOpen state plus toggleLeft/toggleRight callbacks for caller-rendered toggles.',
    },
    {
      name: 'footer',
      type: 'Snippet',
      defaultValue: '—',
      note: 'Footer content; rendered only when passed.',
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
  <ResetIcon size="sm" />
{/snippet}

{#snippet rightPaneContent()}
  <p class="px-3 py-2 text-sm text-slate-300">{i18n.t('showcase.intro')}</p>
{/snippet}

{#snippet footerContent()}
  <div class="flex min-w-0 flex-1 items-center justify-between gap-4">
    <span class="text-xs text-slate-400">{i18n.t('showcase.components')}</span>
    <span class="text-xs text-slate-400">{i18n.t('showcase.title')}</span>
  </div>
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
    <FormField label="Footer">
      <SelectDropdown
        buttonLabel={footerOptions.find(option => option.value === pgFooter)?.label ?? 'Default'}
        activeValue={pgFooter}
        ariaLabel="Footer"
        options={footerOptions}
        onSelect={value => (pgFooter = value)}
        clearable
        clearLabel="Clear footer"
        onClear={() => (pgFooter = '')} />
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
      showLabel: i18n.t('appShell.showPane'),
      hideLabel: i18n.t('appShell.hidePane'),
    }}>
    <!-- The demo is wrapped in `Resizable`: shrinking the stage floats the
      pane over the text when narrow, so the responsive behavior can be
      inspected in place without resizing the window. The pane carries no
      padding, so the shell lines up with the settings panel below it. -->
    <div class={SHELL_STAGE_HOST}>
      <Resizable
        width={pgStageWidth}
        height={pgStageHeight}
        minWidth={SHELL_STAGE_MIN_WIDTH}
        minHeight={SHELL_STAGE_MIN_HEIGHT}
        maxWidth="parent"
        maxHeight={SHELL_STAGE_MAX_HEIGHT}
        onResize={(nextWidth, nextHeight) => {
          pgStageWidth = nextWidth
          pgStageHeight = nextHeight
        }}>
        <div class={SHELL_STAGE_PANE}>
          <AppShell
            className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-800"
            mode={demoDrawerMode}
            collapseMode={demoMode}
            open={demoOpen}
            rightOpen={demoRightOpen}
            rightPane={demoRightOpen ? rightPaneContent : undefined}
            footer={demoFooterOpen ? footerContent : undefined}>
            {#snippet header(api: AppShellHeaderApi)}
              {@const toggleLabel = api.open ? i18n.t('appShell.hidePane') : i18n.t('appShell.showPane')}
              <Button
                variant="secondary"
                size="sm"
                className="-ml-1"
                ariaLabel={toggleLabel}
                ariaExpanded={api.open}
                tooltip={toggleLabel}
                tooltipAlign="left"
                preventFocusSteal
                onClick={api.toggleLeft}>
                {#snippet icon()}
                  <MenuIcon size="sm" />
                {/snippet}
              </Button>
              <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200">{i18n.t('showcase.title')}</span>
            {/snippet}
            {#snippet leftPane()}
              <p class="px-3 py-2 text-sm text-slate-300">{i18n.t('showcase.components')}</p>
            {/snippet}
            <p class="p-4 text-sm text-slate-300">{i18n.t('showcase.intro')}</p>
          </AppShell>
        </div>
      </Resizable>
    </div>
  </ShowcaseSection>
</ShowcasePage>
