<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildButtonsSnippet, buttonsChildrenSnippet, normalizeButtonsDraft, parseButtonsList, type ButtonsChildSegment } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. The laid-out
  // buttons are demo data edited through the children dialog below: raw
  // markup while customized, empty for the canonical pair.
  const INITIAL = {
    align: 'left',
    alignOn: false,
    className: '',
    classNameOn: false,
    children: '',
    childrenEnabled: true,
  }
  let pg = $state(structuredClone(INITIAL))

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'center', label: 'center' },
    { value: 'right', label: 'right' },
  ]

  const demoAlign = $derived(pg.alignOn ? ((pg.align || undefined) as 'left' | 'center' | 'right' | undefined) : undefined)
  const demoClassName = $derived(pg.classNameOn && pg.className ? pg.className : undefined)
  const okLabel = $derived(i18n.t('common.ok'))
  const cancelLabel = $derived(i18n.t('common.cancel'))
  // Custom markup renders as committed; unset, the canonical pair reads the
  // localized defaults from scope. Stored drafts are always valid, so the
  // fallback only covers the empty state.
  const demoButtons = $derived<ButtonsChildSegment[]>(
    parseButtonsList(pg.children) ?? [
      { kind: 'button', variant: 'primary', label: okLabel },
      { kind: 'button', variant: 'outline', label: cancelLabel },
    ],
  )

  // The children row edits the inner `<Button>` markup the `Buttons` component
  // lays out (demo data, so it has no single prop). FieldTable owns the dialog:
  // the edit icon seeds the draft from the live markup and only commits on OK.
  // Committing the canonical pair resets to unset, so defaults keep flowing
  // from scope (e.g. on locale change).
  const childrenSnippet = $derived(pg.children || buttonsChildrenSnippet(okLabel, cancelLabel))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildButtonsSnippet({ align: pg.align, alignOn: pg.alignOn, className: pg.className, classNameOn: pg.classNameOn, children: pg.children, childrenEnabled: pg.childrenEnabled }),
  )

  
  // Editable rows first (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'align', type: "'left' | 'center' | 'right'", defaultValue: "'left'", note: 'Horizontal alignment of the default row.', options: alignOptions, value: pg.align, onChange: v => (pg.align = v), placeholder: 'left', clearLabel: 'Clear align', enabled: pg.alignOn, setEnabled: v => (pg.alignOn = v) }),
    snippetField({
      name: 'children',
      note: 'Buttons to lay out; committing applies it.',
      value: childrenSnippet,
      onChange: (draft: string) => {
        if (!parseButtonsList(draft)) return
        const normalized = normalizeButtonsDraft(draft)
        pg.children = normalized === buttonsChildrenSnippet(okLabel, cancelLabel) ? '' : normalized
        pg.childrenEnabled = true
      },
      dialog: snippetDialog(parseButtonsList, 'Use valid <Button> markup, e.g. <Button variant="primary">OK</Button>.'),
      toggle: snippetToggle(pg.childrenEnabled, enabled => (pg.childrenEnabled = enabled)),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: '—', note: 'Replaces the default layout classes (align is ignored).', value: pg.className, onChange: v => (pg.className = v), clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
  ])

  // The seed reads both labels from scope while unset, which reseeding never
  // refreshes; recompile the draft on those scope changes without touching the
  // editor text (e.g. on locale change).
  </script>

<ShowcasePage
    {fields}
    title="Buttons"
    {code}
    onReset={clearPlayground}
    scope={{ okLabel, cancelLabel }}

    sync={{ tag: 'Buttons' }}
    scopeRefresh={() => [okLabel, cancelLabel]}
  >
    <!-- Whitespace-sensitive: segments join with explicit single spaces to match the seed's line breaks; keep this block on one line. -->
    <Buttons align={demoClassName ? undefined : demoAlign} className={demoClassName}>{#if pg.childrenEnabled}{#each demoButtons as child, index}{#if index > 0}{' '}{/if}{#if child.kind === 'button'}<Button variant={child.variant}>{child.label}</Button>{:else if child.kind === 'html'}{#if child.tag === 'div'}<div>{child.text}</div>{:else if child.tag === 'span'}<span>{child.text}</span>{:else}<p>{child.text}</p>{/if}{:else}{child.text}{/if}{/each}{/if}</Buttons>
  </ShowcasePage>
