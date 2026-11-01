import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/playground/snippet-playground'
import { staged } from '$showcase/playground/staged'
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
    align: staged('', true),
    triggerLabel: staged('', true),
    items: staged(seedMenuItems(), true),
    autoPlace: staged('', true),
    id: staged('', true),
    triggerTooltip: staged('', true),
    triggerTooltipAlign: '',
    itemRole: staged('', true),
    phoneSheetTitle: staged('', true),
    closeLabel: staged('', true),
    triggerClass: staged(''),
    panelClass: staged('w-44', true),
    size: staged('md'),
    iconClass: staged(''),
    itemPrefix: staged(''),
    ...overrides,
  }
}

describe('buildMenuSnippet', () => {
  it('emits content-only markup and omits unset overrides', () => {
    const source = buildMenuSnippet(state({ triggerClass: staged(''), panelClass: staged('') }))
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
        align: staged('left', true),
        triggerLabel: staged('Options', true),
        autoPlace: staged('no', true),
        id: staged('row-actions', true),
        triggerTooltip: staged('More actions', true),
        triggerTooltipAlign: 'left',
        itemRole: staged('menuitemradio', true),
        phoneSheetTitle: staged('Actions', true),
        closeLabel: staged('Close', true),
        triggerClass: staged('text-cyan-300', true),
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
    expect(source).toContain('triggerClass="text-cyan-300"')
    expect(source).toContain('panelClass="w-44"')
    expect(source).toContain('itemClass={menuItemClass}')
  })

  it('emits the trigger scale on the shared size axis and omits the default step', () => {
    expect(buildMenuSnippet(state({ size: staged('sm', true) }))).toContain('size="sm"')
    // A pixel number renders as an expression.
    expect(buildMenuSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    // The default step and the staged (eye off) value both stay out.
    expect(buildMenuSnippet(state({ size: staged('md', true) }))).not.toContain('size=')
    expect(buildMenuSnippet(state({ size: staged('sm') }))).not.toContain('size=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildMenuSnippet(state({ align: staged('right', true), autoPlace: staged('yes', true), itemRole: staged('menuitem', true) }))
    expect(source).not.toMatch(/^\s*align=/m)
    expect(source).not.toContain('autoPlace')
    expect(source).not.toContain('itemRole=')
  })

  it('omits staged flags while their eyes are off', () => {
    const off = buildMenuSnippet(
      state({ autoPlace: staged('no') }),
    )
    expect(off).not.toContain('autoPlace')
  })

  it('falls back to the scope label and omits staged sheet text while their eyes are off', () => {
    const off = buildMenuSnippet(
      state({ triggerLabel: staged('Options'), phoneSheetTitle: staged('Actions'), closeLabel: staged('Close') }),
    )
    expect(off).not.toContain('ariaLabel="Options"')
    expect(off).toContain('ariaLabel={triggerLabel}')
    expect(off).not.toContain('phoneSheetTitle=')
    expect(off).not.toContain('closeLabel=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildMenuSnippet(
      state({ align: staged('left'), itemRole: staged('menuitemradio') }),
    )
    expect(off).not.toMatch(/^\s*align=/m)
    expect(off).not.toContain('itemRole=')
  })

  it('omits staged id and chrome classes while their eye is off and emits them while on', () => {
    const off = buildMenuSnippet(
      state({ id: staged('row-actions'), triggerClass: staged('text-cyan-300'), panelClass: staged('w-44') }),
    )
    expect(off).not.toMatch(/^\s*id=/m)
    expect(off).not.toContain('triggerClass=')
    expect(off).not.toContain('panelClass=')
    const on = buildMenuSnippet(state({ id: staged('row-actions', true), triggerClass: staged('text-cyan-300', true) }))
    expect(on).toContain('id="row-actions"')
    expect(on).toContain('triggerClass="text-cyan-300"')
    expect(on).toContain('panelClass="w-44"')
  })

  it('omits the tooltip object while its eye toggle is off', () => {
    const source = buildMenuSnippet(
      state({ triggerTooltip: staged('More actions'), triggerTooltipAlign: 'left' }),
    )
    expect(source).not.toContain('triggerTooltip=')
  })

  it('emits edited items as script-local JSON', () => {
    const source = buildMenuSnippet(
      state({ items: staged([{ id: 'rename', label: 'Rename' }, { id: 'remove', label: 'Remove', disabled: true }]) }),
    )
    expect(source).toContain('"id": "rename"')
    expect(source).toContain('"label": "Rename"')
    expect(source).toContain('"disabled": true')
  })

  it('emits item labels as valid JSON strings', () => {
    const source = buildMenuSnippet(state({ items: staged([{ id: 'hi', label: 'Say "hi"' }]) }))
    expect(source).toContain('"label": "Say \\"hi\\""')
  })

  it('emits the icon class and item prefix when set', () => {
    const source = buildMenuSnippet(state({ iconClass: staged('h-5 w-5'), itemPrefix: staged('#') }))
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
