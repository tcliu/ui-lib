<script lang="ts">
  import Menu, { type MenuItemState } from '$lib/components/Menu.svelte'
  import KebabIcon from '$lib/icons/KebabIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import type { SnippetAttribute } from '$showcase/snippet-attributes'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/staged'
  import { enumField, textField, boolField, jsonField, snippetDialog, snippetField, sizeField } from '$showcase/snippet-field'
  import {
    buildMenuIconMarkup,
    buildMenuSnippet,
    MENU_STAGE_CONTENT,
    MENU_STAGE_DEFAULT_WIDTH,
    MENU_STAGE_MIN_WIDTH,
    parseMenuIconMarkup,
    parseMenuItemsJson,
    parseMenuItemsValue,
    parseTriggerTooltipJson,
    seedMenuItems,
    type MenuDemoItem,
  } from './demo-snippet'
  import { type TriState } from '$showcase/snippet-build'

  const i18n = getI18nContext()

  interface DemoItem {
    id: string
    label: string
    disabled?: boolean
    onClick: () => void
  }

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below. The chrome
  // classes seed to the demo's structural values. The item list is committed
  // state edited through the JSON dialog.
  const INITIAL = {
    align: staged('right'),
    triggerLabel: staged('More actions', true),
    items: staged(seedMenuItems(), true),
    autoPlace: staged('yes' as TriState),
    triggerClass: staged(''),
    panelClass: staged('w-44', true),
    size: staged('md'),
    id: staged(''),
    triggerTooltip: staged(''),
    triggerTooltipAlign: '',
    itemRole: staged('menuitem'),
    phoneSheetTitle: staged(''),
    closeLabel: staged(''),
    lastAction: '',
    iconClass: staged('', true),
    itemPrefix: staged('', true),
    stageWidth: MENU_STAGE_DEFAULT_WIDTH,
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires items, so the eye resets to the seeds instead of
  // omitting; committing re-applies.
  // The tooltip object applies only while its eye toggle is on (on, so the
  // cleared form renders the current demo); the strings are preserved while
  // off.
  // Required snippets reset through their eye instead of omitting: the icon
  // class and the item prefix edit through their dialogs and always apply.
  // Stage width is interaction state, not a curated option; Reset restores it.

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]
  const itemRoleOptions = [
    { value: 'menuitem', label: 'menuitem' },
    { value: 'menuitemradio', label: 'menuitemradio' },
  ]

  const demoAlign = $derived((applied(pg.align) || undefined) as 'left' | 'right' | undefined)
  const autoPlace = $derived(appliedFlag(pg.autoPlace))
  const demoTriggerTooltipAlign = $derived(
    (pg.triggerTooltipAlign || undefined) as 'center' | 'left' | 'right' | undefined,
  )
  const demoTriggerTooltip = $derived(
    pg.triggerTooltip.value ? { text: pg.triggerTooltip.value, align: demoTriggerTooltipAlign } : undefined,
  )

  // Commit a tooltip JSON draft from the dialog or a snippet write-back:
  // invalid shapes leave state alone, and an empty text clears the tooltip
  // back to unset.
  function commitTriggerTooltipJson(json: string) {
    // A deleted snippet line reads back as '' and unsets the tooltip.
    if (json === '') {
      pg.triggerTooltip.value = ''
      pg.triggerTooltipAlign = ''
      return
    }
    const parsed = parseTriggerTooltipJson(json)
    if (!parsed) return
    pg.triggerTooltip.value = parsed.text
    pg.triggerTooltipAlign = parsed.align ?? ''
  }

  // Read the inline `triggerTooltip={{ ... }}` expression back into a JSON
  // draft. A missing object unsets (like the builder omitting the line);
  // anything else is custom code the playground leaves alone.
  function readTriggerTooltipAttribute(attrs: Map<string, SnippetAttribute> | null): string | undefined {
    const attr = attrs?.get('triggerTooltip')
    // Absent resolves to the current state, never a reset: toggling the eye off
    // re-seeds the omitted prop, and that write must not wipe the committed
    // tooltip.
    if (!attr) return pg.triggerTooltip.value ? JSON.stringify(demoTriggerTooltip) : ''
    if (attr.kind !== 'expression') return undefined
    const body = attr.value.trim()
    if (!body.startsWith('{') || !body.endsWith('}')) return undefined
    const textMatch = /text\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(body)
    if (!textMatch) return undefined
    const out: Record<string, string> = {
      text: (textMatch[1] ?? '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
    }
    const alignMatch = /align\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(body)
    if (alignMatch?.[1] !== undefined) {
      out.align = alignMatch[1]
    }
    return JSON.stringify(out)
  }
  const demoItemRole = $derived((applied(pg.itemRole) || undefined) as 'menuitem' | 'menuitemradio' | undefined)
  const triggerLabel = $derived(applied(pg.triggerLabel) || i18n.t('kebab.label'))
  // The sheet props form a required pair in the component: a title always
  // carries a close label. Unset, the pair is absent; the component otherwise
  // falls back to the trigger's label, so the demo can stand in that default.
  const demoPhoneSheet = $derived.by(() => {
    const title = applied(pg.phoneSheetTitle)
    const close = applied(pg.closeLabel)
    if (title) {
      return { phoneSheetTitle: title, closeLabel: close || triggerLabel }
    }
    return close ? { closeLabel: close } : {}
  })
  const demoItems = $derived<DemoItem[]>(
    pg.items.value.map(entry => ({ ...entry, onClick: () => (pg.lastAction = entry.label) })),
  )
  // The trigger's scale: the shared Button sizes the trigger and its glyph.
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })

  function menuItemClass(item: DemoItem, state: MenuItemState): string {
    return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm outline-none transition-none ${
      state.disabled ? 'cursor-not-allowed text-slate-600' : 'text-slate-300 focus:bg-slate-800 focus:text-cyan-200'
    }`
  }

  const iconMarkup = $derived(buildMenuIconMarkup(pg.iconClass.value))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildMenuSnippet({
      align: pg.align,
      triggerLabel: pg.triggerLabel,
      items: pg.items,
      autoPlace: pg.autoPlace,
      id: pg.id,
      triggerTooltip: pg.triggerTooltip,
      triggerTooltipAlign: pg.triggerTooltipAlign,
      itemRole: pg.itemRole,
      phoneSheetTitle: pg.phoneSheetTitle,
      closeLabel: pg.closeLabel,
      triggerClass: pg.triggerClass,
      panelClass: pg.panelClass,
      size: pg.size,
      iconClass: pg.iconClass,
      itemPrefix: pg.itemPrefix,
    }),
  )

  
  // Editable rows first (primitives, plain data, and snippets, A–Z), then the
  // function props (A–Z). Snippet rows keep no Value editor yet; the snippet
  // playground remains their customization surface.
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'right'", note: 'Panel edge anchored to the trigger.', options: alignOptions, placeholder: 'right', clearLabel: 'Clear align', ...eye(pg.align) }),
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger.', editor: 'text', clearable: true, ...eye(pg.triggerLabel), onChange: value => stage(pg.triggerLabel, value), toggle: eyeToggle(pg.triggerLabel), sync: { kind: 'scopeText', scopeRef: 'triggerLabel' } },
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', ...eyeFlag(pg.autoPlace) }),
    textField({ name: 'closeLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the phone sheet close button; required with phoneSheetTitle.', clearable: true, ...eye(pg.closeLabel) }),
    snippetField({
      name: 'icon',
      note: 'Trigger icon; the dialog edits its class, and the eye resets the class. The trigger Button sizes the glyph, so the class never carries a size.',
      value: iconMarkup,
      onChange: (draft: string) => {
        const parsed = parseMenuIconMarkup(draft)
        if (parsed !== null) {
          stage(pg.iconClass, parsed)
        }
      },
      dialog: snippetDialog(parseMenuIconMarkup, 'Invalid icon markup. Keep the single <KebabIcon> line with its class.'),
      toggle: eyeResetToggle(pg.iconClass, () => (pg.iconClass.value = '')),
    }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native id the panel id derives from.', clearable: true, ...eye(pg.id) }),
    snippetField({
      type: 'Snippet<[item, state]>',
      name: 'item',
      note: 'Row renderer; the dialog edits its prefix text, and the eye resets the prefix.',
      value: pg.itemPrefix.value,
      onChange: value => stage(pg.itemPrefix, value),
      toggle: eyeResetToggle(pg.itemPrefix, () => (pg.itemPrefix.value = '')),
    }),
    enumField({ name: 'itemRole', type: "'menuitem' | 'menuitemradio'", defaultValue: "'menuitem'", note: 'ARIA role each row renders with.', options: itemRoleOptions, placeholder: 'menuitem', clearLabel: 'Clear item role', ...eye(pg.itemRole) }),
    jsonField({
      name: 'items',
      type: '{ id: string; label: string; disabled?: boolean }[]',
      note: 'Row entries; the eye resets to the seed entries.',
      value: JSON.stringify(pg.items.value, null, 2),
      onChange: (draft: string) => {
        const parsed = parseMenuItemsJson(draft)
        if (parsed) {
          stage(pg.items, parsed)
        }
      },
      dialog: { valid: (draft: string) => parseMenuItemsJson(draft) != null, invalidMessage: 'Invalid items JSON. Use an array of { id, label, disabled? } objects.' },
      toggle: eyeResetToggle(pg.items, () => (pg.items.value = seedMenuItems())),
      sync: { kind: 'scriptJson', parseJson: parseMenuItemsValue, setJson: value => (pg.items.value = value as MenuDemoItem[]) },
    }),
    textField({ name: 'panelClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the floating panel.', editorDefaultValue: '', clearable: true, ...eye(pg.panelClass) }),
    textField({ name: 'phoneSheetTitle', type: 'string?', defaultValue: '—', note: 'Opts into the phone bottom-sheet presentation; pair with closeLabel.', clearable: true, ...eye(pg.phoneSheetTitle) }),
    sizeField({ note: 'Scale of the trigger button; the trigger glyph follows it, and the panel chrome keeps its own metrics.', ...eye(pg.size) }),
    textField({ name: 'triggerClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the trigger button; never padding — the trigger takes its box from the Button’s icon-only metrics.', editorDefaultValue: '', clearable: true, ...eye(pg.triggerClass) }),
    jsonField({
      name: 'triggerTooltip',
      type: '{ text: string; align?: "center" | "left" | "right" }',
      note: 'Wraps the trigger with the positioned Tooltip; the dialog edits text and align, and the eye applies the object.',
      value: JSON.stringify(demoTriggerTooltip ?? { text: '' }, null, 2),
      onChange: (draft: string) => {
        commitTriggerTooltipJson(draft)
        if (parseTriggerTooltipJson(draft)) pg.triggerTooltip.on = true
      },
      dialog: { valid: (draft: string) => parseTriggerTooltipJson(draft) != null, invalidMessage: 'Invalid tooltip JSON. Use { text } with an optional align of center, left, or right.', title: 'Edit triggerTooltip' },
      toggle: eyeToggle(pg.triggerTooltip),
      sync: { kind: 'custom', read: readTriggerTooltipAttribute, set: commitTriggerTooltipJson },
    }),
    { name: 'itemChecked', type: '(item: T) => boolean', defaultValue: '—', note: 'Checked row for menuitemradio.' },
    { name: 'itemClass', type: '(item, state) => string', defaultValue: '—', note: 'Row classes by state.' },
    { name: 'itemDisabled', type: '(item: T) => boolean', defaultValue: '() => false', note: 'Disables a row.' },
    { name: 'itemKey', type: '(item: T) => string', defaultValue: '—', note: 'Stable key per row.' },
    { name: 'itemLabel', type: '(item: T) => string', defaultValue: '—', note: 'Searchable text for type-ahead.' },
    { name: 'onSelect', type: '(index: number) => void', defaultValue: '—', note: 'Called with the picked row index.' }
  ])

</script>

{#snippet menuTriggerIcon()}
  <KebabIcon className={pg.iconClass.value} />
{/snippet}

{#snippet menuRow(item: DemoItem, _state: MenuItemState)}
  <span>{pg.itemPrefix.value}{item.label}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="Menu"
    {code}
    onReset={clearPlayground}
    scope={{
      menuItemClass,
      triggerLabel: i18n.t('kebab.label'),
      lastAction: pg.lastAction,
    }}
    stage={{ minWidth: MENU_STAGE_MIN_WIDTH }}
    bind:stageWidth={pg.stageWidth}

    sync={{ tag: 'Menu' }}
  >
    <div class={MENU_STAGE_CONTENT}>
      <Menu
        items={demoItems}
        itemKey={item => item.id}
        onSelect={index => demoItems[index].onClick()}
        icon={menuTriggerIcon}
        item={menuRow}
        ariaLabel={triggerLabel}
        align={demoAlign}
        {autoPlace}
        size={demoSize}
        id={applied(pg.id) || undefined}
        triggerTooltip={applied(pg.triggerTooltip) ? demoTriggerTooltip : undefined}
        triggerClass={applied(pg.triggerClass) || undefined}
        panelClass={applied(pg.panelClass) || undefined}
        itemRole={demoItemRole}
        {...demoPhoneSheet}
        itemClass={menuItemClass}
        itemLabel={item => item.label}
        itemDisabled={item => item.disabled ?? false} />
      <span class="text-sm text-slate-400">last action: {pg.lastAction || '—'}</span>
    </div>
  </ShowcasePage>
