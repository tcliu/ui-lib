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
  let pgAlign = $state('right')
  let pgAlignOn = $state(false)
  let pgTriggerLabel = $state('More actions')
  let pgTriggerLabelOn = $state(true)
  let pgItems = $state<MenuDemoItem[]>(seedMenuItems())
  // The component requires items, so the eye resets to the seeds instead of
  // omitting; committing re-applies.
  let pgItemsEnabled = $state(true)
  let pgAutoPlace = $state<TriState>('yes')
  let pgAutoPlaceOn = $state(true)
  let pgTriggerClass = $state('p-2')
  let pgTriggerClassOn = $state(true)
  let pgPanelClass = $state('w-44')
  let pgPanelClassOn = $state(true)
  let pgId = $state('')
  let pgIdOn = $state(false)
  let pgTriggerTooltip = $state('')
  let pgTriggerTooltipAlign = $state('')
  // The tooltip object applies only while its eye toggle is on (on, so the
  // cleared form renders the current demo); the strings are preserved while
  // off.
  let pgTriggerTooltipEnabled = $state(true)
  let pgItemRole = $state('menuitem')
  let pgItemRoleOn = $state(false)
  let pgPhoneSheetTitle = $state('')
  let pgPhoneSheetTitleOn = $state(false)
  let pgCloseLabel = $state('')
  let pgCloseLabelOn = $state(false)
  let pgLastAction = $state('')
  // Required snippets reset through their eye instead of omitting: the icon
  // class and the item prefix edit through their dialogs and always apply.
  let pgIconClass = $state('')
  let pgItemPrefix = $state('')
  let pgIconEnabled = $state(true)
  let pgItemEnabled = $state(true)
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(MENU_STAGE_DEFAULT_WIDTH)

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]
  const itemRoleOptions = [
    { value: 'menuitem', label: 'menuitem' },
    { value: 'menuitemradio', label: 'menuitemradio' },
  ]

  const demoAlign = $derived(pgAlignOn ? ((pgAlign || undefined) as 'left' | 'right' | undefined) : undefined)
  const autoPlace = $derived(pgAutoPlaceOn ? flagOn(pgAutoPlace) : undefined)
  const demoTriggerTooltipAlign = $derived(
    (pgTriggerTooltipAlign || undefined) as 'center' | 'left' | 'right' | undefined,
  )
  const demoTriggerTooltip = $derived(
    pgTriggerTooltip ? { text: pgTriggerTooltip, align: demoTriggerTooltipAlign } : undefined,
  )

  // Commit a tooltip JSON draft from the dialog or a snippet write-back:
  // invalid shapes leave state alone, and an empty text clears the tooltip
  // back to unset.
  function commitTriggerTooltipJson(json: string) {
    // A deleted snippet line reads back as '' and unsets the tooltip.
    if (json === '') {
      pgTriggerTooltip = ''
      pgTriggerTooltipAlign = ''
      return
    }
    const parsed = parseTriggerTooltipJson(json)
    if (!parsed) return
    pgTriggerTooltip = parsed.text
    pgTriggerTooltipAlign = parsed.align ?? ''
  }

  // Read the inline `triggerTooltip={{ ... }}` expression back into a JSON
  // draft. A missing object unsets (like the builder omitting the line);
  // anything else is custom code the playground leaves alone.
  function readTriggerTooltipAttribute(attrs: Map<string, SnippetAttribute> | null): string | undefined {
    const attr = attrs?.get('triggerTooltip')
    // Absent resolves to the current state, never a reset: toggling the eye off
    // re-seeds the omitted prop, and that write must not wipe the committed
    // tooltip.
    if (!attr) return pgTriggerTooltip ? JSON.stringify(demoTriggerTooltip) : ''
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
  const demoItemRole = $derived(pgItemRoleOn ? ((pgItemRole || undefined) as 'menuitem' | 'menuitemradio' | undefined) : undefined)
  const triggerLabel = $derived(pgTriggerLabelOn && pgTriggerLabel ? pgTriggerLabel : i18n.t('kebab.label'))
  // The sheet props form a required pair in the component: a title always
  // carries a close label. Unset, the pair is absent; the component otherwise
  // falls back to the trigger's label, so the demo can stand in that default.
  const demoPhoneSheet = $derived(
    pgPhoneSheetTitleOn && pgPhoneSheetTitle
      ? { phoneSheetTitle: pgPhoneSheetTitle, closeLabel: pgCloseLabelOn && pgCloseLabel ? pgCloseLabel : triggerLabel }
      : pgCloseLabelOn && pgCloseLabel
        ? { closeLabel: pgCloseLabel }
        : {},
  )
  const demoItems = $derived<DemoItem[]>(
    pgItems.map(entry => ({ ...entry, onClick: () => (pgLastAction = entry.label) })),
  )

  function menuItemClass(item: DemoItem, state: MenuItemState): string {
    return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm outline-none transition-none ${
      state.disabled ? 'cursor-not-allowed text-slate-600' : 'text-slate-300 focus:bg-slate-800 focus:text-cyan-200'
    }`
  }

  const iconMarkup = $derived(buildMenuIconMarkup(pgIconClass))

  function clearPlayground() {
    pgAlign = 'right'
    pgAlignOn = false
    pgTriggerLabel = 'More actions'
    pgTriggerLabelOn = true
    pgItems = seedMenuItems()
    pgItemsEnabled = true
    pgIconClass = ''
    pgItemPrefix = ''
    pgIconEnabled = true
    pgItemEnabled = true
    pgAutoPlace = 'yes'
    pgAutoPlaceOn = true
    pgTriggerClass = 'p-2'
    pgTriggerClassOn = true
    pgPanelClass = 'w-44'
    pgPanelClassOn = true
    pgId = ''
    pgIdOn = false
    pgTriggerTooltip = ''
    pgTriggerTooltipAlign = ''
    pgTriggerTooltipEnabled = true
    pgItemRole = 'menuitem'
    pgItemRoleOn = false
    pgPhoneSheetTitle = ''
    pgPhoneSheetTitleOn = false
    pgCloseLabel = ''
    pgCloseLabelOn = false
    pgLastAction = ''
    pgStageWidth = MENU_STAGE_DEFAULT_WIDTH
  }

  const code = $derived.by(() =>
    buildMenuSnippet({
      align: pgAlign,
      alignOn: pgAlignOn,
      triggerLabel: pgTriggerLabel,
      triggerLabelOn: pgTriggerLabelOn,
      items: pgItems,
      autoPlace: pgAutoPlace,
      autoPlaceOn: pgAutoPlaceOn,
      id: pgId,
      idOn: pgIdOn,
      triggerTooltip: pgTriggerTooltip,
      triggerTooltipAlign: pgTriggerTooltipAlign,
      triggerTooltipEnabled: pgTriggerTooltipEnabled,
      itemRole: pgItemRole,
      itemRoleOn: pgItemRoleOn,
      phoneSheetTitle: pgPhoneSheetTitle,
      phoneSheetTitleOn: pgPhoneSheetTitleOn,
      closeLabel: pgCloseLabel,
      closeLabelOn: pgCloseLabelOn,
      triggerClass: pgTriggerClass,
      triggerClassOn: pgTriggerClassOn,
      panelClass: pgPanelClass,
      panelClassOn: pgPanelClassOn,
      iconClass: pgIconClass,
      itemPrefix: pgItemPrefix,
    }),
  )

  
  // Editable rows first (primitives, plain data, and snippets, A–Z), then the
  // function props (A–Z). Snippet rows keep no Value editor yet; the snippet
  // playground remains their customization surface.
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'align', type: "'left' | 'right'", defaultValue: "'right'", note: 'Panel edge anchored to the trigger.', options: alignOptions, value: pgAlign, onChange: v => (pgAlign = v), placeholder: 'right', clearLabel: 'Clear align', enabled: pgAlignOn, setEnabled: v => (pgAlignOn = v) }),
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger.', editor: 'text', clearable: true, value: pgTriggerLabel, onChange: value => { pgTriggerLabel = value; pgTriggerLabelOn = true; }, toggle: snippetToggle(pgTriggerLabelOn, enabled => (pgTriggerLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'triggerLabel' } },
    boolField({ name: 'autoPlace', defaultValue: 'true', note: 'Flips the panel when crowded.', value: pgAutoPlace, onChange: v => (pgAutoPlace = v as TriState), enabled: pgAutoPlaceOn, setEnabled: v => (pgAutoPlaceOn = v) }),
    textField({ name: 'closeLabel', type: 'string?', defaultValue: '—', note: 'Accessible name for the phone sheet close button; required with phoneSheetTitle.', value: pgCloseLabel, onChange: v => (pgCloseLabel = v), clearable: true, enabled: pgCloseLabelOn, setEnabled: v => (pgCloseLabelOn = v) }),
    snippetField({
      name: 'icon',
      note: 'Trigger icon; the dialog edits its class, and the eye resets the class.',
      value: iconMarkup,
      onChange: (draft: string) => {
        const parsed = parseMenuIconMarkup(draft)
        if (parsed !== null) {
          pgIconClass = parsed
          pgIconEnabled = true
        }
      },
      dialog: snippetDialog(parseMenuIconMarkup, 'Invalid icon markup. Keep the single <KebabIcon> line with its class.'),
      toggle: resetToggle(
        pgIconEnabled,
        enabled => (pgIconEnabled = enabled),
        () => (pgIconClass = ''),
      ),
    }),
    textField({ name: 'id', type: 'string?', defaultValue: '—', note: 'Native id the panel id derives from.', value: pgId, onChange: v => (pgId = v), clearable: true, enabled: pgIdOn, setEnabled: v => (pgIdOn = v) }),
    snippetField({
      type: 'Snippet<[item, state]>',
      name: 'item',
      note: 'Row renderer; the dialog edits its prefix text, and the eye resets the prefix.',
      value: pgItemPrefix,
      onChange: value => {
        pgItemPrefix = value
        pgItemEnabled = true
      },
      toggle: resetToggle(
        pgItemEnabled,
        enabled => (pgItemEnabled = enabled),
        () => (pgItemPrefix = ''),
      ),
    }),
    enumField({ name: 'itemRole', type: "'menuitem' | 'menuitemradio'", defaultValue: "'menuitem'", note: 'ARIA role each row renders with.', options: itemRoleOptions, value: pgItemRole, onChange: v => (pgItemRole = v), placeholder: 'menuitem', clearLabel: 'Clear item role', enabled: pgItemRoleOn, setEnabled: v => (pgItemRoleOn = v) }),
    jsonField({
      name: 'items',
      type: '{ id: string; label: string; disabled?: boolean }[]',
      note: 'Row entries; the eye resets to the seed entries.',
      value: JSON.stringify(pgItems, null, 2),
      onChange: (draft: string) => {
        const parsed = parseMenuItemsJson(draft)
        if (parsed) {
          pgItems = parsed
          pgItemsEnabled = true
        }
      },
      dialog: { valid: (draft: string) => parseMenuItemsJson(draft) != null, invalidMessage: 'Invalid items JSON. Use an array of { id, label, disabled? } objects.' },
      toggle: resetToggle(
        pgItemsEnabled,
        enabled => (pgItemsEnabled = enabled),
        () => (pgItems = seedMenuItems()),
      ),
      sync: { kind: 'scriptJson', parseJson: parseMenuItemsValue, setJson: value => (pgItems = value as MenuDemoItem[]) },
    }),
    textField({ name: 'panelClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the floating panel.', value: pgPanelClass, onChange: v => (pgPanelClass = v), editorDefaultValue: '', clearable: true, enabled: pgPanelClassOn, setEnabled: v => (pgPanelClassOn = v) }),
    textField({ name: 'phoneSheetTitle', type: 'string?', defaultValue: '—', note: 'Opts into the phone bottom-sheet presentation; pair with closeLabel.', value: pgPhoneSheetTitle, onChange: v => (pgPhoneSheetTitle = v), clearable: true, enabled: pgPhoneSheetTitleOn, setEnabled: v => (pgPhoneSheetTitleOn = v) }),
    textField({ name: 'triggerClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the trigger button.', value: pgTriggerClass, onChange: v => (pgTriggerClass = v), editorDefaultValue: '', clearable: true, enabled: pgTriggerClassOn, setEnabled: v => (pgTriggerClassOn = v) }),
    jsonField({
      name: 'triggerTooltip',
      type: '{ text: string; align?: "center" | "left" | "right" }',
      note: 'Wraps the trigger with the positioned Tooltip; the dialog edits text and align, and the eye applies the object.',
      value: JSON.stringify(demoTriggerTooltip ?? { text: '' }, null, 2),
      onChange: (draft: string) => {
        commitTriggerTooltipJson(draft)
        if (parseTriggerTooltipJson(draft)) pgTriggerTooltipEnabled = true
      },
      dialog: { valid: (draft: string) => parseTriggerTooltipJson(draft) != null, invalidMessage: 'Invalid tooltip JSON. Use { text } with an optional align of center, left, or right.', title: 'Edit triggerTooltip' },
      toggle: snippetToggle(pgTriggerTooltipEnabled, enabled => (pgTriggerTooltipEnabled = enabled)),
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
  <KebabIcon className={pgIconClass} />
{/snippet}

{#snippet menuRow(item: DemoItem, _state: MenuItemState)}
  <span>{pgItemPrefix}{item.label}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="Menu"
    {code}
    onReset={clearPlayground}
    scope={{
      menuItemClass,
      triggerLabel: i18n.t('kebab.label'),
      lastAction: pgLastAction,
    }}
    stage={{ minWidth: MENU_STAGE_MIN_WIDTH }}
    bind:stageWidth={pgStageWidth}

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
        id={pgIdOn && pgId ? pgId : undefined}
        triggerTooltip={pgTriggerTooltipEnabled ? demoTriggerTooltip : undefined}
        triggerClass={pgTriggerClassOn && pgTriggerClass ? pgTriggerClass : undefined}
        panelClass={pgPanelClassOn && pgPanelClass ? pgPanelClass : undefined}
        itemRole={demoItemRole}
        {...demoPhoneSheet}
        itemClass={menuItemClass}
        itemLabel={item => item.label}
        itemDisabled={item => item.disabled ?? false} />
      <span class="text-sm text-slate-400">last action: {pgLastAction || '—'}</span>
    </div>
  </ShowcasePage>
