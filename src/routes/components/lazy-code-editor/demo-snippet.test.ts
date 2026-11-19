import { describe, expect, it } from 'vitest'
import { staged } from '#showcase/playground/staged.js'
import { DEFAULT_CONTENT, buildLazyCodeEditorSnippet, type LazyCodeEditorSnippetState } from './demo-snippet'

// A base state with every value unset; each case overrides only what it
// exercises (the eyes start where the cleared form puts them).
const BASE: LazyCodeEditorSnippetState = {
  docType: staged('', true),
  editable: staged('', true),
  containerClass: staged(''),
  editorClass: staged(''),
  maxContentLength: staged('', true),
  autoFocus: staged(''),
  editorAriaLabel: staged(''),
  recreateKey: staged(''),
  size: staged(''),
}

function state(overrides: Partial<LazyCodeEditorSnippetState> = {}): LazyCodeEditorSnippetState {
  return { ...BASE, ...overrides }
}

describe('buildLazyCodeEditorSnippet', () => {
  it('keeps the markdown baseline and omits the unset flag', () => {
    const source = buildLazyCodeEditorSnippet(state())
    expect(source).toContain('<div class="h-64 w-full max-w-xl">')
    expect(source).toContain('bind:content={content}')
    expect(source).toContain('docType="markdown"')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('containerClass=')
    expect(source).not.toContain('editorClass=')
    expect(source).not.toContain('maxContentLength=')
  })

  it('emits the chosen document type', () => {
    const source = buildLazyCodeEditorSnippet(state({ docType: staged('yaml', true) }))
    expect(source).toContain('docType="yaml"')
    expect(source).not.toContain('docType="markdown"')
  })

  it('omits the component-default flags and caps (the Value column prefills them)', () => {
    const source = buildLazyCodeEditorSnippet(state({ docType: staged('text', true), editable: staged('yes', true), maxContentLength: staged('0', true) }))
    expect(source).not.toContain('docType=')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('containerClass=')
    expect(source).not.toContain('editorClass=')
    expect(source).not.toContain('maxContentLength=')
  })

  it('omits the default editable flag and emits ={false} for no', () => {
    expect(buildLazyCodeEditorSnippet(state({ editable: staged('yes', true) }))).not.toContain('editable')
    expect(buildLazyCodeEditorSnippet(state({ editable: staged('no', true) }))).toContain('editable={false}')
  })

  it('emits the wrapper and editor classes when set', () => {
    const source = buildLazyCodeEditorSnippet(
      state({ containerClass: staged('h-full overflow-hidden', true), editorClass: staged('h-full', true) }),
    )
    expect(source).toContain('containerClass="h-full overflow-hidden"')
    expect(source).toContain('editorClass="h-full"')
  })

  it('emits maxContentLength as a numeric expression and omits non-numeric input', () => {
    const source = buildLazyCodeEditorSnippet(state({ maxContentLength: staged('500', true) }))
    expect(source).toContain('maxContentLength={500}')
    expect(buildLazyCodeEditorSnippet(state({ maxContentLength: staged('long', true) }))).not.toContain('maxContentLength=')
  })

  it('omits staged classes while the eye is off and emits them while on', () => {
    const off = buildLazyCodeEditorSnippet(state({ containerClass: staged('h-full overflow-hidden'), editorClass: staged('h-full') }))
    expect(off).not.toContain('containerClass=')
    expect(off).not.toContain('editorClass=')
    const on = buildLazyCodeEditorSnippet(
      state({ containerClass: staged('h-full overflow-hidden', true), editorClass: staged('h-full', true) }),
    )
    expect(on).toContain('containerClass="h-full overflow-hidden"')
    expect(on).toContain('editorClass="h-full"')
  })

  it('omits the staged docType while its eye is off', () => {
    expect(buildLazyCodeEditorSnippet(state({ docType: staged('yaml') }))).not.toContain('docType=')
  })

  it('omits staged primitive props while their eyes are off and emits them while on', () => {
    const off = buildLazyCodeEditorSnippet(
      state({ editable: staged('no'), maxContentLength: staged('500'), autoFocus: staged('yes'), editorAriaLabel: staged('Code'), recreateKey: staged('v2') }),
    )
    expect(off).not.toContain('editable=')
    expect(off).not.toContain('maxContentLength=')
    expect(off).not.toContain('autoFocus')
    expect(off).not.toContain('editorAriaLabel=')
    expect(off).not.toContain('recreateKey=')
    const on = buildLazyCodeEditorSnippet(
      state({ editable: staged('no', true), maxContentLength: staged('500', true), autoFocus: staged('yes', true), editorAriaLabel: staged('Code', true), recreateKey: staged('v2', true) }),
    )
    expect(on).toContain('editable={false}')
    expect(on).toContain('maxContentLength={500}')
    expect(on).toContain('    autoFocus\n')
    expect(on).toContain('editorAriaLabel="Code"')
    expect(on).toContain('recreateKey="v2"')
  })

  it('emits a named size step and a pixel number', () => {
    expect(buildLazyCodeEditorSnippet(state({ size: staged('lg', true) }))).toContain('size="lg"')
    expect(buildLazyCodeEditorSnippet(state({ size: staged('22', true) }))).toContain('size={22}')
  })

  it('omits the size default and a size while its eye is off', () => {
    expect(buildLazyCodeEditorSnippet(state({ size: staged('md', true) }))).not.toContain('size=')
    expect(buildLazyCodeEditorSnippet(state({ size: staged('lg') }))).not.toContain('size=')
  })
})

describe('DEFAULT_CONTENT', () => {
  it('is a markdown document', () => {
    expect(DEFAULT_CONTENT.startsWith('# ')).toBe(true)
  })
})
