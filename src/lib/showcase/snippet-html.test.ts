import { describe, expect, it } from 'vitest'
import { isBasicHtmlMarkup } from './snippet-html'

describe('isBasicHtmlMarkup', () => {
  it('accepts plain text and well-formed elements', () => {
    expect(isBasicHtmlMarkup('')).toBe(true)
    expect(isBasicHtmlMarkup('plain text')).toBe(true)
    expect(isBasicHtmlMarkup('<span>note</span>')).toBe(true)
    expect(isBasicHtmlMarkup('<div class="x"><span>a & b</span></div>')).toBe(true)
    expect(isBasicHtmlMarkup('<input />')).toBe(true)
    expect(isBasicHtmlMarkup('<br>')).toBe(true)
    expect(isBasicHtmlMarkup('<a title="a:b <c>">x</a>')).toBe(true)
  })

  it('rejects the outlier cases', () => {
    expect(isBasicHtmlMarkup('<span>{label}</span>')).toBe(false)
    expect(isBasicHtmlMarkup('<!-- note -->')).toBe(false)
    expect(isBasicHtmlMarkup('<script>alert(1)</script>')).toBe(false)
    expect(isBasicHtmlMarkup('<MyControl />')).toBe(false)
    expect(isBasicHtmlMarkup('<span>oops')).toBe(false)
    expect(isBasicHtmlMarkup('</span>')).toBe(false)
    expect(isBasicHtmlMarkup('<div />')).toBe(false)
    expect(isBasicHtmlMarkup('<button onclick="go()">x</button>')).toBe(false)
    expect(isBasicHtmlMarkup('<div bind:this={el}>x</div>')).toBe(false)
    expect(isBasicHtmlMarkup('a < b')).toBe(false)
  })
})
