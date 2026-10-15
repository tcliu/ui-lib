import { describe, expect, it } from 'vitest'
import {
  RESIZABLE_CONTENT,
  RESIZABLE_SCROLLPORT,
  buildResizableChildrenMarkup,
  buildResizableSnippet,
  parseBound,
  parseMaxBound,
  parseResizableChildrenMarkup,
} from './demo-snippet'

const unset = { minWidth: '', minWidthOn: true, minHeight: '', minHeightOn: true, maxWidth: '', maxWidthOn: true, maxHeight: '', maxHeightOn: true, contentClass: '', className: '', classNameOn: true }

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

describe('parseMaxBound', () => {
  it('treats empty and non-numeric text as unset', () => {
    expect(parseMaxBound('')).toBeNull()
    expect(parseMaxBound('wide')).toBeNull()
    expect(parseMaxBound('-40')).toBeNull()
  })

  it('parses the parent keyword and non-negative numbers', () => {
    expect(parseMaxBound('parent')).toBe('parent')
    expect(parseMaxBound('240')).toBe(240)
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

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildResizableSnippet({ ...unset, minWidth: '0', minHeight: '0' })
    expect(source).not.toContain('minWidth=')
    expect(source).not.toContain('minHeight=')
  })

  it('emits the bounds that are set', () => {
    const source = buildResizableSnippet({ ...unset, minWidth: '120', minHeight: '80', maxWidth: '640', maxHeight: '480' })
    expect(source).toContain('minWidth={120}')
    expect(source).toContain('minHeight={80}')
    expect(source).toContain('maxWidth={640}')
    expect(source).toContain('maxHeight={480}')
  })

  it('emits the parent keyword as a string attribute', () => {
    const source = buildResizableSnippet({ ...unset, maxWidth: 'parent', maxHeight: 'parent' })
    expect(source).toContain('maxWidth="parent"')
    expect(source).toContain('maxHeight="parent"')
  })

  it('renders the content from scope inside the scrollport', () => {
    const source = buildResizableSnippet(unset)
    // The non-interactive scroll wrapper stays out of the tab order.
    expect(source).toContain(`<div class="${RESIZABLE_SCROLLPORT}" tabindex="-1">`)
    expect(source).toContain(`<div class="${RESIZABLE_CONTENT}">{contentLabel}</div>`)
  })

  it('emits a custom content class when set', () => {
    const source = buildResizableSnippet({ ...unset, contentClass: 'content-x' })
    expect(source).toContain('<div class="content-x">{contentLabel}</div>')
  })

  it('omits className while unset', () => {
    const source = buildResizableSnippet(unset)
    expect(source).not.toContain('className=')
  })

  it('emits className when set', () => {
    const source = buildResizableSnippet({
      ...unset,
      className: 'frame-x',
    })
    expect(source).toContain('className="frame-x"')
  })

  it('omits the staged bounds while their eyes are off', () => {
    const source = buildResizableSnippet({ ...unset, minWidth: '120', minWidthOn: false, minHeight: '80', minHeightOn: false })
    expect(source).toContain('width={width}')
    expect(source).toContain('height={height}')
    expect(source).not.toContain('minWidth=')
    expect(source).not.toContain('minHeight=')
  })

  it('omits the staged max bounds while their eyes are off', () => {
    const source = buildResizableSnippet({ ...unset, maxWidth: '640', maxWidthOn: false, maxHeight: 'parent', maxHeightOn: false })
    expect(source).not.toContain('maxWidth=')
    expect(source).not.toContain('maxHeight=')
  })

  it('omits the staged className while its eye is off and emits it when on', () => {
    expect(buildResizableSnippet({ ...unset, className: 'frame-x', classNameOn: false })).not.toContain('className=')
    expect(buildResizableSnippet({ ...unset, className: 'frame-x', classNameOn: true })).toContain('className="frame-x"')
  })
})

describe('parseResizableChildrenMarkup', () => {
  it('round-trips the canonical markup', () => {
    const markup = buildResizableChildrenMarkup('content-x')
    expect(markup).toBe('<div class="content-x">{contentLabel}</div>')
    expect(parseResizableChildrenMarkup(markup)).toBe('content-x')
  })

  it('rejects anything but the canonical shape', () => {
    expect(parseResizableChildrenMarkup('nope')).toBeNull()
    expect(parseResizableChildrenMarkup('<div class="x">label</div>')).toBeNull()
    expect(parseResizableChildrenMarkup('<span class="x">{contentLabel}</span>')).toBeNull()
  })
})
