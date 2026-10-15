<script lang="ts">
  import BaseDialog, { DIALOG_SIZE_VARIANTS } from '$lib/components/BaseDialog.svelte'
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Copyable from '$lib/components/Copyable.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildHeaderLine, parseHeaderMarkup } from '$lib/showcase/snippet-header'
  import {
    DISMISS_HANDLER,
    buildBaseDialogSnippet,
    buildBaseBodyLines,
    buildFooterLines,
    parseBaseBodyMarkup,
    parseFooterMarkup,
    type BaseBodyContent,
    type BaseFooterButton,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgOpen` is interaction state, not a curated option.
  let pgOpen = $state(false)
  let pgWidthVariant = $state('md')
  let pgWidthVariantOn = $state(false)
  let pgHeightVariant = $state('auto')
  let pgHeightVariantOn = $state(false)
  let pgSize = $state('')
  let pgSizeOn = $state(false)
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)
  // The children row edits the inner markup the dialog lays out (demo data,
  // so it has no single prop). Committing the canonical shape resets to
  // unset, so defaults keep flowing from scope (e.g. on locale change).
  let pgChildren = $state('')
  let pgChildrenOn = $state(true)
  let pgTitle = $state('')
  let pgTitleOn = $state(false)
  let pgCloseLabel = $state('')
  let pgCloseLabelOn = $state(false)
  // The header row edits the Copyable title the dialog heading renders (demo
  // data, so it has no single prop); committing the canonical shape resets to
  // unset, so defaults keep flowing from the title. The footer row edits the
  // fixed action row below the body; same reset rule.
  let pgHeader = $state('')
  let pgHeaderOn = $state(false)
  let pgFooter = $state('')
  let pgFooterOn = $state(false)

  const demoWidthVariant = $derived(
    pgWidthVariantOn
      ? ((pgWidthVariant || undefined) as
        | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'fit' | 'wide'
        | undefined)
      : undefined,
  )
  const demoHeightVariant = $derived(
    pgHeightVariantOn
      ? ((pgHeightVariant || undefined) as 'auto' | (typeof DIALOG_SIZE_VARIANTS)[number] | undefined)
      : undefined,
  )
  const demoSize = $derived(
    pgSizeOn ? ((pgSize || undefined) as (typeof DIALOG_SIZE_VARIANTS)[number] | undefined) : undefined,
  )

  const widthVariantOptions = [...DIALOG_SIZE_VARIANTS, 'fit', 'wide'].map(value => ({ value, label: value }))
  const heightVariantOptions = ['auto', ...DIALOG_SIZE_VARIANTS].map(value => ({ value, label: value }))
  const sizeOptions = DIALOG_SIZE_VARIANTS.map(value => ({ value, label: value }))

  // Parsed children segments for the demo; unset, the canonical pair reads
  // the localized defaults from scope.
  const demoChildren = $derived<BaseBodyContent>(
    parseBaseBodyMarkup(pgChildren) ?? {
      body: i18n.t('showcase.dialogBody'),
      buttons: [
        { variant: 'primary', label: i18n.t('common.ok'), onClick: DISMISS_HANDLER },
        { variant: 'outline', label: i18n.t('common.cancel'), onClick: DISMISS_HANDLER },
      ],
    },
  )
  // The row dialog seeds the committed markup, or the canonical block with
  // resolved labels when unset.
  const childrenMarkup = $derived(
    pgChildren ||
      buildBaseBodyLines({
        body: i18n.t('showcase.dialogBody'),
        buttons: [
          { variant: 'primary', label: i18n.t('common.ok'), onClick: DISMISS_HANDLER },
          { variant: 'outline', label: i18n.t('common.cancel'), onClick: DISMISS_HANDLER },
        ],
      }),
  )
  // The children row opens a markup dialog instead of an inline editor: only a
  // body + button row the static demo reproduces exactly is valid.

  // Custom dialog handlers run in the static demo through this dispatcher.
  // The dismiss literal closes directly and never evals; anything else
  // compiles from the committed text (the showcase is local-only, and the
  // dialog guarantees balanced braces — runtime errors stay silent).
  function runCustomHandler(code: string): void {
    try {
      const fn = new Function(`return (${code})`)() as unknown
      if (typeof fn === 'function') {
        ;(fn as () => void)()
      }
    } catch {
      // Shape-validated at commit; a runtime failure leaves the demo alone.
    }
  }

  function handleDemoButtonClick(handler: string | null): void {
    if (handler === null) {
      return
    }
    if (handler === DISMISS_HANDLER) {
      pgOpen = false
      return
    }
    runCustomHandler(handler)
  }
  // Unset, the plain title renders the localized default (matching the seed's
  // scope ref); the labels stay absent so component defaults apply.
  const demoTitle = $derived(pgTitleOn && pgTitle ? pgTitle : i18n.t('showcase.dialogTitle'))
  const demoCloseLabel = $derived(pgCloseLabelOn && pgCloseLabel ? pgCloseLabel : undefined)
  // Canonical slot markup resolved from the title, matching the row seed
  // while unset.
  const canonicalHeader = $derived(buildHeaderLine({ text: demoTitle, inner: demoTitle }))
  const headerMarkup = $derived(pgHeader || canonicalHeader)
  const headerContent = $derived(parseHeaderMarkup(pgHeader) ?? { text: demoTitle, inner: demoTitle })
  const canonicalFooter = $derived(buildFooterLines([{ variant: 'primary', label: i18n.t('common.ok') }]))
  const footerMarkup = $derived(pgFooter || canonicalFooter)
  const footerButtons = $derived<BaseFooterButton[]>(
    parseFooterMarkup(pgFooter) ?? [{ variant: 'primary', label: i18n.t('common.ok') }],
  )

  function clearPlayground() {
    pgOpen = false
    pgWidthVariant = 'md'
    pgWidthVariantOn = false
    pgHeightVariant = 'auto'
    pgHeightVariantOn = false
    pgSize = ''
    pgSizeOn = false
    pgClassName = ''
    pgClassNameOn = false
    pgChildren = ''
    pgChildrenOn = true
    pgTitle = ''
    pgTitleOn = false
    pgCloseLabel = ''
    pgCloseLabelOn = false
    pgHeader = ''
    pgHeaderOn = false
    pgFooter = ''
    pgFooterOn = false
  }

  const code = $derived.by(() =>
    buildBaseDialogSnippet({
      widthVariant: pgWidthVariant,
      widthVariantOn: pgWidthVariantOn,
      heightVariant: pgHeightVariant,
      heightVariantOn: pgHeightVariantOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      children: childrenMarkup,
      childrenOn: pgChildrenOn,
      title: pgTitle,
      titleOn: pgTitleOn,
      closeLabel: pgCloseLabel,
      closeLabelOn: pgCloseLabelOn,
      header: headerMarkup,
      headerOn: pgHeaderOn,
      footer: footerMarkup,
      footerOn: pgFooterOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      open: pgOpen,
      openDialogLabel: i18n.t('showcase.openDialog'),
      dialogTitle: i18n.t('showcase.dialogTitle'),
      cancelLabel: i18n.t('common.cancel'),
      okLabel: i18n.t('common.ok'),
    }),
    sync: { tag: 'BaseDialog', getFields: () => syncFields },
  })

  const fields: SyncableFieldConfig[] = $derived([
    snippetField({
      name: 'children',
      note: 'Dialog body content; committing applies it, and the dialog edits its paragraph, buttons, and their onClick handlers.',
      value: childrenMarkup,
      onChange: (draft: string) => {
        const parsed = parseBaseBodyMarkup(draft)
        if (!parsed) return
        const normalized = buildBaseBodyLines(parsed)
        pgChildren =
          normalized ===
          buildBaseBodyLines({
            body: i18n.t('showcase.dialogBody'),
            buttons: [
              { variant: 'primary', label: i18n.t('common.ok'), onClick: DISMISS_HANDLER },
              { variant: 'outline', label: i18n.t('common.cancel'), onClick: DISMISS_HANDLER },
            ],
          })
            ? ''
            : normalized
        pgChildrenOn = true
      },
      dialog: snippetDialog(
        parseBaseBodyMarkup,
        'Use a <p> paragraph plus a <Buttons align="right"> row of <Button variant="…"> labels; a button dismisses with onClick={() => (open = false)} or runs any balanced onClick expression.',
      ),
      toggle: snippetToggle(pgChildrenOn, enabled => (pgChildrenOn = enabled)),
    }),
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the dialog panel; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'closeLabel', type: 'string?', defaultValue: 'locale', note: 'Overrides the close accessible name; the eye stages the customization.', editor: 'text', clearable: true, value: pgCloseLabel, onChange: value => { pgCloseLabel = value; pgCloseLabelOn = true; }, toggle: snippetToggle(pgCloseLabelOn, enabled => (pgCloseLabelOn = enabled)), sync: { kind: 'text' } },
    snippetField({
      name: 'footer',
      note: 'Fixed action row below the body; one Buttons block of plain-label Button lines, committing applies it. Demo buttons dismiss.',
      value: footerMarkup,
      onChange: (draft: string) => {
        const parsed = parseFooterMarkup(draft)
        if (!parsed) return
        const normalized = buildFooterLines(parsed)
        pgFooter = normalized === canonicalFooter ? '' : normalized
        pgFooterOn = true
      },
      dialog: snippetDialog(
        parseFooterMarkup,
        'Use a <Buttons align="right"> block of <Button variant="…">Label</Button> lines; a missing variant reads as the Button default.',
      ),
      toggle: snippetToggle(pgFooterOn, enabled => (pgFooterOn = enabled)),
    }),
    snippetField({
      name: 'header',
      note: 'Copyable title heading; one Copyable line, committing applies it. The plain title keeps rendering while off.',
      value: headerMarkup,
      onChange: (draft: string) => {
        const parsed = parseHeaderMarkup(draft)
        if (!parsed) return
        const normalized = buildHeaderLine(parsed)
        pgHeader = normalized === canonicalHeader ? '' : normalized
        pgHeaderOn = true
      },
      dialog: snippetDialog(
        parseHeaderMarkup,
        'Use a single <Copyable text="…"><span>…</span></Copyable> line with non-blank text and label.',
      ),
      toggle: snippetToggle(pgHeaderOn, enabled => (pgHeaderOn = enabled)),
    }),
    { name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content; the eye stages the customization.', editor: 'enum', options: heightVariantOptions, value: pgHeightVariant, onChange: value => { pgHeightVariant = value; pgHeightVariantOn = true; }, placeholder: 'auto', clearLabel: 'Clear height', toggle: snippetToggle(pgHeightVariantOn, enabled => (pgHeightVariantOn = enabled)), sync: { kind: 'text' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both width and height; an explicit variant wins; the eye stages the customization.', editor: 'enum', options: sizeOptions, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'text' } },
    { name: 'title', type: 'string?', defaultValue: '—', note: 'Dialog heading; the eye stages the customization.', editor: 'text', clearable: true, value: pgTitle || i18n.t('showcase.dialogTitle'), onChange: value => { pgTitle = value === i18n.t('showcase.dialogTitle') ? '' : value; pgTitleOn = true; }, toggle: snippetToggle(pgTitleOn, enabled => (pgTitleOn = enabled)), sync: { kind: 'text' } },
    { name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant; the eye stages the customization.', editor: 'enum', options: widthVariantOptions, value: pgWidthVariant, onChange: value => { pgWidthVariant = value; pgWidthVariantOn = true; }, placeholder: 'md', clearLabel: 'Clear width', toggle: snippetToggle(pgWidthVariantOn, enabled => (pgWidthVariantOn = enabled)), sync: { kind: 'text' } },
    { name: 'onCancel', type: '() => void', defaultValue: '—', note: 'Called by every dismissal affordance.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

</script>

{#snippet dialogHeader()}
  <Copyable text={headerContent.text}><span>{headerContent.inner}</span></Copyable>
{/snippet}

{#snippet dialogFooter()}
  <Buttons align="right">
    {#each footerButtons as button}
      <Button variant={button.variant ?? undefined} onClick={() => (pgOpen = false)}>
        {button.label}
      </Button>
    {/each}
  </Buttons>
{/snippet}

<ShowcasePage
    {fields}
    title="BaseDialog"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{
      open: pgOpen,
      openDialogLabel: i18n.t('showcase.openDialog'),
      dialogTitle: i18n.t('showcase.dialogTitle'),
      cancelLabel: i18n.t('common.cancel'),
      okLabel: i18n.t('common.ok'),
    }}
>
    <Button variant="primary" onClick={() => (pgOpen = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if pgOpen}
      <BaseDialog
        title={demoTitle}
        header={pgHeaderOn ? dialogHeader : undefined}
        footer={pgFooterOn ? dialogFooter : undefined}
        closeLabel={demoCloseLabel}
        className={pgClassNameOn && pgClassName ? pgClassName : undefined}
        widthVariant={demoWidthVariant}
        heightVariant={demoHeightVariant}
        size={demoSize}
        onCancel={() => (pgOpen = false)}>
        {#if pgChildrenOn}
          <p>{demoChildren.body}</p>
          <Buttons align="right">
            {#each demoChildren.buttons as button}
              <Button variant={button.variant} onClick={() => handleDemoButtonClick(button.onClick)}>
                {button.label}
              </Button>
            {/each}
          </Buttons>
        {/if}
      </BaseDialog>
    {/if}
  </ShowcasePage>
