<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import Menu, { type MenuItemState } from '$lib/components/Menu.svelte'
  import KebabIcon from '$lib/icons/KebabIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import type { SnippetAttribute } from '$lib/showcase/snippet-attributes'
  import { enumField, textField, boolField, jsonField, resetToggle, snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
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
    type TriState,
  } from './demo-snippet'

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
    align: 'right',
    alignOn: false,
    triggerLabel: 'More actions',
    triggerLabelOn: true,
    items: seedMenuItems() as MenuDemoItem[],
    itemsEnabled: true,
    autoPlace: 'yes' as TriState,
    autoPlaceOn: true,
    triggerClass: 'p-2',
    triggerClassOn: true,
    panelClass: 'w-44',
    panelClassOn: true,
    id: '',
    idOn: false,
    triggerTooltip: '',
    triggerTooltipAlign: '',
    triggerTooltipEnabled: true,
    itemRole: 'menuitem',
    itemRoleOn: false,
    phoneSheetTitle: '',
    phoneSheetTitleOn: false,
    closeLabel: '',
    closeLabelOn: false,
    lastAction: '',
    iconClass: '',
    itemPrefix: '',
    iconEnabled: true,
    itemEnabled: true,
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

  const demoAlign = $derived(pg.alignOn ? ((pg.align || undefined) as 'left' | 'right' | undefined) : undefined)
  const autoPlace = $derived(pg.autoPlaceOn ? flagOn(pg.autoPlace) : undefined)
  const demoTriggerTooltipAlign = $derived(
    (pg.triggerTooltipAlign || undefined) as 'center' | 'left' | 'right' | undefined,
  )
  const demoTriggerTooltip = $derived(
    pg.triggerTooltip ? { text: pg.triggerTooltip, align: demoTriggerTooltipAlign } : undefined,
  )

  // Commit a tooltip JSON draft from the dialog or a snippet write-back:
  // invalid shapes leave state alone, and an empty text clears the tooltip
  // back to unset.
  function commitTriggerTooltipJson(json: string) {
    // A deleted snippet line reads back as '' and unsets the tooltip.
    if (json === '') {
      pg.triggerTooltip = ''
      pg.triggerTooltipAlign = ''
      return
    }
    const parsed = parseTriggerTooltipJson(json)
    if (!parsed) return
    pg.triggerTooltip = parsed.text
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
    if (!attr) return pg.triggerTooltip ? JSON.stringify(demoTriggerTooltip) : ''
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
  const demoItemRole = $derived(pg.itemRoleOn ? ((pg.itemRole || undefined) as 'menuitem' | 'menuitemradio' | undefined) : undefined)
  const triggerLabel = $derived(pg.triggerLabelOn && pg.triggerLabel ? pg.triggerLabel : i18n.t('kebab.label'))
  // The sheet props form a required pair in the component: a title always
  // carries a close label. Unset, the pair is absent; the component otherwise
  // falls back to the trigger's label, so the demo can stand in that default.
  const demoPhoneSheet = $derived(
    pg.phoneSheetTitleOn && pg.phoneSheetTitle
      ? { phoneSheetTitle: pg.phoneSheetTitle, closeLabel: pg.closeLabelOn && pg.closeLabel ? pg.closeLabel : triggerLabel }
      : pg.closeLabelOn && pg.closeLabel
        ? { closeLabel: pg.closeLabel }
        : {},
  )
  const demoItems = $derived<DemoItem[]>(
    pg.items.map(entry => ({ ...entry, onClick: () => (pg.lastAction = entry.label) })),
  )

  function menuItemClass(item: DemoItem, state: MenuItemState): string {
    return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm outline-none transition-none ${
      state.disabled ? 'cursor-not-allowed text-slate-600' : 'text-slate-300 focus:bg-slate-800 focus:text-cyan-200'
    }`
  }

  const iconMarkup = $derived(buildMenuIconMarkup(pg.iconClass))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildMenuSnippet({
      align: pg.align,
      alignOn: pg.alignOn,
      triggerLabel: pg.triggerLabel,
      triggerLabelOn: pg.triggerLabelOn,
      items: pg.items,
      autoPlace: pg.autoPlace,
      autoPlaceOn: pg.autoPlaceOn,
      id: pg.id,
      idOn: pg.idOn,
      triggerTooltip: pg.triggerTooltip,
      triggerTooltipAlign: pg.triggerTooltipAlign,
      triggerTooltipEnabled: pg.triggerTooltipEnabled,
      itemRole: pg.itemRole,
      itemRoleOn: pg.itemRoleOn,
      phoneSheetTitle: pg.phoneSheetTitle,
      phoneSheetTitleOn: pg.phoneSheetTitleOn,
      closeLabel: pg.closeLabel,
      closeLabelOn: pg.closeLabelOn,
      triggerClass: pg.triggerClass,
      triggerClassOn: pg.triggerClassOn,
      panelClass: pg.panelClass,
      panelClassOn: pg.panelClassOn,
      iconClass: pg.iconClass,
      itemPrefix: pg.itemPrefix,
    }),
  )

  
  // Editable rows first (primitives, plain data, and snippets, A–Z), then the
  // function props (A–Z). Snippet rows keep no Value editor yet; the snippet
  // playground remains their customization surface.
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'right'", note: 'Panel edge anchored to the trigger.', options: alignOptions, value: pg.align, onChange: v => (pg.align = v), placeholder: 'right', clearLabel: 'Clear align', enabled: pg.alignOn, setEnabled: v => (pg.alignOn = v) }),
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger.', editor: 'text', clearable: true, value: pg.triggerLabel, onChange: value => { pg.triggerLabel = value; pg.triggerLabelOn = true; }, toggle: snippetToggle(pg.triggerLabelOn, enabled => (pg.triggerLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'triggerLabel' } },
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', value: pg.autoPlace, onChange: v => (pg.autoPlace = v as TriState), enabled: pg.autoPlaceOn, setEnabled: v => (pg.autoPlaceOn = v) }),
    textField({ name: 'closeLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the phone sheet close button; required with phoneSheetTitle.', value: pg.closeLabel, onChange: v => (pg.closeLabel = v), clearable: true, enabled: pg.closeLabelOn, setEnabled: v => (pg.closeLabelOn = v) }),
    snippetField({
      name: 'icon',
      note: 'Trigger icon; the dialog edits its class, and the eye resets the class.',
      value: iconMarkup,
      onChange: (draft: string) => {
        const parsed = parseMenuIconMarkup(draft)
        if (parsed !== null) {
          pg.iconClass = parsed
          pg.iconEnabled = true
        }
      },
      dialog: snippetDialog(parseMenuIconMarkup, 'Invalid icon markup. Keep the single <KebabIcon> line with its class.'),
      toggle: resetToggle(
        pg.iconEnabled,
        enabled => (pg.iconEnabled = enabled),
        () => (pg.iconClass = ''),
      ),
    }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native id the panel id derives from.', value: pg.id, onChange: v => (pg.id = v), clearable: true, enabled: pg.idOn, setEnabled: v => (pg.idOn = v) }),
    snippetField({
      type: 'Snippet<[item, state]>',
      name: 'item',
      note: 'Row renderer; the dialog edits its prefix text, and the eye resets the prefix.',
      value: pg.itemPrefix,
      onChange: value => {
        pg.itemPrefix = value
        pg.itemEnabled = true
      },
      toggle: resetToggle(
        pg.itemEnabled,
        enabled => (pg.itemEnabled = enabled),
        () => (pg.itemPrefix = ''),
      ),
    }),
    enumField({ name: 'itemRole', type: "'menuitem' | 'menuitemradio'", defaultValue: "'menuitem'", note: 'ARIA role each row renders with.', options: itemRoleOptions, value: pg.itemRole, onChange: v => (pg.itemRole = v), placeholder: 'menuitem', clearLabel: 'Clear item role', enabled: pg.itemRoleOn, setEnabled: v => (pg.itemRoleOn = v) }),
    jsonField({
      name: 'items',
      type: '{ id: string; label: string; disabled?: boolean }[]',
      note: 'Row entries; the eye resets to the seed entries.',
      value: JSON.stringify(pg.items, null, 2),
      onChange: (draft: string) => {
        const parsed = parseMenuItemsJson(draft)
        if (parsed) {
          pg.items = parsed
          pg.itemsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseMenuItemsJson(draft) != null, invalidMessage: 'Invalid items JSON. Use an array of { id, label, disabled? } objects.' },
      toggle: resetToggle(
        pg.itemsEnabled,
        enabled => (pg.itemsEnabled = enabled),
        () => (pg.items = seedMenuItems()),
      ),
      sync: { kind: 'scriptJson', parseJson: parseMenuItemsValue, setJson: value => (pg.items = value as MenuDemoItem[]) },
    }),
    textField({ name: 'panelClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the floating panel.', value: pg.panelClass, onChange: v => (pg.panelClass = v), editorDefaultValue: '', clearable: true, enabled: pg.panelClassOn, setEnabled: v => (pg.panelClassOn = v) }),
    textField({ name: 'phoneSheetTitle', type: 'string?', defaultValue: '—', note: 'Opts into the phone bottom-sheet presentation; pair with closeLabel.', value: pg.phoneSheetTitle, onChange: v => (pg.phoneSheetTitle = v), clearable: true, enabled: pg.phoneSheetTitleOn, setEnabled: v => (pg.phoneSheetTitleOn = v) }),
    textField({ name: 'triggerClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the trigger button.', value: pg.triggerClass, onChange: v => (pg.triggerClass = v), editorDefaultValue: '', clearable: true, enabled: pg.triggerClassOn, setEnabled: v => (pg.triggerClassOn = v) }),
    jsonField({
      name: 'triggerTooltip',
      type: '{ text: string; align?: "center" | "left" | "right" }',
      note: 'Wraps the trigger with the positioned Tooltip; the dialog edits text and align, and the eye applies the object.',
      value: JSON.stringify(demoTriggerTooltip ?? { text: '' }, null, 2),
      onChange: (draft: string) => {
        commitTriggerTooltipJson(draft)
        if (parseTriggerTooltipJson(draft)) pg.triggerTooltipEnabled = true
      },
      dialog: { valid: (draft: string) => parseTriggerTooltipJson(draft) != null, invalidMessage: 'Invalid tooltip JSON. Use { text } with an optional align of center, left, or right.', title: 'Edit triggerTooltip' },
      toggle: snippetToggle(pg.triggerTooltipEnabled, enabled => (pg.triggerTooltipEnabled = enabled)),
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
  <KebabIcon className={pg.iconClass} />
{/snippet}

{#snippet menuRow(item: DemoItem, _state: MenuItemState)}
  <span>{pg.itemPrefix}{item.label}</span>
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
        id={pg.idOn && pg.id ? pg.id : undefined}
        triggerTooltip={pg.triggerTooltipEnabled ? demoTriggerTooltip : undefined}
        triggerClass={pg.triggerClassOn && pg.triggerClass ? pg.triggerClass : undefined}
        panelClass={pg.panelClassOn && pg.panelClass ? pg.panelClass : undefined}
        itemRole={demoItemRole}
        {...demoPhoneSheet}
        itemClass={menuItemClass}
        itemLabel={item => item.label}
        itemDisabled={item => item.disabled ?? false} />
      <span class="text-sm text-slate-400">last action: {pg.lastAction || '—'}</span>
    </div>
  </ShowcasePage>
