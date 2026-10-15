<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte'
  import Button from '$lib/components/Button.svelte'
  import MenuIcon from '$lib/icons/MenuIcon.svelte'
  import type { AppShellHeaderApi } from '$lib/app-shell'
  import Resizable from '$lib/components/Resizable.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { jsonField, snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import {
    APP_SHELL_HEADER_MARKUP,
    appShellChildrenMarkup,
    appShellFooterMarkup,
    appShellLeftPaneMarkup,
    appShellRightPaneMarkup,
    buildAppShellSnippet,
    classNamesJsonText,
    normalizeAppShellFooter,
    paneJsonText,
    parseAppShellChildren,
    parseAppShellFooter,
    parseAppShellLeftPane,
    parseAppShellRightPane,
    parseClassNamesExpression,
    parseClassNamesJson,
    parsePaneExpression,
    parsePaneJson,
    SHELL_FOOTER_ROW_CLASS,
    SHELL_FOOTER_TEXT_CLASS,
    SHELL_STAGE_DEFAULT_HEIGHT,
    SHELL_STAGE_DEFAULT_WIDTH,
    SHELL_STAGE_FRAME,
    SHELL_STAGE_MAX_HEIGHT,
    SHELL_STAGE_MIN_HEIGHT,
    SHELL_STAGE_MIN_WIDTH,
    SHELL_PANE_ITEM,
    SHELL_PANE_LABEL,
    type AppShellClassNamesJson,
    type AppShellPaneJson,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. The pane
  // configs are plain-data objects behind JSON dialogs; the right-pane snippet
  // rides on the right config's open flag and the footer snippet on the footer
  // row, so no separate demo-data panel is needed; stage size is interaction
  // state.
  let pgMode = $state('auto')
  let pgModeOn = $state(false)
  // The serializable pane configs. Empty renders the component default, so the
  // cleared form applies no overrides; the callbacks in `AppShellPaneConfig`
  // ride the demo objects below, never the editor text.
  let pgLeft = $state<AppShellPaneJson>({})
  let pgRight = $state<AppShellPaneJson>({})
  // The pane configs apply only while their eye toggle is on (both on, so the
  // cleared form renders the current demo).
  let pgLeftEnabled = $state(true)
  let pgRightEnabled = $state(true)
  // The locale-resolved default; the eye stages the customization (off, so
  // the component default renders).
  let pgCloseLabel = $state(i18n.t('appShell.closePane'))
  let pgCloseLabelOn = $state(false)
  // The shell frame default; the eye stages the customization (off, so the
  // component default renders).
  const DEFAULT_SHELL_CLASS = 'flex h-full min-h-0 flex-col bg-slate-950 text-slate-100'
  let pgClassName = $state('flex h-full min-h-0 flex-col bg-slate-950 text-slate-100')
  let pgClassNameOn = $state(false)
  // Extra region classes as a plain-data object behind a JSON dialog; the eye
  // applies the map (on, so the cleared form renders the current demo).
  let pgClassNames = $state<AppShellClassNamesJson>({})
  let pgClassNamesEnabled = $state(true)
  let pgFooter = $state('')
  // Content-snippet text. Empty renders the localized default from scope, so
  // the cleared form applies no overrides; `pgFooter` holds the committed
  // footer markup (the footer row's eye toggle applies it).
  let pgChildren = $state('')
  let pgChildrenEnabled = $state(true)
  let pgFooterEnabled = $state(false)
  let pgLeftPane = $state('')
  let pgRightPane = $state('')
  // The pane contents apply only while their eye toggle is on (both on, so
  // the cleared form renders the current demo); the texts are preserved while
  // off. The header is fixed documentation markup with the same eye.
  let pgLeftPaneEnabled = $state(true)
  let pgRightPaneEnabled = $state(true)
  let pgHeaderEnabled = $state(true)
  // Stage size is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(SHELL_STAGE_DEFAULT_WIDTH)
  let pgStageHeight = $state(SHELL_STAGE_DEFAULT_HEIGHT)

  const modeOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'docked', label: 'docked' },
    { value: 'floating', label: 'floating' },
  ]

  const demoMode = $derived(pgModeOn ? ((pgMode || undefined) as 'auto' | 'docked' | 'floating' | undefined) : undefined)
  // Unset renders the component default: the right pane stays shut until its
  // config opens it (which also applies its snippet below).
  const demoRightOpen = $derived(pgRight.open ?? false)
  const demoChildrenMarkup = $derived(pgChildren || appShellChildrenMarkup(i18n.t('showcase.intro')))
  const demoLeftPaneLabel = $derived(pgLeftPane || i18n.t('showcase.components'))
  const demoRightPaneText = $derived(pgRightPane || i18n.t('showcase.intro'))
  // children/footer seed their markup dialogs: children seeds the canonical
  // padded <p> (or the committed free-form markup), footer seeds the committed
  // markup (or the canonical block when hidden, so the dialog opens on real
  // markup). `footerParsed` drives the demo's footer, which renders only while
  // `pgFooter` is set.
  // The footer dialog seeds the committed markup, or the canonical block when
  // unset; `footerParsed` drives the demo, which renders only while the footer
  // is applied.
  const footerSnippet = $derived(
    pgFooter || appShellFooterMarkup(i18n.t('showcase.components'), i18n.t('showcase.title')),
  )
  const footerParsed = $derived(parseAppShellFooter(footerSnippet))

  function clearPlayground(): void {
    pgMode = 'auto'
    pgModeOn = false
    pgLeft = {}
    pgRight = {}
    pgLeftEnabled = true
    pgRightEnabled = true
    pgCloseLabel = i18n.t('appShell.closePane')
    pgCloseLabelOn = false
    pgClassName = 'flex h-full min-h-0 flex-col bg-slate-950 text-slate-100'
    pgClassNameOn = false
    pgClassNames = {}
    pgClassNamesEnabled = true
    pgFooter = ''
    pgChildren = ''
    pgChildrenEnabled = true
    pgFooterEnabled = false
    pgLeftPane = ''
    pgRightPane = ''
    pgLeftPaneEnabled = true
    pgRightPaneEnabled = true
    pgHeaderEnabled = true
    pgStageWidth = SHELL_STAGE_DEFAULT_WIDTH
    pgStageHeight = SHELL_STAGE_DEFAULT_HEIGHT
  }

  // The two pane configs are object props: the JSON dialogs own the
  // serializable values, and the callbacks ride here internally so no
  // function ever enters the editor text. The change handlers write the
  // drawer's own open/size back into the JSON state, keeping the dialog seed
  // and the snippet behind the header toggles and splitter drags.
  const demoLeft = $derived({
    ...pgLeft,
    onOpenChange: (open: boolean) => {
      pgLeft = { ...pgLeft, open }
    },
    onSizeChange: (size: number) => {
      pgLeft = { ...pgLeft, size }
    },
  })
  const demoRight = $derived({
    ...pgRight,
    onOpenChange: (open: boolean) => {
      pgRight = { ...pgRight, open }
    },
    onSizeChange: (size: number) => {
      pgRight = { ...pgRight, size }
    },
  })
  const demoClassNames = $derived({ ...pgClassNames })

  const code = $derived.by(() =>
    buildAppShellSnippet({
      mode: pgMode,
      modeOn: pgModeOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      closeLabel: pgCloseLabel,
      closeLabelOn: pgCloseLabelOn,
      classNames: pgClassNames,
      classNamesEnabled: pgClassNamesEnabled,
      left: pgLeft,
      right: pgRight,
      leftEnabled: pgLeftEnabled,
      rightEnabled: pgRightEnabled,
      children: pgChildren,
      childrenEnabled: pgChildrenEnabled,
      leftPane: pgLeftPane,
      leftPaneEnabled: pgLeftPaneEnabled,
      headerEnabled: pgHeaderEnabled,
      rightPane: pgRightPane,
      rightPaneEnabled: pgRightPaneEnabled,
      footer: footerSnippet,
      footerEnabled: pgFooterEnabled,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      demoTitle: i18n.t('showcase.title'),
      navLabel: i18n.t('showcase.components'),
      bodyText: i18n.t('showcase.intro'),
      showLabel: i18n.t('appShell.showPane'),
      hideLabel: i18n.t('appShell.hidePane'),
    }),
    sync: { tag: 'AppShell', getFields: () => syncFields },
  })

  // children/footer are Snippet props: their rows open a markup dialog instead
  // of an inline editor. Only markup the static demo can reproduce exactly is
  // valid, so OK disables for anything else: children takes free-form HTML the
  // demo renders verbatim through `{@html}` (no expressions, components,
  // scripts, or handlers), footer the fixed two-span row.

  // Editable rows first (primitives, plain data, and snippets, A–Z), then the
  // function props (A–Z). children/footer open a markup dialog; the class-name
  // map and the pane configs edit as JSON through their own dialogs (callbacks
  // ride the demo object internally); the rest are read-only rows.
  const fields: SyncableFieldConfig[] = $derived([
    snippetField({
      name: 'children',
      note: 'Main content block; any well-formed HTML elements (no expressions or handlers). Committing applies it.',
      value: demoChildrenMarkup,
      onChange: (draft: string) => {
        const markup = parseAppShellChildren(draft)
        if (markup === null) return
        pgChildren = markup === appShellChildrenMarkup(i18n.t('showcase.intro')) ? '' : markup
        pgChildrenEnabled = true
      },
      dialog: snippetDialog(
        parseAppShellChildren,
        'Use well-formed HTML elements only — no {…} expressions, components, <script>/<style>, or event-handler attributes.',
      ),
      toggle: snippetToggle(pgChildrenEnabled, enabled => (pgChildrenEnabled = enabled)),
    }),
    {
      name: 'className',
      type: 'string?',
      defaultValue: "'flex h-full min-h-0 flex-col bg-slate-950 text-slate-100'",
      editorDefaultValue: 'flex h-full min-h-0 flex-col bg-slate-950 text-slate-100',
      note: 'Replaces the shell frame classes; unset, the component default renders inside the sized demo stage; the eye stages the customization.',
      editor: 'text',
      clearable: true,
      value: pgClassName,
      onChange: value => {
        pgClassName = value
        pgClassNameOn = true
      },
      toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)),
      placeholder: 'flex h-full min-h-0 flex-col bg-slate-950 text-slate-100',
      sync: {
        kind: 'custom',
        // Absent resolves to the current Value text so compiling (e.g.
        // opening Show-code) never stages the default into the form; the
        // setter maps the default back to unset, keeping committed custom
        // text and the eye alone.
        read: attrs => {
          if (!attrs) return undefined
          if (!attrs.has('className')) return pgClassName
          const attr = attrs.get('className')!
          return attr.kind === 'string' ? attr.value : undefined
        },
        set: value => {
          pgClassName = value === DEFAULT_SHELL_CLASS ? '' : value
        },
      },
    },
    jsonField({
      name: 'classNames',
      type: '{ header?: string; footer?: string; pane?: string; rightPane?: string; main?: string; splitter?: string }',
      note: 'Extra classes for the shell regions as JSON (unset stays null for the built-in classes); the eye applies the map.',
      value: classNamesJsonText(pgClassNames),
      onChange: (draft: string) => {
        const parsed = parseClassNamesJson(draft)
        if (parsed) pgClassNames = parsed
      },
      dialog: snippetDialog(
        parseClassNamesJson,
        'Invalid class-names JSON. Use an object with optional header/footer/pane/rightPane/main/splitter strings.',
      ),
      toggle: snippetToggle(pgClassNamesEnabled, enabled => (pgClassNamesEnabled = enabled)),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          // An absent attribute leaves the playground alone (resolving to the
          // current state): unapplying the eye omits the prop from the seed
          // without resetting the committed JSON behind it.
          if (!attrs.has('classNames')) return classNamesJsonText(pgClassNames)
          const attr = attrs.get('classNames')!
          if (attr.kind !== 'expression') return undefined
          const parsed = parseClassNamesExpression(attr.value)
          return parsed ? classNamesJsonText(parsed) : undefined
        },
      },
    }),
    {
      name: 'closeLabel',
      type: 'string?',
      defaultValue: "i18n 'appShell.closePane'",
      note: 'Floating backdrop aria label override; the eye stages the customization.',
      editor: 'text',
      clearable: true,
      value: pgCloseLabel,
      onChange: value => {
        pgCloseLabel = value
        pgCloseLabelOn = true
      },
      toggle: snippetToggle(pgCloseLabelOn, enabled => (pgCloseLabelOn = enabled)),
      sync: { kind: 'text' },
    },
    snippetField({
      name: 'footer',
      note: 'Footer block; committing applies it, and the dialog edits its markup.',
      value: footerSnippet,
      onChange: (draft: string) => {
        if (parseAppShellFooter(draft)) {
          pgFooter = normalizeAppShellFooter(draft)
          pgFooterEnabled = true
        }
      },
      dialog: snippetDialog(parseAppShellFooter, 'Use the footer <div> with two text <span>s.'),
      toggle: snippetToggle(pgFooterEnabled, enabled => (pgFooterEnabled = enabled)),
    }),
    snippetField({
      type: 'Snippet<[AppShellHeaderApi]>',
      name: 'header',
      note: 'Header content; the fixed toggle-plus-title shape below documents the api callbacks (open, rightOpen, toggleLeft, toggleRight). The eye applies the header.',
      value: APP_SHELL_HEADER_MARKUP,
      onChange: () => {
        pgHeaderEnabled = true
      },
      toggle: snippetToggle(pgHeaderEnabled, enabled => (pgHeaderEnabled = enabled)),
    }),
    jsonField({
      name: 'left',
      type: 'AppShellPaneConfig',
      note: 'Left pane config as JSON: open, size, collapseMode, geometry, storageKey, and labels (unset stays null for the component default). The open/size callbacks ride the demo object internally; the eye applies the prop.',
      value: paneJsonText(pgLeft),
      onChange: (draft: string) => {
        const parsed = parsePaneJson(draft)
        if (parsed) pgLeft = parsed
      },
      dialog: snippetDialog(
        parsePaneJson,
        'Invalid pane JSON. Use an object with optional open (boolean), size/railWidth/min/max/defaultSize (numbers), collapseMode ("hide" or "rail"), and storageKey/resizeLabel/paneLabel (strings).',
      ),
      toggle: snippetToggle(pgLeftEnabled, enabled => (pgLeftEnabled = enabled)),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          // An absent attribute leaves the playground alone (resolving to the
          // current state): unapplying the eye omits the prop from the seed
          // without resetting the committed JSON behind it.
          if (!attrs.has('left')) return paneJsonText(pgLeft)
          const attr = attrs.get('left')!
          if (attr.kind !== 'expression') return undefined
          const parsed = parsePaneExpression(attr.value)
          return parsed ? paneJsonText(parsed) : undefined
        },
      },
    }),
    snippetField({
      name: 'leftPane',
      note: 'Left pane content; the dialog edits its label text, and the eye applies the pane.',
      value: appShellLeftPaneMarkup(demoLeftPaneLabel),
      onChange: (draft: string) => {
        const text = parseAppShellLeftPane(draft)
        if (text === null) return
        pgLeftPane = text === i18n.t('showcase.components') ? '' : text
        pgLeftPaneEnabled = true
      },
      dialog: snippetDialog(
        parseAppShellLeftPane,
        `Use the caller row with <MenuIcon> and the <span class="${SHELL_PANE_LABEL}"> label.`,
      ),
      toggle: snippetToggle(pgLeftPaneEnabled, enabled => (pgLeftPaneEnabled = enabled)),
    }),
    {
      name: 'mode',
      type: "'auto' | 'docked' | 'floating'",
      defaultValue: "'auto'",
      note: 'Auto docks beside content while the shell container is wide and floats above it when narrow (measured on the shell, not the viewport). Pinned docked stays an in-flow row at every width; rail panes float as an open-or-closed overlay below the breakpoint; the eye stages the customization.',
      editor: 'enum',
      options: modeOptions,
      value: pgMode,
      onChange: value => {
        pgMode = value
        pgModeOn = true
      },
      placeholder: 'auto',
      clearLabel: 'Clear mode',
      toggle: snippetToggle(pgModeOn, enabled => (pgModeOn = enabled)),
      sync: { kind: 'text' },
    },
    jsonField({
      name: 'right',
      type: 'AppShellPaneConfig',
      note: 'Right pane config as JSON: open, size, collapseMode, geometry, storageKey, and labels (unset stays null for the component default). Opening it applies the right-pane snippet; callbacks ride the demo object internally, and the eye applies the prop.',
      value: paneJsonText(pgRight),
      onChange: (draft: string) => {
        const parsed = parsePaneJson(draft)
        if (parsed) pgRight = parsed
      },
      dialog: snippetDialog(
        parsePaneJson,
        'Invalid pane JSON. Use an object with optional open (boolean), size/railWidth/min/max/defaultSize (numbers), collapseMode ("hide" or "rail"), and storageKey/resizeLabel/paneLabel (strings).',
      ),
      toggle: snippetToggle(pgRightEnabled, enabled => (pgRightEnabled = enabled)),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          // An absent attribute leaves the playground alone (resolving to the
          // current state): unapplying the eye omits the prop from the seed
          // without resetting the committed JSON behind it.
          if (!attrs.has('right')) return paneJsonText(pgRight)
          const attr = attrs.get('right')!
          if (attr.kind !== 'expression') return undefined
          const parsed = parsePaneExpression(attr.value)
          return parsed ? paneJsonText(parsed) : undefined
        },
      },
    }),
    snippetField({
      name: 'rightPane',
      note: 'Right pane content; enables the right drawer. The dialog edits its text, and the eye applies the pane (with the right config eye).',
      value: appShellRightPaneMarkup(demoRightPaneText),
      onChange: (draft: string) => {
        const text = parseAppShellRightPane(draft)
        if (text === null) return
        pgRightPane = text === i18n.t('showcase.intro') ? '' : text
        pgRightPaneEnabled = true
      },
      dialog: snippetDialog(parseAppShellRightPane, 'Use <p class="px-3 py-2 text-sm text-slate-300">…</p>.'),
      toggle: snippetToggle(pgRightPaneEnabled, enabled => (pgRightPaneEnabled = enabled)),
    }),
    {
      name: 'onLayoutModeChange',
      type: '(floating: boolean) => void',
      defaultValue: '—',
      note: 'Fires with the resolved floating presentation.',
    },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // The snippet reads its labels from scope (i18n), which the seed does not
  // cover, so a locale switch must recompile the live instance without
  // touching the editor text.
  useScopeRefresh(preview, () => [i18n.locale])
</script>

{#snippet headerContent(api: AppShellHeaderApi)}
  {@const toggleLabel = api.open ? i18n.t('appShell.hidePane') : i18n.t('appShell.showPane')}
  <Button
    variant="secondary"
    className="-ml-1"
    ariaLabel={toggleLabel}
    ariaExpanded={api.open}
    tooltip={toggleLabel}
    tooltipAlign="left"
    preventFocusSteal
    onClick={api.toggleLeft}>
    {#snippet icon()}
      <MenuIcon />
    {/snippet}
  </Button>
  <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200">{i18n.t('showcase.title')}</span>
{/snippet}

{#snippet leftPaneContent()}
  <span class={SHELL_PANE_ITEM}>
    <MenuIcon className="shrink-0" />
    <span class={SHELL_PANE_LABEL}>{demoLeftPaneLabel}</span>
  </span>
{/snippet}

{#snippet rightPaneContent()}
  <p class="px-3 py-2 text-sm text-slate-300">{demoRightPaneText}</p>
{/snippet}

{#snippet footerContent()}
  <div class={SHELL_FOOTER_ROW_CLASS}>
    <span class={SHELL_FOOTER_TEXT_CLASS}>{footerParsed?.nav}</span>
    <span class={SHELL_FOOTER_TEXT_CLASS}>{footerParsed?.title}</span>
  </div>
{/snippet}

<ShowcasePage
  {fields}
  title="AppShell"
  {code}
  {preview}
  onReset={clearPlayground}
  scope={{
    demoTitle: i18n.t('showcase.title'),
    navLabel: i18n.t('showcase.components'),
    bodyText: i18n.t('showcase.intro'),
    showLabel: i18n.t('appShell.showPane'),
    hideLabel: i18n.t('appShell.hidePane'),
  }}>
  <!-- The demo is wrapped in `Resizable`: shrinking the frame floats the
      pane over the text when narrow, so the responsive behavior can be
      inspected in place without resizing the window. The frame is the only
      wrapper, so the shell renders its own default classes. -->
  <Resizable
    className={SHELL_STAGE_FRAME}
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
    <AppShell
      className={pgClassNameOn && pgClassName ? pgClassName : undefined}
      mode={demoMode}
      closeLabel={pgCloseLabelOn && pgCloseLabel ? pgCloseLabel : undefined}
      classNames={pgClassNamesEnabled ? demoClassNames : undefined}
      left={pgLeftEnabled ? demoLeft : undefined}
      right={pgRightEnabled ? demoRight : undefined}
      leftPane={pgLeftPaneEnabled ? leftPaneContent : undefined}
      rightPane={pgRightEnabled && pgRightPaneEnabled && demoRightOpen ? rightPaneContent : undefined}
      footer={pgFooterEnabled ? footerContent : undefined}
      header={pgHeaderEnabled ? headerContent : undefined}>
      {#if pgChildrenEnabled}{@html demoChildrenMarkup}{/if}
    </AppShell>
  </Resizable>
</ShowcasePage>
