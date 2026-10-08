import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildMenuSnippet, type MenuSnippetState } from './demo-snippet'

function state(overrides: Partial<MenuSnippetState> = {}): MenuSnippetState {
  return {
    align: '',
    triggerLabel: '',
    firstLabel: '',
    secondLabel: '',
    autoPlace: '',
    triggerClass: 'p-2',
    panelClass: 'w-44',
    ...overrides,
  }
}

describe('buildMenuSnippet', () => {
  it('uses scoped labels and omits unset overrides', () => {
    const source = buildMenuSnippet(state({ triggerClass: '', panelClass: '' }))
    expect(source).toContain('<Resizable')
    expect(source).toContain('width={stageWidth}')
    expect(source).not.toContain('stageHeight')
    expect(source).toContain('label: editLabel')
    expect(source).toContain('label: deleteLabel')
    expect(source).toContain('ariaLabel={triggerLabel}')
    expect(source).not.toMatch(/^\s*align=/m)
    expect(source).not.toContain('autoPlace')
    expect(source).not.toContain('triggerClass=')
    expect(source).toContain('{#snippet icon()}')
    expect(source).toContain('<KebabIcon className="h-4 w-4" />')
  })

  it('emits align, labels, and chrome overrides when set', () => {
    const source = buildMenuSnippet(
      state({
        align: 'left',
        triggerLabel: 'Options',
        firstLabel: 'Rename',
        secondLabel: 'Remove',
        autoPlace: 'no',
      }),
    )
    expect(source).toContain('align="left"')
    expect(source).toContain('ariaLabel="Options"')
    expect(source).toContain('label: "Rename"')
    expect(source).toContain('label: "Remove"')
    expect(source).toContain('autoPlace={false}')
    expect(source).toContain('triggerClass="p-2"')
    expect(source).toContain('panelClass="w-44"')
    expect(source).toContain('itemClass={menuItemClass}')
  })

  it('emits script labels as valid JS strings', () => {
    const source = buildMenuSnippet(state({ firstLabel: 'Say "hi"' }))
    expect(source).toContain('label: "Say \\"hi\\""')
  })

  it('compiles the generated stage snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildMenuSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
