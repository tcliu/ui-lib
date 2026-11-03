import { describe, expect, it } from 'vitest'
import { staged } from '#showcase/playground/staged.js'
import { DEFAULT_CONTENT, buildCodeEditorSnippet, type CodeEditorSnippetState } from './demo-snippet'

// A base state with every value unset; each case overrides only what it
// exercises (the eyes start where the cleared form puts them).
const BASE: CodeEditorSnippetState = {
  docType: staged('', true),
  editable: staged('', true),
  theme: staged('', true),
  containerClass: staged(''),
  editorClass: staged(''),
  maxContentLength: staged('', true),
  selectionEnabled: staged('', true),
  autoFocus: staged(''),
  editorAriaLabel: staged(''),
  recreateKey: staged(''),
}

function state(overrides: Partial<CodeEditorSnippetState> = {}): CodeEditorSnippetState {
  return { ...BASE, ...overrides }
}

describe('buildCodeEditorSnippet', () => {
  it('keeps the json baseline and omits unset flags', () => {
    const source = buildCodeEditorSnippet(state())
    expect(source).toContain('<div class="h-64 w-full max-w-xl">')
    expect(source).toContain('bind:content={content}')
    expect(source).toContain('docType="json"')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('theme=')
    expect(source).not.toContain('containerClass=')
    expect(source).not.toContain('editorClass=')
    expect(source).not.toContain('maxContentLength=')
    expect(source).not.toContain('selectionEnabled')
  })

  it('emits the chosen document type', () => {
    const source = buildCodeEditorSnippet(state({ docType: staged('markdown', true) }))
    expect(source).toContain('docType="markdown"')
    expect(source).not.toContain('docType="json"')
  })

  it('omits the component-default flags and caps (the Value column prefills them)', () => {
    const on = buildCodeEditorSnippet(state({ docType: staged('text', true), editable: staged('yes', true), theme: staged('dark', true), containerClass: staged('h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950'), editorClass: staged('h-full'), maxContentLength: staged('0', true), selectionEnabled: staged('yes', true) }))
    expect(on).not.toContain('docType=')
    expect(on).not.toContain('editable')
    expect(on).not.toContain('theme=')
    expect(on).not.toContain('containerClass=')
    expect(on).not.toContain('editorClass=')
    expect(on).not.toContain('maxContentLength=')
    expect(on).not.toContain('selectionEnabled')
  })

  it('omits the default editable flag and emits ={false} for no', () => {
    expect(buildCodeEditorSnippet(state({ editable: staged('yes', true) }))).not.toContain('editable')
    expect(buildCodeEditorSnippet(state({ editable: staged('no', true) }))).toContain('editable={false}')
  })

  it('emits the chosen theme', () => {
    const source = buildCodeEditorSnippet(state({ theme: staged('light', true) }))
    expect(source).toContain('theme="light"')
  })

  it('emits the wrapper and editor classes when set', () => {
    const source = buildCodeEditorSnippet(state({ containerClass: staged('h-full overflow-hidden', true), editorClass: staged('h-full', true) }))
    expect(source).toContain('containerClass="h-full overflow-hidden"')
    expect(source).toContain('editorClass="h-full"')
  })

  it('emits maxContentLength as a numeric expression and omits non-numeric input', () => {
    const source = buildCodeEditorSnippet(state({ maxContentLength: staged('500', true) }))
    expect(source).toContain('maxContentLength={500}')
    expect(buildCodeEditorSnippet(state({ maxContentLength: staged('long', true) }))).not.toContain('maxContentLength=')
  })

  it('omits the default selectionEnabled flag and emits ={false} for no', () => {
    expect(buildCodeEditorSnippet(state({ selectionEnabled: staged('yes', true) }))).not.toContain('selectionEnabled')
    expect(buildCodeEditorSnippet(state({ selectionEnabled: staged('no', true) }))).toContain('selectionEnabled={false}')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildCodeEditorSnippet(state({ docType: staged('markdown'), theme: staged('light') }))
    expect(off).not.toContain('docType=')
    expect(off).not.toContain('theme=')
  })

  it('omits staged primitive props while their eyes are off and emits them while on', () => {
    const off = buildCodeEditorSnippet(state({ editable: staged('no'), maxContentLength: staged('500'), selectionEnabled: staged('no'), autoFocus: staged('yes'), editorAriaLabel: staged('Code'), recreateKey: staged('v2') }))
    expect(off).not.toContain('editable=')
    expect(off).not.toContain('maxContentLength=')
    expect(off).not.toContain('selectionEnabled=')
    expect(off).not.toContain('autoFocus')
    expect(off).not.toContain('editorAriaLabel=')
    expect(off).not.toContain('recreateKey=')
    const on = buildCodeEditorSnippet(state({ editable: staged('no', true), maxContentLength: staged('500', true), selectionEnabled: staged('no', true), autoFocus: staged('yes', true), editorAriaLabel: staged('Code', true), recreateKey: staged('v2', true) }))
    expect(on).toContain('editable={false}')
    expect(on).toContain('maxContentLength={500}')
    expect(on).toContain('selectionEnabled={false}')
    expect(on).toContain('    autoFocus\n')
    expect(on).toContain('editorAriaLabel="Code"')
    expect(on).toContain('recreateKey="v2"')
  })

  it('omits staged classes while the eye is off and emits them while on', () => {
    const off = buildCodeEditorSnippet(state({ containerClass: staged('h-full overflow-hidden'), editorClass: staged('h-full') }))
    expect(off).not.toContain('containerClass=')
    expect(off).not.toContain('editorClass=')
    const on = buildCodeEditorSnippet(state({ containerClass: staged('h-full overflow-hidden', true), editorClass: staged('h-full', true) }))
    expect(on).toContain('containerClass="h-full overflow-hidden"')
    expect(on).toContain('editorClass="h-full"')
  })
})

describe('DEFAULT_CONTENT', () => {
  it('is a valid JSON document', () => {
    const parsed = JSON.parse(DEFAULT_CONTENT) as { name?: string }
    expect(parsed.name).toBe('ui-lib')
  })
})
