import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { buildTagInputSnippet, parseTagListJson, parseTagListValue, type TagInputSnippetState } from './demo-snippet'

function state(overrides: Partial<TagInputSnippetState> = {}): TagInputSnippetState {
  return {
    value: ['svelte', 'kit'],
    availableTags: ['svelte', 'kit', 'icons'],
    placeholder: '',
    palette: '',
    disabled: '',
    inputId: '',
    chipClass: '',
    ...overrides,
  }
}

describe('buildTagInputSnippet', () => {
  it('seeds the tag lists as script-local state inside the resizable stage', () => {
    const source = buildTagInputSnippet(state())
    expect(source).toContain('<Resizable')
    expect(source).toContain('width={stageWidth}')
    expect(source).not.toContain('stageHeight')
    expect(source).toContain('let value = $state(["svelte","kit"]);')
    expect(source).toContain('const availableTags = ["svelte","kit","icons"];')
    expect(source).toContain('value={value}')
    expect(source).toContain('availableTags={availableTags}')
  })

  it('falls back to the default placeholder and the built-in palette', () => {
    const source = buildTagInputSnippet(state())
    expect(source).toContain('placeholder="Add a tag"')
    expect(source).not.toContain('palette=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('inputId=')
    expect(source).not.toContain('chipClass=')
  })

  it('emits the palette override, the disabled flag, and the passthrough props', () => {
    const source = buildTagInputSnippet(
      state({ placeholder: 'Pick', palette: 'alt', disabled: 'yes', inputId: 'tags', chipClass: 'chip-x' }),
    )
    expect(source).toContain('placeholder="Pick"')
    expect(source).toContain('palette={altPalette}')
    expect(source).toContain('        disabled\n')
    expect(source).toContain('inputId="tags"')
    expect(source).toContain('chipClass="chip-x"')
  })

  it('parses tag-list editor drafts', () => {
    expect(parseTagListJson('["a", "b"]')).toEqual(['a', 'b'])
    expect(parseTagListJson('not json')).toBeNull()
    expect(parseTagListJson('{"a": 1}')).toBeNull()
    expect(parseTagListJson('[42]')).toBeNull()
    expect(parseTagListValue('nope')).toBeNull()
  })

  it('compiles the generated stage snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildTagInputSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
