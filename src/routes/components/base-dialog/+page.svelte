<script lang="ts">
  import BaseDialog, { DIALOG_SIZE_VARIANTS } from '$lib/components/BaseDialog.svelte'
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Copyable from '$lib/components/Copyable.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildHeaderLine, parseHeaderMarkup } from '$lib/showcase/snippet-header'
  import {
    DISMISS_HANDLER,
    buildBaseDialogSnippet,
    buildBaseBodyLines,
    parseBaseBodyMarkup,
    type BaseBodyContent,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgOpen` is interaction state, not a curated option.
  const INITIAL = {
    open: false,
    widthVariant: 'md',
    widthVariantOn: false,
    heightVariant: 'auto',
    heightVariantOn: false,
    size: '',
    sizeOn: false,
    className: '',
    classNameOn: false,
    children: '',
    childrenOn: true,
    title: '',
    titleOn: false,
    closeLabel: '',
    closeLabelOn: false,
    header: '',
    headerOn: false,
  }
  let pg = $state(structuredClone(INITIAL))
  // The children row edits the inner markup the dialog lays out (demo data,
  // so it has no single prop). Committing the canonical shape resets to
  // unset, so defaults keep flowing from scope (e.g. on locale change).
  // The header row edits the Copyable title the dialog heading renders (demo
  // data, so it has no single prop); committing the canonical shape resets to
  // unset, so defaults keep flowing from the title.

  const demoWidthVariant = $derived(
    pg.widthVariantOn
      ? ((pg.widthVariant || undefined) as
        | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'fit' | 'wide'
        | undefined)
      : undefined,
  )
  const demoHeightVariant = $derived(
    pg.heightVariantOn
      ? ((pg.heightVariant || undefined) as 'auto' | (typeof DIALOG_SIZE_VARIANTS)[number] | undefined)
      : undefined,
  )
  const demoSize = $derived(
    pg.sizeOn ? ((pg.size || undefined) as (typeof DIALOG_SIZE_VARIANTS)[number] | undefined) : undefined,
  )

  const widthVariantOptions = [...DIALOG_SIZE_VARIANTS, 'fit', 'wide'].map(value => ({ value, label: value }))
  const heightVariantOptions = ['auto', ...DIALOG_SIZE_VARIANTS].map(value => ({ value, label: value }))
  const sizeOptions = DIALOG_SIZE_VARIANTS.map(value => ({ value, label: value }))

  // Parsed children segments for the demo; unset, the canonical pair reads
  // the localized defaults from scope.
  const demoChildren = $derived<BaseBodyContent>(
    parseBaseBodyMarkup(pg.children) ?? {
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
    pg.children ||
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
      pg.open = false
      return
    }
    runCustomHandler(handler)
  }
  // Unset, the plain title renders the localized default (matching the seed's
  // scope ref); the labels stay absent so component defaults apply.
  const demoTitle = $derived(pg.titleOn && pg.title ? pg.title : i18n.t('showcase.dialogTitle'))
  const demoCloseLabel = $derived(pg.closeLabelOn && pg.closeLabel ? pg.closeLabel : undefined)
  // Canonical slot markup resolved from the title, matching the row seed
  // while unset.
  const canonicalHeader = $derived(buildHeaderLine({ text: demoTitle, inner: demoTitle }))
  const headerMarkup = $derived(pg.header || canonicalHeader)
  const headerContent = $derived(parseHeaderMarkup(pg.header) ?? { text: demoTitle, inner: demoTitle })

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildBaseDialogSnippet({
      widthVariant: pg.widthVariant,
      widthVariantOn: pg.widthVariantOn,
      heightVariant: pg.heightVariant,
      heightVariantOn: pg.heightVariantOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      className: pg.className,
      classNameOn: pg.classNameOn,
      children: childrenMarkup,
      childrenOn: pg.childrenOn,
      title: pg.title,
      titleOn: pg.titleOn,
      closeLabel: pg.closeLabel,
      closeLabelOn: pg.closeLabelOn,
      header: headerMarkup,
      headerOn: pg.headerOn,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    snippetField({
      name: 'children',
      note: 'Dialog body content; committing applies it, and the dialog edits its paragraph, buttons, and their onClick handlers.',
      value: childrenMarkup,
      onChange: (draft: string) => {
        const parsed = parseBaseBodyMarkup(draft)
        if (!parsed) return
        const normalized = buildBaseBodyLines(parsed)
        pg.children =
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
        pg.childrenOn = true
      },
      dialog: snippetDialog(
        parseBaseBodyMarkup,
        'Use a <p> paragraph plus a <Buttons align="right"> row of <Button variant="…"> labels; a button dismisses with onClick={() => (open = false)} or runs any balanced onClick expression.',
      ),
      toggle: snippetToggle(pg.childrenOn, enabled => (pg.childrenOn = enabled)),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the dialog panel.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: '', clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    textField({ name: 'closeLabel', type: 'string?', defaultValue: 'locale', note: 'Overrides the close accessible name.', value: pg.closeLabel, onChange: v => (pg.closeLabel = v), clearable: true, enabled: pg.closeLabelOn, setEnabled: v => (pg.closeLabelOn = v) }),
    snippetField({
      name: 'header',
      note: 'Copyable title heading; one Copyable line, committing applies it. The plain title keeps rendering while off.',
      value: headerMarkup,
      onChange: (draft: string) => {
        const parsed = parseHeaderMarkup(draft)
        if (!parsed) return
        const normalized = buildHeaderLine(parsed)
        pg.header = normalized === canonicalHeader ? '' : normalized
        pg.headerOn = true
      },
      dialog: snippetDialog(
        parseHeaderMarkup,
        'Use a single <Copyable text="…"><span>…</span></Copyable> line with non-blank text and label.',
      ),
      toggle: snippetToggle(pg.headerOn, enabled => (pg.headerOn = enabled)),
    }),
    enumField({ name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content.', options: heightVariantOptions, value: pg.heightVariant, onChange: v => (pg.heightVariant = v), placeholder: 'auto', clearLabel: 'Clear height', enabled: pg.heightVariantOn, setEnabled: v => (pg.heightVariantOn = v) }),
    enumField({ name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both width and height; an explicit variant wins.', options: sizeOptions, value: pg.size, onChange: v => (pg.size = v), clearLabel: 'Clear size', enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'title', type: 'string?', defaultValue: '—', note: 'Dialog heading.', editor: 'text', clearable: true, value: pg.title || i18n.t('showcase.dialogTitle'), onChange: value => { pg.title = value === i18n.t('showcase.dialogTitle') ? '' : value; pg.titleOn = true; }, toggle: snippetToggle(pg.titleOn, enabled => (pg.titleOn = enabled)), sync: { kind: 'text' } },
    enumField({ name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.', options: widthVariantOptions, value: pg.widthVariant, onChange: v => (pg.widthVariant = v), placeholder: 'md', clearLabel: 'Clear width', enabled: pg.widthVariantOn, setEnabled: v => (pg.widthVariantOn = v) }),
    { name: 'onCancel', type: '() => void', defaultValue: '—', note: 'Called by every dismissal affordance.' },
  ])

</script>

{#snippet dialogHeader()}
  <Copyable text={headerContent.text}><span>{headerContent.inner}</span></Copyable>
{/snippet}

<ShowcasePage
    {fields}
    title="BaseDialog"
    {code}
    onReset={clearPlayground}
    scope={{
      open: pg.open,
      openDialogLabel: i18n.t('showcase.openDialog'),
      dialogTitle: i18n.t('showcase.dialogTitle'),
      cancelLabel: i18n.t('common.cancel'),
      okLabel: i18n.t('common.ok'),
    }}

    sync={{ tag: 'BaseDialog' }}
  >
    <Button variant="primary" onClick={() => (pg.open = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if pg.open}
      <BaseDialog
        title={demoTitle}
        header={pg.headerOn ? dialogHeader : undefined}
        closeLabel={demoCloseLabel}
        className={pg.classNameOn && pg.className ? pg.className : undefined}
        widthVariant={demoWidthVariant}
        heightVariant={demoHeightVariant}
        size={demoSize}
        onCancel={() => (pg.open = false)}>
        {#if pg.childrenOn}
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
