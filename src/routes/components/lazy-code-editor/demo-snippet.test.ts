import { describe, expect, it } from 'vitest'
import { staged } from '#showcase/playground/staged.js'
import { DEFAULT_CONTENT, buildLazyCodeEditorSnippet } from './demo-snippet'

describe('buildLazyCodeEditorSnippet', () => {
  it('keeps the markdown baseline and omits the unset flag', () => {
    const source = buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('', true), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })
    expect(source).toContain('<div class="h-64 w-full max-w-xl">')
    expect(source).toContain('bind:content={content}')
    expect(source).toContain('docType="markdown"')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('containerClass=')
    expect(source).not.toContain('editorClass=')
    expect(source).not.toContain('maxContentLength=')
  })

  it('emits the chosen document type', () => {
    const source = buildLazyCodeEditorSnippet({ docType: staged('yaml', true), editable: staged('', true), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })
    expect(source).toContain('docType="yaml"')
    expect(source).not.toContain('docType="markdown"')
  })

  it('omits the component-default flags and caps (the Value column prefills them)', () => {
    const source = buildLazyCodeEditorSnippet({ docType: staged('text', true), editable: staged('yes', true), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('0', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })
    expect(source).not.toContain('docType=')
    expect(source).not.toContain('editable')
    expect(source).not.toContain('containerClass=')
    expect(source).not.toContain('editorClass=')
    expect(source).not.toContain('maxContentLength=')
  })

  it('omits the default editable flag and emits ={false} for no', () => {
    expect(buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('yes', true), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })).not.toContain('editable')
    expect(buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('no', true), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })).toContain('editable={false}')
  })

  it('emits the wrapper and editor classes when set', () => {
    const source = buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('', true), containerClass: staged('h-full overflow-hidden', true), editorClass: staged('h-full', true), maxContentLength: staged('', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })
    expect(source).toContain('containerClass="h-full overflow-hidden"')
    expect(source).toContain('editorClass="h-full"')
  })

  it('emits maxContentLength as a numeric expression and omits non-numeric input', () => {
    const source = buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('', true), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('500', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })
    expect(source).toContain('maxContentLength={500}')
    expect(buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('', true), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('long', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })).not.toContain('maxContentLength=')
  })

  it('omits staged classes while the eye is off and emits them while on', () => {
    const off = buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('', true), containerClass: staged('h-full overflow-hidden'), editorClass: staged('h-full'), maxContentLength: staged('', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })
    expect(off).not.toContain('containerClass=')
    expect(off).not.toContain('editorClass=')
    const on = buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('', true), containerClass: staged('h-full overflow-hidden', true), editorClass: staged('h-full', true), maxContentLength: staged('', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })
    expect(on).toContain('containerClass="h-full overflow-hidden"')
    expect(on).toContain('editorClass="h-full"')
  })

  it('omits the staged docType while its eye is off', () => {
    const off = buildLazyCodeEditorSnippet({ docType: staged('yaml'), editable: staged('', true), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('', true), autoFocus: staged(''), editorAriaLabel: staged(''), recreateKey: staged('') })
    expect(off).not.toContain('docType=')
  })

  it('omits staged primitive props while their eyes are off and emits them while on', () => {
    const off = buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('no'), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('500'), autoFocus: staged('yes'), editorAriaLabel: staged('Code'), recreateKey: staged('v2') })
    expect(off).not.toContain('editable=')
    expect(off).not.toContain('maxContentLength=')
    expect(off).not.toContain('autoFocus')
    expect(off).not.toContain('editorAriaLabel=')
    expect(off).not.toContain('recreateKey=')
    const on = buildLazyCodeEditorSnippet({ docType: staged('', true), editable: staged('no', true), containerClass: staged(''), editorClass: staged(''), maxContentLength: staged('500', true), autoFocus: staged('yes', true), editorAriaLabel: staged('Code', true), recreateKey: staged('v2', true) })
    expect(on).toContain('editable={false}')
    expect(on).toContain('maxContentLength={500}')
    expect(on).toContain('    autoFocus\n')
    expect(on).toContain('editorAriaLabel="Code"')
    expect(on).toContain('recreateKey="v2"')
  })
})

describe('DEFAULT_CONTENT', () => {
  it('is a markdown document', () => {
    expect(DEFAULT_CONTENT.startsWith('# ')).toBe(true)
  })
})
