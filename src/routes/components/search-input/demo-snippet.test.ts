import { describe, expect, it } from 'vitest'
import { STYLED_INPUT, STYLED_WRAPPER, buildSearchInputSnippet } from './demo-snippet'

describe('buildSearchInputSnippet', () => {
  it('omits placeholder, size, and classes while unset', () => {
    const source = buildSearchInputSnippet({ placeholder: '', size: '', wrapperClass: '', inputClass: '' })
    expect(source).toContain('onkeydown={handleKeydown}')
    expect(source).not.toContain('placeholder=')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('wrapperClass=')
    expect(source).not.toContain('inputClass=')
  })

  it('emits placeholder, size, and styled classes when set', () => {
    const source = buildSearchInputSnippet({
      placeholder: 'Filter sessions',
      size: 'md',
      wrapperClass: STYLED_WRAPPER,
      inputClass: STYLED_INPUT,
    })
    expect(source).toContain('placeholder="Filter sessions"')
    expect(source).toContain('size="md"')
    expect(source).toContain('wrapperClass="rounded-lg border border-cyan-500/40 p-2"')
    expect(source).toContain('inputClass="w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 pl-7 text-sm text-cyan-200 outline-none focus-visible:border-cyan-500"')
  })
})
