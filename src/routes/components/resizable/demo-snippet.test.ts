import { describe, expect, it } from 'vitest'
import { RESIZABLE_CONTENT, RESIZABLE_SCROLLPORT, buildResizableSnippet, parseBound } from './demo-snippet'

const unset = { minWidth: '', minHeight: '', maxWidth: '', maxHeight: '' }

describe('parseBound', () => {
  it('treats empty and non-numeric text as unset', () => {
    expect(parseBound('')).toBeNull()
    expect(parseBound('   ')).toBeNull()
    expect(parseBound('wide')).toBeNull()
    expect(parseBound('-40')).toBeNull()
  })

  it('parses non-negative numbers', () => {
    expect(parseBound('0')).toBe(0)
    expect(parseBound('240')).toBe(240)
  })
})

describe('buildResizableSnippet', () => {
  it('seeds local size state so the live container is resizable', () => {
    const source = buildResizableSnippet(unset)
    expect(source).toContain('  let width = $state(initialWidth)')
    expect(source).toContain('  let height = $state(initialHeight)')
    expect(source).toContain('width={width}')
    expect(source).toContain('height={height}')
    expect(source).toContain('onResize={(nextWidth, nextHeight) => { width = nextWidth; height = nextHeight; }}')
  })

  it('omits every bound while unset', () => {
    const source = buildResizableSnippet(unset)
    expect(source).not.toContain('minWidth=')
    expect(source).not.toContain('minHeight=')
    expect(source).not.toContain('maxWidth=')
    expect(source).not.toContain('maxHeight=')
  })

  it('emits the bounds that are set', () => {
    const source = buildResizableSnippet({ minWidth: '120', minHeight: '80', maxWidth: '640', maxHeight: '480' })
    expect(source).toContain('minWidth={120}')
    expect(source).toContain('minHeight={80}')
    expect(source).toContain('maxWidth={640}')
    expect(source).toContain('maxHeight={480}')
  })

  it('renders the content from scope inside the scrollport', () => {
    const source = buildResizableSnippet(unset)
    // The non-interactive scroll wrapper stays out of the tab order.
    expect(source).toContain(`<div class="${RESIZABLE_SCROLLPORT}" tabindex="-1">`)
    expect(source).toContain(`<div class="${RESIZABLE_CONTENT}">{contentLabel}</div>`)
  })
})
