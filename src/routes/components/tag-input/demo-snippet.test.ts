import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$showcase/snippet-playground'
import { staged } from '$showcase/staged'
import { buildTagInputSnippet, parseTagListJson, parseTagListValue, type TagInputSnippetState } from './demo-snippet'

function state(overrides: Partial<TagInputSnippetState> = {}): TagInputSnippetState {
  return {
    value: staged(['svelte', 'kit'], true),
    options: staged(['svelte', 'kit', 'icons'], true),
    defaultValue: staged([]),
    clearable: staged('', true),
    clearLabel: staged('', true),
    clearPlacement: staged('', true),
    placeholder: staged('', true),
    size: staged('', true),
    palette: staged('', true),
    disabled: staged('', true),
    id: staged('', true),
    chipClass: staged('', true),
    chip: staged(''),
    option: staged(''),
    ...overrides,
  }
}

describe('buildTagInputSnippet', () => {
  it('emits content-only markup and omits unset overrides', () => {
    const source = buildTagInputSnippet(state())
    // The resize harness is ShowcasePage-owned chrome, never in the snippet.
    expect(source).not.toContain('<Resizable')
    expect(source).not.toContain('stageWidth')
    expect(source).toContain('let value = $state(["svelte","kit"]);')
    expect(source).toContain('const options = ["svelte","kit","icons"];')
    expect(source).toContain('value={value}')
    expect(source).toContain('options={options}')
  })

  it('omits the placeholder and the built-in palette while unset', () => {
    const source = buildTagInputSnippet(state())
    expect(source).not.toContain('placeholder=')
    expect(source).not.toContain('palette=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('id=')
    expect(source).not.toContain('chipClass=')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearLabel=')
    expect(source).not.toContain('defaultValue')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildTagInputSnippet(
      state({ size: staged('lg'), palette: staged('alt'), clearPlacement: staged('inside') }),
    )
    expect(off).not.toMatch(/^\s*size=/m)
    expect(off).not.toContain('palette=')
    expect(off).not.toContain('clearPlacement=')
  })

  it('omits eye-gated overrides while their toggle is off and emits them while on', () => {
    const off = buildTagInputSnippet(state({ placeholder: staged('Pick'), defaultValue: staged(['svelte']), clearLabel: staged('Clear it') }))
    expect(off).not.toContain('placeholder=')
    expect(off).not.toContain('defaultValue')
    expect(off).not.toContain('clearLabel=')
    const on = buildTagInputSnippet(state({ placeholder: staged('Pick', true), defaultValue: staged(['svelte'], true), clearLabel: staged('Clear it', true) }))
    expect(on).toContain('placeholder="Pick"')
    expect(on).toContain('let defaultValue = $state(["svelte"]);')
    expect(on).toContain('defaultValue={defaultValue}')
    expect(on).toContain('clearLabel="Clear it"')
  })
  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildTagInputSnippet(state({ size: staged('md', true), disabled: staged('no', true), clearable: staged('no', true), clearPlacement: staged('auto', true) }))
    expect(source).not.toMatch(/^\s*size=/m)
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('clearable')
    expect(source).not.toContain('clearPlacement=')
  })

  it('emits the palette override, the disabled flag, and the passthrough props', () => {
    const source = buildTagInputSnippet(
      state({ placeholder: staged('Pick', true), palette: staged('alt', true), disabled: staged('yes', true), id: staged('tags', true), chipClass: staged('chip-x', true) }),
    )
    expect(source).toContain('placeholder="Pick"')
    expect(source).toContain('palette={altPalette}')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('id="tags"')
    expect(source).toContain('chipClass="chip-x"')
  })

  it('emits a named size as a string and omits it while unset', () => {
    expect(buildTagInputSnippet(state({ size: staged('lg', true) }))).toContain('size="lg"')
    expect(buildTagInputSnippet(state())).not.toMatch(/^\s*size=/m)
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildTagInputSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildTagInputSnippet(state({ size: staged('huge', true) }))).not.toMatch(/^\s*size=/m)
  })

  it('omits the chip and option renderers while unset and emits them when set', () => {
    const unset = buildTagInputSnippet(state())
    expect(unset).not.toContain('chip={chip}')
    expect(unset).not.toContain('option={option}')
    expect(unset).not.toContain('{#snippet chip(')
    expect(unset).toContain('onChange={next => (value = next)} />')
    const set = buildTagInputSnippet(state({ chip: staged('#', true), option: staged('»', true) }))
    expect(set).toContain('chip={chip}')
    expect(set).toContain('option={option}')
    expect(set).toContain('{#snippet chip(tag, remove)}')
    expect(set).toContain(
      '<span>#{tag} <button type="button" onclick={remove} aria-label="Remove {tag}">×</button></span>',
    )
    expect(set).toContain('{#snippet option(tag)}')
    expect(set).toContain('<span>»{tag}</span>')
    expect(set).toContain('</TagInput>')
  })

  it('emits the clearable flag while set', () => {
    expect(buildTagInputSnippet(state())).not.toContain('clearable')
    const source = buildTagInputSnippet(state({ clearable: staged('yes', true), clearLabel: staged('Clear it', true), clearPlacement: staged('inside', true) }))
    expect(source).toContain('  clearable\n')
    expect(source).toContain('clearLabel="Clear it"')
    expect(source).toContain('clearPlacement="inside"')
  })

  it('omits staged flag props while their eyes are off', () => {
    const off = buildTagInputSnippet(state({ disabled: staged('yes'), clearable: staged('yes') }))
    expect(off).not.toContain('disabled')
    expect(off).not.toContain('clearable')
  })

  it('omits the tag lists while their eye toggle is off', () => {
    const source = buildTagInputSnippet(state({ value: staged(['svelte', 'kit']), options: staged(['svelte', 'kit', 'icons']) }))
    expect(source).not.toContain('let value')
    expect(source).not.toContain('value={value}')
    expect(source).not.toContain('const options')
    expect(source).not.toContain('options={options}')
    expect(source).not.toContain('onChange=')
    expect(source).not.toContain('tags:')
    expect(source).toContain('<TagInput')
  })

  it('escapes renderer prefix text', () => {
    expect(buildTagInputSnippet(state({ chip: staged('a & <b>', true) }))).toContain('<span>a &amp; &lt;b&gt;{tag}')
  })

  it('parses tag-list editor drafts', () => {
    expect(parseTagListJson('["a", "b"]')).toEqual(['a', 'b'])
    expect(parseTagListJson('not json')).toBeNull()
    expect(parseTagListJson('{"a": 1}')).toBeNull()
    expect(parseTagListJson('[42]')).toBeNull()
    expect(parseTagListValue('nope')).toBeNull()
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildTagInputSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
