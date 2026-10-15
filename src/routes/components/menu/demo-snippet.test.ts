import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import {
  buildMenuSnippet,
  buildMenuIconMarkup,
  parseMenuIconMarkup,
  parseMenuItemsJson,
  parseMenuItemsValue,
  parseTriggerTooltipJson,
  parseTriggerTooltipValue,
  seedMenuItems,
  type MenuSnippetState,
} from './demo-snippet'

function state(overrides: Partial<MenuSnippetState> = {}): MenuSnippetState {
  return {
    align: '',
    alignOn: true,
    triggerLabel: '',
    triggerLabelOn: true,
    items: seedMenuItems(),
    autoPlace: '',
    autoPlaceOn: true,
    id: '',
    idOn: true,
    triggerTooltip: '',
    triggerTooltipAlign: '',
    triggerTooltipEnabled: true,
    itemRole: '',
    itemRoleOn: true,
    phoneSheetTitle: '',
    phoneSheetTitleOn: true,
    closeLabel: '',
    closeLabelOn: true,
    triggerClass: 'p-2',
    triggerClassOn: true,
    panelClass: 'w-44',
    panelClassOn: true,
    iconClass: '',
    itemPrefix: '',
    ...overrides,
  }
}

describe('buildMenuSnippet', () => {
  it('emits content-only markup and omits unset overrides', () => {
    const source = buildMenuSnippet(state({ triggerClass: '', panelClass: '' }))
    // The resize harness is ShowcasePage-owned chrome, never in the snippet.
    expect(source).not.toContain('<Resizable')
    expect(source).not.toContain('stageWidth')
    expect(source).toContain('let items = $state(')
    expect(source).toContain('"id": "edit"')
    expect(source).toContain('"label": "Edit"')
    expect(source).toContain('"id": "delete"')
    expect(source).toContain('items={items}')
    expect(source).toContain('onSelect={index => (lastAction = items[index].label)}')
    expect(source).toContain('ariaLabel={triggerLabel}')
    expect(source).not.toMatch(/^\s*align=/m)
    expect(source).not.toContain('autoPlace')
    expect(source).not.toContain('triggerClass=')
    expect(source).toContain('{#snippet icon()}')
    expect(source).toContain('<KebabIcon />')
  })

  it('emits align and chrome overrides when set', () => {
    const source = buildMenuSnippet(
      state({
        align: 'left',
        alignOn: true,
        triggerLabel: 'Options',
        autoPlace: 'no',
        id: 'row-actions',
        triggerTooltip: 'More actions',
        triggerTooltipAlign: 'left',
        itemRole: 'menuitemradio',
        itemRoleOn: true,
        phoneSheetTitle: 'Actions',
        closeLabel: 'Close',
      }),
    )
    expect(source).toContain('align="left"')
    expect(source).toContain('ariaLabel="Options"')
    expect(source).toContain('autoPlace={false}')
    expect(source).toContain('id="row-actions"')
    expect(source).toContain('triggerTooltip={{ text: "More actions", align: "left" }}')
    expect(source).toContain('itemRole="menuitemradio"')
    expect(source).toContain('phoneSheetTitle="Actions"')
    expect(source).toContain('closeLabel="Close"')
    expect(source).toContain('triggerClass="p-2"')
    expect(source).toContain('panelClass="w-44"')
    expect(source).toContain('itemClass={menuItemClass}')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildMenuSnippet(state({ align: 'right', alignOn: true, autoPlace: 'yes', itemRole: 'menuitem', itemRoleOn: true }))
    expect(source).not.toMatch(/^\s*align=/m)
    expect(source).not.toContain('autoPlace')
    expect(source).not.toContain('itemRole=')
  })

  it('omits staged flags while their eyes are off', () => {
    const off = buildMenuSnippet(
      state({ autoPlace: 'no', autoPlaceOn: false }),
    )
    expect(off).not.toContain('autoPlace')
  })

  it('falls back to the scope label and omits staged sheet text while their eyes are off', () => {
    const off = buildMenuSnippet(
      state({ triggerLabel: 'Options', triggerLabelOn: false, phoneSheetTitle: 'Actions', phoneSheetTitleOn: false, closeLabel: 'Close', closeLabelOn: false }),
    )
    expect(off).not.toContain('ariaLabel="Options"')
    expect(off).toContain('ariaLabel={triggerLabel}')
    expect(off).not.toContain('phoneSheetTitle=')
    expect(off).not.toContain('closeLabel=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildMenuSnippet(
      state({ align: 'left', alignOn: false, itemRole: 'menuitemradio', itemRoleOn: false }),
    )
    expect(off).not.toMatch(/^\s*align=/m)
    expect(off).not.toContain('itemRole=')
  })

  it('omits staged id and chrome classes while their eye is off and emits them while on', () => {
    const off = buildMenuSnippet(
      state({ id: 'row-actions', idOn: false, triggerClass: 'p-2', triggerClassOn: false, panelClass: 'w-44', panelClassOn: false }),
    )
    expect(off).not.toMatch(/^\s*id=/m)
    expect(off).not.toContain('triggerClass=')
    expect(off).not.toContain('panelClass=')
    const on = buildMenuSnippet(state({ id: 'row-actions' }))
    expect(on).toContain('id="row-actions"')
    expect(on).toContain('triggerClass="p-2"')
    expect(on).toContain('panelClass="w-44"')
  })

  it('omits the tooltip object while its eye toggle is off', () => {
    const source = buildMenuSnippet(
      state({ triggerTooltip: 'More actions', triggerTooltipAlign: 'left', triggerTooltipEnabled: false }),
    )
    expect(source).not.toContain('triggerTooltip=')
  })

  it('emits edited items as script-local JSON', () => {
    const source = buildMenuSnippet(
      state({ items: [{ id: 'rename', label: 'Rename' }, { id: 'remove', label: 'Remove', disabled: true }] }),
    )
    expect(source).toContain('"id": "rename"')
    expect(source).toContain('"label": "Rename"')
    expect(source).toContain('"disabled": true')
  })

  it('emits item labels as valid JSON strings', () => {
    const source = buildMenuSnippet(state({ items: [{ id: 'hi', label: 'Say "hi"' }] }))
    expect(source).toContain('"label": "Say \\"hi\\""')
  })

  it('emits the icon class and item prefix when set', () => {
    const source = buildMenuSnippet(state({ iconClass: 'h-5 w-5', itemPrefix: '#' }))
    expect(source).toContain('<KebabIcon className="h-5 w-5" />')
    expect(source).toContain('<span>#{item.label}</span>')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildMenuSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})

describe('parseMenuItemsJson', () => {
  it('accepts well-shaped lists and rejects the rest', () => {
    expect(parseMenuItemsJson('[{"id":"a","label":"A"},{"id":"b","label":"B","disabled":true}]')).toEqual([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', disabled: true },
    ])
    expect(parseMenuItemsJson('not json')).toBeNull()
    expect(parseMenuItemsJson('{"id":"a"}')).toBeNull()
    expect(parseMenuItemsJson('[{"id":"a"}]')).toBeNull()
    expect(parseMenuItemsJson('[{"id":"a","label":42}]')).toBeNull()
    expect(parseMenuItemsJson('[{"id":"a","label":"A","disabled":"yes"}]')).toBeNull()
  })

  it('validates parsed values', () => {
    expect(parseMenuItemsValue([{ id: 'a', label: 'A' }])).toEqual([{ id: 'a', label: 'A' }])
    expect(parseMenuItemsValue('nope')).toBeNull()
  })
})

describe('parseTriggerTooltipJson', () => {
  it('accepts text with an optional align and rejects the rest', () => {
    expect(parseTriggerTooltipJson('{"text": "More"}')).toEqual({ text: 'More' })
    expect(parseTriggerTooltipJson('{"text": "More", "align": "left"}')).toEqual({ text: 'More', align: 'left' })
    expect(parseTriggerTooltipJson('{"text": ""}')).toEqual({ text: '' })
    expect(parseTriggerTooltipValue({ text: 'More', align: 'banana' })).toBeNull()
    expect(parseTriggerTooltipValue({ text: '', align: 'left' })).toBeNull()
    expect(parseTriggerTooltipValue({ text: 'More', extra: 1 })).toBeNull()
    expect(parseTriggerTooltipJson('not json')).toBeNull()
    expect(parseTriggerTooltipJson('{"align": "left"}')).toBeNull()
  })
})

describe('parseMenuIconMarkup', () => {
  it('round-trips the canonical markup', () => {
    expect(buildMenuIconMarkup('')).toBe('<KebabIcon />')
    expect(buildMenuIconMarkup('h-4 w-4')).toBe('<KebabIcon className="h-4 w-4" />')
    expect(parseMenuIconMarkup(buildMenuIconMarkup('h-5 w-5'))).toBe('h-5 w-5')
    expect(parseMenuIconMarkup('<KebabIcon />')).toBe('')
  })

  it('rejects anything but the canonical shape', () => {
    expect(parseMenuIconMarkup('nope')).toBeNull()
    expect(parseMenuIconMarkup('<KebabIcon className="x" ></KebabIcon>')).toBeNull()
  })
})
