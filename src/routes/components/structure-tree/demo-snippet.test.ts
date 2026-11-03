import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '#showcase/playground/snippet-playground.js'
import { staged } from '#showcase/playground/staged.js'
import {
  buildStructureTreeSnippet,
  DEFAULT_TREE_VALUE,
  parseTreeValueJson,
  readTreeValueSeed,
  type StructureTreeSnippetState,
} from './demo-snippet'

function state(overrides: Partial<StructureTreeSnippetState> = {}): StructureTreeSnippetState {
  return {
    value: staged(DEFAULT_TREE_VALUE, true),
    editable: staged('', true),
    containerRowClass: staged(''),
    leafRowClass: staged(''),
    size: staged('md'),
    ...overrides,
  }
}

describe('buildStructureTreeSnippet', () => {
  it('seeds the tree value as script-local state with live edit handlers', () => {
    const source = buildStructureTreeSnippet(state())
    expect(source).toContain('import { isContainer, renameKeyAtPath, setAtPath } from "ui/structure-value.ts";')
    expect(source).toContain(`let value = $state(${JSON.stringify(DEFAULT_TREE_VALUE)});`)
    expect(source).toContain('value={value}')
    expect(source).toContain('onChange={(path, next)')
    expect(source).toContain('onRenameKey={(parentPath, oldKey, newKey)')
  })

  it('omits the editable flag while unset', () => {
    const source = buildStructureTreeSnippet(state())
    expect(source).not.toMatch(/^\s*editable/m)
  })

  it('emits the editable flag false while No and omits it at the default', () => {
    expect(buildStructureTreeSnippet(state({ editable: staged('no', true) }))).toContain('editable={false}')
    expect(buildStructureTreeSnippet(state({ editable: staged('yes', true) }))).not.toMatch(/^\s*editable/m)
  })

  it('omits the staged editable flag while its eye is off', () => {
    expect(buildStructureTreeSnippet(state({ editable: staged('no') }))).not.toMatch(/^\s*editable/m)
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildStructureTreeSnippet(state({ editable: staged('yes', true) }))
    expect(source).not.toMatch(/^\s*editable/m)
  })

  it('omits the row classes while the eyes are off', () => {
    const source = buildStructureTreeSnippet(state())
    expect(source).not.toContain('containerRowClass=')
    expect(source).not.toContain('leafRowClass=')
  })

  it('emits the applied row classes and escapes them', () => {
    const source = buildStructureTreeSnippet(
      state({
        containerRowClass: staged('group flex gap-4', true),
        leafRowClass: staged('group flex gap-"3"&', true),
      }),
    )
    expect(source).toContain('  containerRowClass="group flex gap-4"')
    expect(source).toContain('  leafRowClass="group flex gap-&quot;3&quot;&amp;"')
  })

  it('emits a non-default size and omits the md default', () => {
    expect(buildStructureTreeSnippet(state({ size: staged('lg', true) }))).toContain('  size="lg"')
    expect(buildStructureTreeSnippet(state({ size: staged('md', true) }))).not.toMatch(/^\s*size=/m)
    expect(buildStructureTreeSnippet(state({ size: staged('lg') }))).not.toMatch(/^\s*size=/m)
  })

  it('parses any JSON document as a tree value', () => {
    expect(parseTreeValueJson('{"a": 1}')).toEqual({ a: 1 })
    expect(parseTreeValueJson('[1, 2]')).toEqual([1, 2])
    expect(parseTreeValueJson('42')).toBe(42)
    expect(parseTreeValueJson('not json')).toBeUndefined()
  })

  it('reads the object seed back for the Value column', () => {
    const seed = `let value = $state(${JSON.stringify(DEFAULT_TREE_VALUE)});`
    expect(readTreeValueSeed(seed)).toBe(JSON.stringify(DEFAULT_TREE_VALUE))
    expect(readTreeValueSeed('let value = $state([1, 2]);')).toBeNull()
    expect(readTreeValueSeed('let other = $state({});')).toBeNull()
    expect(readTreeValueSeed('let value = $state({oops);')).toBeNull()
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildStructureTreeSnippet(state()), {})
    expect(typeof component).toBe('function')
  })
})
