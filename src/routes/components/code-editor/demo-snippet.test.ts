import { describe, expect, it } from 'vitest'
import { DEFAULT_CONTENT, buildCodeEditorSnippet } from './demo-snippet'

describe('buildCodeEditorSnippet', () => {
  it('keeps the json baseline and omits unset flags', () => {
    const source = buildCodeEditorSnippet({ docType: '', editable: '', theme: '' })
    expect(source).toContain('<div class="h-64 w-full max-w-xl">')
    expect(source).toContain('bind:content={content}')
    expect(source).toContain('docType="json"')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('theme=')
  })

  it('emits the chosen document type', () => {
    const source = buildCodeEditorSnippet({ docType: 'markdown', editable: '', theme: '' })
    expect(source).toContain('docType="markdown"')
    expect(source).not.toContain('docType="json"')
  })

  it('emits a bare editable flag and ={false} for no', () => {
    const on = buildCodeEditorSnippet({ docType: '', editable: 'yes', theme: '' })
    const off = buildCodeEditorSnippet({ docType: '', editable: 'no', theme: '' })
    expect(on).toContain('\n    editable\n')
    expect(off).toContain('editable={false}')
  })

  it('emits the chosen theme', () => {
    const source = buildCodeEditorSnippet({ docType: '', editable: '', theme: 'light' })
    expect(source).toContain('theme="light"')
  })

  it('keeps the bounded wrapper and editor classes', () => {
    const source = buildCodeEditorSnippet({ docType: '', editable: '', theme: '' })
    expect(source).toContain('containerClass="h-full overflow-hidden rounded-md border border-slate-700 bg-slate-950"')
    expect(source).toContain('editorClass="h-full"')
  })
})

describe('DEFAULT_CONTENT', () => {
  it('is a valid JSON document', () => {
    const parsed = JSON.parse(DEFAULT_CONTENT) as { name?: string }
    expect(parsed.name).toBe('ui-lib')
  })
})
