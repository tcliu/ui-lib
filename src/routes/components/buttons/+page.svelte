<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { enumField, textField, sizeField, snippetDialog, snippetField } from '$showcase/snippet-field'
  import { applied, eye, eyeToggle, stage, staged } from '$showcase/staged'
  import { buildButtonsSnippet, buttonsChildrenSnippet, normalizeButtonsDraft, parseButtonsList, type ButtonsChildSegment } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. The laid-out
  // buttons are demo data edited through the children dialog below: raw
  // markup while customized, empty for the canonical pair.
  const INITIAL = {
    align: staged('left'),
    className: staged(''),
    size: staged('md'),
    // The size every button in the row takes (demo data: the buttons are the
    // page's own markup, so the size rides them, not the row).
    buttonSize: 'md',
    // The laid-out buttons are demo data: the pair carries the committed
    // markup and its eye whether the children snippet applies.
    children: staged('', true),
  }
  let pg = $state(structuredClone(INITIAL))

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'center', label: 'center' },
    { value: 'right', label: 'right' },
  ]

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]

  const demoAlign = $derived((applied(pg.align) || undefined) as 'left' | 'center' | 'right' | undefined)
  const demoClassName = $derived(applied(pg.className) || undefined)
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoButtonSize = $derived(pg.buttonSize ? parseSizeValue(pg.buttonSize) : undefined)
  const okLabel = $derived(i18n.t('common.ok'))
  const cancelLabel = $derived(i18n.t('common.cancel'))
  // Custom markup renders as committed; unset, the canonical pair reads the
  // localized defaults from scope. Stored drafts are always valid, so the
  // fallback only covers the empty state.
  const demoButtons = $derived<ButtonsChildSegment[]>(
    parseButtonsList(pg.children.value) ?? [
      { kind: 'button', variant: 'primary', label: okLabel },
      { kind: 'button', variant: 'outline', label: cancelLabel },
    ],
  )

  // The children row edits the inner `<Button>` markup the `Buttons` component
  // lays out (demo data, so it has no single prop). FieldTable owns the dialog:
  // the edit icon seeds the draft from the live markup and only commits on OK.
  // Committing the canonical pair resets to unset, so defaults keep flowing
  // from scope (e.g. on locale change).
  const childrenSnippet = $derived(pg.children.value || buttonsChildrenSnippet(okLabel, cancelLabel))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildButtonsSnippet({ align: pg.align, className: pg.className, size: pg.size, buttonSize: pg.buttonSize, children: pg.children }),
  )

  
  // Editable rows first (A–Z).
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'align', type: "'left' | 'center' | 'right'", defaultValue: "'left'", note: 'Horizontal alignment of the default row.', options: alignOptions, placeholder: 'left', clearLabel: 'Clear align', ...eye(pg.align) }),
    snippetField({
      name: 'children',
      note: 'Buttons to lay out; committing applies it.',
      value: childrenSnippet,
      onChange: (draft: string) => {
        if (!parseButtonsList(draft)) return
        const normalized = normalizeButtonsDraft(draft)
        stage(pg.children, normalized === buttonsChildrenSnippet(okLabel, cancelLabel) ? '' : normalized)
      },
      dialog: snippetDialog(parseButtonsList, 'Use valid <Button> markup, e.g. <Button variant="primary">OK</Button>.'),
      toggle: eyeToggle(pg.children),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: '—', note: 'Replaces the default layout classes (align is ignored).', clearable: true, ...eye(pg.className) }),
    sizeField({ note: 'Row scale; the gap between the buttons follows it, and numbers are pixels.', ...eye(pg.size) }),
  ])

  // The seed reads both labels from scope while unset, which reseeding never
  // refreshes; recompile the draft on those scope changes without touching the
  // editor text (e.g. on locale change).
  </script>

<!-- Whitespace-sensitive: segments join with explicit single spaces to match the seed's line breaks; keep this snippet on one line. -->
{#snippet buttonsChildren()}{#each demoButtons as child, index}{#if index > 0}{' '}{/if}{#if child.kind === 'button'}<Button variant={child.variant} size={demoButtonSize}>{child.label}</Button>{:else if child.kind === 'html'}{#if child.tag === 'div'}<div>{child.text}</div>{:else if child.tag === 'span'}<span>{child.text}</span>{:else}<p>{child.text}</p>{/if}{:else}{child.text}{/if}{/each}{/snippet}

{#snippet settingsPanel()}
  <!-- The size preset drives two things at once — the row's gap (the `size`
    prop) and the size of every button in it — so it stays here; the props
    table edits the row's own size. -->
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.buttonSize}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => {
          stage(pg.size, value)
          pg.buttonSize = value
        }}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size.value = 'md'
          pg.size.on = false
          pg.buttonSize = 'md'
        }} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage
    {fields}
    title="Buttons"
    {code}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{ okLabel, cancelLabel }}

    sync={{ tag: 'Buttons' }}
    scopeRefresh={() => [okLabel, cancelLabel]}
  >
    <Buttons align={demoClassName ? undefined : demoAlign} size={demoClassName ? undefined : demoSize} className={demoClassName} children={pg.children.on ? buttonsChildren : undefined} />
  </ShowcasePage>
