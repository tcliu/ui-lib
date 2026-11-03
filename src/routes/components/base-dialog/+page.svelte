<script lang="ts">
  import BaseDialog, { DIALOG_SIZE_VARIANTS } from '#lib/components/BaseDialog.svelte'
  import Button from '#lib/components/Button.svelte'
  import Buttons from '#lib/components/Buttons.svelte'
  import Copyable from '#lib/components/Copyable.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { enumField, textField, snippetDialog, snippetField } from '#showcase/playground/snippet-field.js'
  import { applied, eye, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { buildHeaderLine, parseHeaderMarkup } from '#showcase/playground/snippet-header.js'
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
  // `open` is interaction state, not a curated option.
  const INITIAL = {
    open: false,
    widthVariant: staged('md'),
    heightVariant: staged('auto'),
    size: staged(''),
    className: staged(''),
    children: staged('', true),
    title: staged(''),
    closeLabel: staged(''),
    header: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))
  // The children row edits the inner markup the dialog lays out (demo data,
  // so it has no single prop). Committing the canonical shape resets to
  // unset, so defaults keep flowing from scope (e.g. on locale change).
  // The header row edits the Copyable title the dialog heading renders (demo
  // data, so it has no single prop); committing the canonical shape resets to
  // unset, so defaults keep flowing from the title.

  const demoWidthVariant = $derived(
    (applied(pg.widthVariant) || undefined) as
      | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'fit' | 'wide'
      | undefined,
  )
  const demoHeightVariant = $derived(
    (applied(pg.heightVariant) || undefined) as 'auto' | (typeof DIALOG_SIZE_VARIANTS)[number] | undefined,
  )
  const demoSize = $derived(
    (applied(pg.size) || undefined) as (typeof DIALOG_SIZE_VARIANTS)[number] | undefined,
  )

  const widthVariantOptions = [...DIALOG_SIZE_VARIANTS, 'fit', 'wide'].map(value => ({ value, label: value }))
  const heightVariantOptions = ['auto', ...DIALOG_SIZE_VARIANTS].map(value => ({ value, label: value }))
  const sizeOptions = DIALOG_SIZE_VARIANTS.map(value => ({ value, label: value }))

  // Parsed children segments for the demo; unset, the canonical pair reads
  // the localized defaults from scope.
  const demoChildren = $derived<BaseBodyContent>(
    parseBaseBodyMarkup(pg.children.value) ?? {
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
    pg.children.value ||
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
  const demoTitle = $derived(applied(pg.title) || i18n.t('showcase.dialogTitle'))
  const demoCloseLabel = $derived(applied(pg.closeLabel) || undefined)
  // Canonical slot markup resolved from the title, matching the row seed
  // while unset.
  const canonicalHeader = $derived(buildHeaderLine({ text: demoTitle, inner: demoTitle }))
  const headerMarkup = $derived(pg.header.value || canonicalHeader)
  const headerContent = $derived(parseHeaderMarkup(pg.header.value) ?? { text: demoTitle, inner: demoTitle })

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildBaseDialogSnippet({
      widthVariant: pg.widthVariant,
      heightVariant: pg.heightVariant,
      size: pg.size,
      className: pg.className,
      children: { value: childrenMarkup, on: pg.children.on },
      title: pg.title,
      closeLabel: pg.closeLabel,
      header: { value: headerMarkup, on: pg.header.on },
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
        stage(
          pg.children,
          normalized ===
            buildBaseBodyLines({
              body: i18n.t('showcase.dialogBody'),
              buttons: [
                { variant: 'primary', label: i18n.t('common.ok'), onClick: DISMISS_HANDLER },
                { variant: 'outline', label: i18n.t('common.cancel'), onClick: DISMISS_HANDLER },
              ],
            })
            ? ''
            : normalized,
        )
      },
      dialog: snippetDialog(
        parseBaseBodyMarkup,
        'Use a <p> paragraph plus a <Buttons align="right"> row of <Button variant="…"> labels; a button dismisses with onClick={() => (open = false)} or runs any balanced onClick expression.',
      ),
      toggle: eyeToggle(pg.children),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the dialog panel.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    textField({ name: 'closeLabel', type: 'string?', defaultValue: 'locale', note: 'Overrides the close accessible name.', clearable: true, ...eye(pg.closeLabel) }),
    snippetField({
      name: 'header',
      note: 'Copyable title heading; one Copyable line, committing applies it. The plain title keeps rendering while off.',
      value: headerMarkup,
      onChange: (draft: string) => {
        const parsed = parseHeaderMarkup(draft)
        if (!parsed) return
        const normalized = buildHeaderLine(parsed)
        stage(pg.header, normalized === canonicalHeader ? '' : normalized)
      },
      dialog: snippetDialog(
        parseHeaderMarkup,
        'Use a single <Copyable text="…"><span>…</span></Copyable> line with non-blank text and label.',
      ),
      toggle: eyeToggle(pg.header),
    }),
    enumField({ name: 'heightVariant', type: "'auto' | 'xs' | … | '7xl'", defaultValue: "'auto'", note: 'Panel height step; auto hugs the content.', options: heightVariantOptions, placeholder: 'auto', clearLabel: 'Clear height', ...eye(pg.heightVariant) }),
    enumField({ name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'", defaultValue: '—', note: 'Shorthand setting both width and height; an explicit variant wins.', options: sizeOptions, clearLabel: 'Clear size', ...eye(pg.size) }),
    textField({ name: 'title', type: 'string?', defaultValue: '—', note: 'Dialog heading.', clearable: true, ...eye(pg.title), value: pg.title.value || i18n.t('showcase.dialogTitle'), onChange: value => stage(pg.title, value === i18n.t('showcase.dialogTitle') ? '' : value) }),
    enumField({ name: 'widthVariant', type: "'xs' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.', options: widthVariantOptions, placeholder: 'md', clearLabel: 'Clear width', ...eye(pg.widthVariant) }),
    { name: 'onCancel', type: '() => void', defaultValue: '—', note: 'Called by every dismissal affordance.' },
  ])

</script>

{#snippet dialogHeader()}
  <Copyable text={headerContent.text}><span>{headerContent.inner}</span></Copyable>
{/snippet}

{#snippet dialogChildren()}
  <p>{demoChildren.body}</p>
  <Buttons align="right">
    {#each demoChildren.buttons as button}
      <Button variant={button.variant} onClick={() => handleDemoButtonClick(button.onClick)}>
        {button.label}
      </Button>
    {/each}
  </Buttons>
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
        header={pg.header.on ? dialogHeader : undefined}
        closeLabel={demoCloseLabel}
        className={applied(pg.className) || undefined}
        widthVariant={demoWidthVariant}
        heightVariant={demoHeightVariant}
        size={demoSize}
        onCancel={() => (pg.open = false)}
        children={pg.children.on ? dialogChildren : undefined}>
      </BaseDialog>
    {/if}
  </ShowcasePage>
