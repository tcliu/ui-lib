<script lang="ts">
  import AppShell from '#lib/components/AppShell.svelte'
  import Button from '#lib/components/Button.svelte'
  import MenuIcon from '#lib/icons/MenuIcon.svelte'
  import type { AppShellHeaderApi } from '#lib/app-shell.js'
  import Resizable from '#lib/components/Resizable.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { applied, appliedFlag, eye, eyeFlag, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { type TriState } from '#showcase/playground/snippet-build.js'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import {
    boolField,
    enumField,
    textField,
    jsonField,
    sizeField,
    snippetDialog,
    snippetField,
  } from '#showcase/playground/snippet-field.js'
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
  // unsets it; Reset restores the defaults below. Each curated prop is one
  // `Staged` pair (its committed value plus its eye flag), so the demo, the
  // props table, and Show-code read the same state. The pane configs are
  // plain-data objects behind JSON dialogs; the right-pane snippet rides on
  // the right config's open flag and the footer snippet on the footer row, so
  // no separate demo-data panel is needed; stage size is interaction state.
  let pgMode = $state(staged('auto'))
  // Pane motion defaults to on, so the eye starts off; `no` turns the slide off.
  let pgMotion = $state(staged('yes' as TriState))
  // The shell chrome scale; the default step applies no override.
  let pgSize = $state(staged('md'))
  // The serializable pane configs. Empty renders the component default, so the
  // cleared form applies no overrides; the callbacks in `AppShellPaneConfig`
  // ride the demo objects below, never the editor text. Both start applied, so
  // the cleared form renders the current demo.
  let pgLeft = $state(staged<AppShellPaneJson>({}, true))
  let pgRight = $state(staged<AppShellPaneJson>({}, true))
  // The locale-resolved default; the eye stages the customization (off, so
  // the component default renders).
  let pgCloseLabel = $state(staged(i18n.t('appShell.closePane')))
  // The shell frame default; the eye stages the customization (off, so the
  // component default renders).
  const DEFAULT_SHELL_CLASS = 'flex h-full min-h-0 flex-col bg-slate-950 text-slate-100'
  let pgClassName = $state(staged(DEFAULT_SHELL_CLASS))
  // Extra region classes as a plain-data object behind a JSON dialog; an empty
  // map is the component default, so the eye starts off.
  let pgClassNames = $state(staged<AppShellClassNamesJson>({}))
  // Content-snippet text. Empty renders the localized default from scope, so
  // the cleared form applies no overrides; the footer's eye starts off and the
  // rest on, so the cleared form renders the current demo.
  let pgChildren = $state(staged('', true))
  let pgFooter = $state(staged(''))
  let pgLeftPane = $state(staged('', true))
  let pgRightPane = $state(staged('', true))
  // The header is fixed documentation markup with the same eye.
  let pgHeader = $state(staged(APP_SHELL_HEADER_MARKUP, true))
  // Stage size is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(SHELL_STAGE_DEFAULT_WIDTH)
  let pgStageHeight = $state(SHELL_STAGE_DEFAULT_HEIGHT)

  const modeOptions = [
    { value: 'auto', label: 'auto' },
    { value: 'docked', label: 'docked' },
    { value: 'floating', label: 'floating' },
  ]

  const demoMode = $derived((applied(pgMode) || undefined) as 'auto' | 'docked' | 'floating' | undefined)
  const demoMotion = $derived(appliedFlag(pgMotion))
  const demoSize = $derived(applied(pgSize) === undefined ? undefined : parseSizeValue(pgSize.value))
  // Unset renders the component default: the right pane stays shut until its
  // config opens it (which also applies its snippet below).
  const demoRightOpen = $derived(pgRight.value.open ?? false)
  const demoChildrenMarkup = $derived(pgChildren.value || appShellChildrenMarkup(i18n.t('showcase.intro')))
  const demoLeftPaneLabel = $derived(pgLeftPane.value || i18n.t('showcase.components'))
  const demoRightPaneText = $derived(pgRightPane.value || i18n.t('showcase.intro'))
  // children/footer seed their markup dialogs: children seeds the canonical
  // padded <p> (or the committed free-form markup), footer seeds the committed
  // markup (or the canonical block when hidden, so the dialog opens on real
  // markup). `footerParsed` drives the demo's footer, which renders only while
  // the footer pair is applied.
  const footerSnippet = $derived(
    pgFooter.value || appShellFooterMarkup(i18n.t('showcase.components'), i18n.t('showcase.title')),
  )
  const footerParsed = $derived(parseAppShellFooter(footerSnippet))

  function clearPlayground(): void {
    pgMode.value = 'auto'
    pgMode.on = false
    pgSize.value = 'md'
    pgSize.on = false
    pgLeft.value = {}
    pgLeft.on = true
    pgRight.value = {}
    pgRight.on = true
    pgCloseLabel.value = i18n.t('appShell.closePane')
    pgCloseLabel.on = false
    pgClassName.value = DEFAULT_SHELL_CLASS
    pgClassName.on = false
    pgClassNames.value = {}
    pgClassNames.on = false
    pgChildren.value = ''
    pgChildren.on = true
    pgFooter.value = ''
    pgFooter.on = false
    pgLeftPane.value = ''
    pgLeftPane.on = true
    pgRightPane.value = ''
    pgRightPane.on = true
    pgHeader.value = APP_SHELL_HEADER_MARKUP
    pgHeader.on = true
    pgStageWidth = SHELL_STAGE_DEFAULT_WIDTH
    pgStageHeight = SHELL_STAGE_DEFAULT_HEIGHT
  }

  // The two pane configs are object props: the JSON dialogs own the
  // serializable values, and the callbacks ride here internally so no
  // function ever enters the editor text. The change handlers write the
  // drawer's own open/size back into the JSON state, keeping the dialog seed
  // and the snippet behind the header toggles and splitter drags.
  const demoLeft = $derived({
    ...pgLeft.value,
    onOpenChange: (open: boolean) => {
      pgLeft.value = { ...pgLeft.value, open }
    },
    onSizeChange: (size: number) => {
      pgLeft.value = { ...pgLeft.value, size }
    },
  })
  const demoRight = $derived({
    ...pgRight.value,
    onOpenChange: (open: boolean) => {
      pgRight.value = { ...pgRight.value, open }
    },
    onSizeChange: (size: number) => {
      pgRight.value = { ...pgRight.value, size }
    },
  })

  const code = $derived.by(() => {
    // The footer row's committed markup falls back to the canonical block,
    // whose labels the page resolves (Show-code emits them literally, not as
    // scope refs), so the builder reads the resolved text behind the row's eye.
    const footer = { value: footerSnippet, on: pgFooter.on }
    return buildAppShellSnippet({
      mode: pgMode,
      motion: pgMotion,
      size: pgSize,
      className: pgClassName,
      closeLabel: pgCloseLabel,
      classNames: pgClassNames,
      left: pgLeft,
      right: pgRight,
      children: pgChildren,
      leftPane: pgLeftPane,
      header: pgHeader,
      rightPane: pgRightPane,
      footer,
    })
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
        stage(pgChildren, markup === appShellChildrenMarkup(i18n.t('showcase.intro')) ? '' : markup)
      },
      dialog: snippetDialog(
        parseAppShellChildren,
        'Use well-formed HTML elements only — no {…} expressions, components, <script>/<style>, or event-handler attributes.',
      ),
      toggle: eyeToggle(pgChildren),
    }),
    {
      name: 'className',
      type: 'string?',
      defaultValue: "'flex h-full min-h-0 flex-col bg-slate-950 text-slate-100'",
      editorDefaultValue: DEFAULT_SHELL_CLASS,
      note: 'Replaces the shell frame classes; unset, the component default renders inside the sized demo stage.',
      editor: 'text',
      clearable: true,
      ...eye(pgClassName),
      onChange: value => stage(pgClassName, value),
      toggle: eyeToggle(pgClassName),
      placeholder: DEFAULT_SHELL_CLASS,
      sync: {
        kind: 'custom',
        // Absent resolves to the current Value text so compiling (e.g.
        // opening Show-code) never stages the default into the form; the
        // setter maps the default back to unset, keeping committed custom
        // text and the eye alone.
        read: attrs => {
          if (!attrs) return undefined
          if (!attrs.has('className')) return pgClassName.value
          const attr = attrs.get('className')!
          return attr.kind === 'string' ? attr.value : undefined
        },
        set: value => {
          pgClassName.value = value === DEFAULT_SHELL_CLASS ? '' : value
        },
      },
    },
    jsonField({
      name: 'classNames',
      type: '{ header?: string; footer?: string; pane?: string; rightPane?: string; main?: string; splitter?: string }',
      note: 'Extra classes for the shell regions as JSON (unset stays null for the built-in classes); the eye applies the map.',
      value: classNamesJsonText(pgClassNames.value),
      onChange: (draft: string) => {
        const parsed = parseClassNamesJson(draft)
        if (parsed) stage(pgClassNames, parsed)
      },
      dialog: snippetDialog(
        parseClassNamesJson,
        'Invalid class-names JSON. Use an object with optional header/footer/pane/rightPane/main/splitter strings.',
      ),
      toggle: eyeToggle(pgClassNames),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          // An absent attribute leaves the playground alone (resolving to the
          // current state): unapplying the eye omits the prop from the seed
          // without resetting the committed JSON behind it.
          if (!attrs.has('classNames')) return classNamesJsonText(pgClassNames.value)
          const attr = attrs.get('classNames')!
          if (attr.kind !== 'expression') return undefined
          const parsed = parseClassNamesExpression(attr.value)
          return parsed ? classNamesJsonText(parsed) : undefined
        },
      },
    }),
    textField({ name: 'closeLabel', type: 'string?', defaultValue: "i18n 'appShell.closePane'", note: 'Floating backdrop aria label override.', clearable: true, ...eye(pgCloseLabel) }),
    snippetField({
      name: 'footer',
      note: 'Footer block; committing applies it, and the dialog edits its markup.',
      value: footerSnippet,
      onChange: (draft: string) => {
        if (parseAppShellFooter(draft)) {
          stage(pgFooter, normalizeAppShellFooter(draft))
        }
      },
      dialog: snippetDialog(parseAppShellFooter, 'Use the footer <div> with two text <span>s.'),
      toggle: eyeToggle(pgFooter),
    }),
    snippetField({
      type: 'Snippet<[AppShellHeaderApi]>',
      name: 'header',
      note: 'Header content; the fixed toggle-plus-title shape below documents the api callbacks (open, rightOpen, toggleLeft, toggleRight). The eye applies the header.',
      value: pgHeader.value,
      onChange: () => {
        pgHeader.on = true
      },
      toggle: eyeToggle(pgHeader),
    }),
    jsonField({
      name: 'left',
      type: 'AppShellPaneConfig',
      note: 'Left pane config as JSON: open, size, collapseMode, geometry, storageKey, and labels (unset stays null for the component default). The open/size callbacks ride the demo object internally; the eye applies the prop.',
      value: paneJsonText(pgLeft.value),
      onChange: (draft: string) => {
        const parsed = parsePaneJson(draft)
        if (parsed) stage(pgLeft, parsed)
      },
      dialog: snippetDialog(
        parsePaneJson,
        'Invalid pane JSON. Use an object with optional open (boolean), size/railWidth/min/max/defaultSize (numbers), collapseMode ("hide" or "rail"), and storageKey/resizeLabel/paneLabel (strings).',
      ),
      toggle: eyeToggle(pgLeft),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          // An absent attribute leaves the playground alone (resolving to the
          // current state): unapplying the eye omits the prop from the seed
          // without resetting the committed JSON behind it.
          if (!attrs.has('left')) return paneJsonText(pgLeft.value)
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
        stage(pgLeftPane, text === i18n.t('showcase.components') ? '' : text)
      },
      dialog: snippetDialog(
        parseAppShellLeftPane,
        `Use the caller row with <MenuIcon> and the <span class="${SHELL_PANE_LABEL}"> label.`,
      ),
      toggle: eyeToggle(pgLeftPane),
    }),
    enumField({ name: 'mode', type: "'auto' | 'docked' | 'floating'", defaultValue: "'auto'", note: 'Auto docks beside content while the shell container is wide and floats above it when narrow (measured on the shell, not the viewport). Pinned docked stays an in-flow row at every width; rail panes float as an open-or-closed overlay below the breakpoint.', options: modeOptions, placeholder: 'auto', clearLabel: 'Clear mode', ...eye(pgMode) }),
    boolField({ name: 'motion', defaultValue: 'true', note: 'Slides a pane in and out while its open state changes; `false` swaps it instantly.', ...eyeFlag(pgMotion) }),
    jsonField({
      name: 'right',
      type: 'AppShellPaneConfig',
      note: 'Right pane config as JSON: open, size, collapseMode, geometry, storageKey, and labels (unset stays null for the component default). Opening it applies the right-pane snippet; callbacks ride the demo object internally, and the eye applies the prop.',
      value: paneJsonText(pgRight.value),
      onChange: (draft: string) => {
        const parsed = parsePaneJson(draft)
        if (parsed) stage(pgRight, parsed)
      },
      dialog: snippetDialog(
        parsePaneJson,
        'Invalid pane JSON. Use an object with optional open (boolean), size/railWidth/min/max/defaultSize (numbers), collapseMode ("hide" or "rail"), and storageKey/resizeLabel/paneLabel (strings).',
      ),
      toggle: eyeToggle(pgRight),
      sync: {
        kind: 'custom',
        read: attrs => {
          if (!attrs) return undefined
          // An absent attribute leaves the playground alone (resolving to the
          // current state): unapplying the eye omits the prop from the seed
          // without resetting the committed JSON behind it.
          if (!attrs.has('right')) return paneJsonText(pgRight.value)
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
        stage(pgRightPane, text === i18n.t('showcase.intro') ? '' : text)
      },
      dialog: snippetDialog(parseAppShellRightPane, 'Use <p class="px-3 py-2 text-sm text-slate-300">…</p>.'),
      toggle: eyeToggle(pgRightPane),
    }),
    sizeField({
      note: 'Top-bar scale: header/footer padding and band gap, the icon-to-title gap, the title font, and the drawer toggle (through api.size). Panels keep their own widths and spacing, and md reproduces the pre-size chrome.',
      ...eye(pgSize),
    }),
    {
      name: 'onLayoutModeChange',
      type: '(floating: boolean) => void',
      defaultValue: '—',
      note: 'Fires with the resolved floating presentation.',
    },
  ])


  // The snippet reads its labels from scope (i18n), which the seed does not
  // cover, so a locale switch must recompile the live instance without
  // touching the editor text.
  </script>

{#snippet headerContent(api: AppShellHeaderApi)}
  {@const toggleLabel = api.open ? i18n.t('appShell.hidePane') : i18n.t('appShell.showPane')}
  <div class="flex flex-none items-center gap-[var(--shell-title-gap)]">
    <Button
      variant="secondary"
      size={api.size}
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
    <span class="min-w-0 flex-1 truncate text-[length:var(--shell-title)] font-semibold text-slate-200"
      >{i18n.t('showcase.title')}</span>
  </div>
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

{#snippet shellChildren()}
  {@html demoChildrenMarkup}
{/snippet}

<ShowcasePage
  {fields}
  title="AppShell"
  {code}
  onReset={clearPlayground}
  scope={{
    demoTitle: i18n.t('showcase.title'),
    navLabel: i18n.t('showcase.components'),
    bodyText: i18n.t('showcase.intro'),
    showLabel: i18n.t('appShell.showPane'),
    hideLabel: i18n.t('appShell.hidePane'),
  }}
    sync={{ tag: 'AppShell' }}
    scopeRefresh={() => [i18n.locale]}
  >
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
      className={applied(pgClassName) || undefined}
      mode={demoMode}
      motion={demoMotion}
      size={demoSize}
      closeLabel={applied(pgCloseLabel) || undefined}
      classNames={applied(pgClassNames)}
      left={pgLeft.on ? demoLeft : undefined}
      right={pgRight.on ? demoRight : undefined}
      leftPane={pgLeftPane.on ? leftPaneContent : undefined}
      rightPane={pgRight.on && pgRightPane.on && demoRightOpen ? rightPaneContent : undefined}
      footer={pgFooter.on ? footerContent : undefined}
      header={pgHeader.on ? headerContent : undefined}
      children={pgChildren.on ? shellChildren : undefined} />
  </Resizable>
</ShowcasePage>
