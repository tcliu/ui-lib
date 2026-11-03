// Show-code source for the Menu demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The item list is
// seeded as script-local state so the snippet is self-contained and its text
// tracks Value edits instead of hiding the entries in scope.
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.

import {
  boolAttrLine,
  enumAttrLine,
  escapeAttr,
  escapeText,
  sizeAttrLine,
  textAttrLine,
  unescapeAttr,
  type TriState,
} from '#showcase/playground/snippet-build.js'
import type { Staged } from '#showcase/playground/staged.js'

export const MENU_STAGE_CONTENT = 'flex items-center gap-4'
export const MENU_STAGE_DEFAULT_WIDTH = 560
export const MENU_STAGE_MIN_WIDTH = 240

// Menu entries edited through the items JSON dialog: plain data only (no
// functions). The page derives click behavior from the label.
export interface MenuDemoItem {
  id: string
  label: string
  disabled?: boolean
}

// Fresh seeded entries for playground state and Reset, so no caller ever
// shares a mutable array.
export function seedMenuItems(): MenuDemoItem[] {
  return [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete' },
  ]
}

// Validate unknown data into menu entries: every entry needs a string id and
// label; a missing disabled flag reads as enabled. Returns null for anything
// else, so the dialog and parse-back apply only well-shaped lists.
export function parseMenuItemsValue(value: unknown): MenuDemoItem[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const out: MenuDemoItem[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      return null
    }
    const { id, label, disabled } = entry as { id?: unknown; label?: unknown; disabled?: unknown }
    if (typeof id !== 'string' || typeof label !== 'string') {
      return null
    }
    if (disabled !== undefined && typeof disabled !== 'boolean') {
      return null
    }
    out.push(disabled === undefined ? { id, label } : { id, label, disabled })
  }
  return out
}

// Parse the items editor draft (a JSON array of `{ id, label, disabled? }`
// objects). Returns null for anything else, so the dialog can block OK and
// explain instead of applying half-shaped data.
export function parseMenuItemsJson(text: string): MenuDemoItem[] | null {
  try {
    return parseMenuItemsValue(JSON.parse(text))
  } catch {
    return null
  }
}

export interface MenuSnippetState {
  align: Staged<string>
  triggerLabel: Staged<string>
  items: Staged<MenuDemoItem[]>
  autoPlace: Staged<TriState>
  id: Staged<string>
  // The tooltip object applies only while its eye toggle is on, mirroring the
  // page (off omits the object prop).
  triggerTooltip: Staged<string>
  triggerTooltipAlign: string
  itemRole: Staged<string>
  phoneSheetTitle: Staged<string>
  closeLabel: Staged<string>
  triggerClass: Staged<string>
  panelClass: Staged<string>
  size: Staged<string>
  iconClass: Staged<string>
  itemPrefix: Staged<string>
}

// Canonical icon markup: the kebab glyph in a caller class; the class is the
// editable facet. Empty reads as the bare glyph (the icon default size).
export function buildMenuIconMarkup(className: string): string {
  return `<KebabIcon${className ? ` className="${escapeAttr(className)}"` : ''} />`
}

// Parse an icon draft back to its class (bare glyph reads as unset).
// Null unless it is exactly the canonical shape, so the dialog blocks OK
// instead of applying markup the row cannot reproduce.
export function parseMenuIconMarkup(draft: string): string | null {
  const trimmed = draft.trim()
  if (trimmed === '<KebabIcon />') {
    return ''
  }
  const match = trimmed.match(/^<KebabIcon className="([^"]*)" \/>$/)
  if (!match) {
    return null
  }
  return unescapeAttr(match[1] ?? '')
}

// Element text for the item prefix below.

// The tooltip align choices the trigger tooltip accepts.
export const TOOLTIP_ALIGNS = ['center', 'left', 'right'] as const

// Validate unknown data into a trigger tooltip: a text plus an optional
// align. An empty text with no align is the unset shape (the builder omits
// the line); anything else with an empty text, an unknown align, or extra
// keys returns null, so the dialog commits only shapes the demo reproduces
// exactly.
export function parseTriggerTooltipValue(value: unknown): { text: string; align?: string } | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const { text, align, ...rest } = value as Record<string, unknown>
  if (Object.keys(rest).length > 0 || typeof text !== 'string') {
    return null
  }
  if (align !== undefined && (typeof align !== 'string' || !(TOOLTIP_ALIGNS as readonly string[]).includes(align))) {
    return null
  }
  if (text === '') {
    return align === undefined ? { text: '' } : null
  }
  return align === undefined ? { text } : { text, align }
}

// Parse a trigger-tooltip editor draft (a JSON `{ text, align? }` object).
// Returns null for anything else, so the dialog can block OK and explain
// instead of applying half-shaped data.
export function parseTriggerTooltipJson(text: string): { text: string; align?: string } | null {
  try {
    return parseTriggerTooltipValue(JSON.parse(text))
  } catch {
    return null
  }
}

// The object-valued trigger tooltip: omitted while its eye is off or its text
// is unset; align folds in as an optional key.
function tooltipLine(pair: Staged<string>, align: string, indent: string): string[] {
  if (!pair.on || !pair.value) return []
  const alignPart = align ? `, align: "${escapeAttr(align)}"` : ''
  return [`${indent}triggerTooltip={{ text: "${escapeAttr(pair.value)}"${alignPart} }}`]
}

export function buildMenuSnippet({
  align,
  triggerLabel,
  items,
  autoPlace,
  id,
  triggerTooltip,
  triggerTooltipAlign,
  itemRole,
  phoneSheetTitle,
  closeLabel,
  triggerClass,
  panelClass,
  size,
  iconClass,
  itemPrefix,
}: MenuSnippetState): string {
  // The frame is shell chrome, so the demo content sits at the snippet root
  // with its attributes one step in; the item list is script-local state.
  const indent = '  '
  // Pretty JSON reindented under the state line, so the seeded list stays
  // readable and editable in place.
  const itemsJson = JSON.stringify(items.value, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join('\n')
  return [
    '<script>',
    `  let items = $state(${itemsJson});`,
    '</script>',
    `<div class="${MENU_STAGE_CONTENT}">`,
    '<Menu',
    `${indent}items={items}`,
    `${indent}itemKey={item => item.id}`,
    `${indent}onSelect={index => (lastAction = items[index].label)}`,
    ...(triggerLabel.on && triggerLabel.value
      ? [`${indent}ariaLabel="${escapeAttr(triggerLabel.value)}"`]
      : [`${indent}ariaLabel={triggerLabel}`]),
    // Enum rows prefill their component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...enumAttrLine('align', align, 'right', indent),
    ...boolAttrLine('autoPlace', autoPlace, 'yes', indent),
    ...textAttrLine('id', id, indent),
    ...tooltipLine(triggerTooltip, triggerTooltipAlign, indent),
    ...textAttrLine('triggerClass', triggerClass, indent),
    ...textAttrLine('panelClass', panelClass, indent),
    // The trigger's scale rides the shared size axis; the default step is
    // omitted so Show-code stays minimal.
    ...sizeAttrLine(size, indent),
    ...enumAttrLine('itemRole', itemRole, 'menuitem', indent),
    ...textAttrLine('phoneSheetTitle', phoneSheetTitle, indent),
    ...textAttrLine('closeLabel', closeLabel, indent),
    `${indent}itemClass={menuItemClass}`,
    `${indent}itemLabel={item => item.label}`,
    `${indent}itemDisabled={item => item.disabled ?? false}>`,
    `${indent}{#snippet icon()}`,
    `${indent}  ${buildMenuIconMarkup(iconClass.value)}`,
    `${indent}{/snippet}`,
    `${indent}{#snippet item(item)}`,
    `${indent}  <span>${escapeText(itemPrefix.value)}{item.label}</span>`,
    `${indent}{/snippet}`,
    '</Menu>',
    `<span class="text-sm text-slate-400">last action: {lastAction || '—'}</span>`,
    '</div>',
  ].join('\n')
}
