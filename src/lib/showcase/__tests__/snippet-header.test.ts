import { describe, expect, it } from 'vitest'
import { buildHeaderLine, parseHeaderMarkup } from '../snippet-header'

describe('parseHeaderMarkup', () => {
  it('accepts the canonical Copyable title line', () => {
    expect(parseHeaderMarkup('<Copyable text="$.user"><span>$.user</span></Copyable>')).toEqual({
      text: '$.user',
      inner: '$.user',
    })
    expect(buildHeaderLine({ text: '$.user', inner: '$.user' })).toBe(
      '<Copyable text="$.user"><span>$.user</span></Copyable>',
    )
  })

  it('round-trips entities and trims facets', () => {
    expect(parseHeaderMarkup('<Copyable text="a &amp; b"><span>  a &amp; b  </span></Copyable>')).toEqual({
      text: 'a & b',
      inner: 'a & b',
    })
  })

  it('rejects empty, multi-shape, and non-Copyable markup', () => {
    expect(parseHeaderMarkup('')).toBeNull()
    expect(parseHeaderMarkup('nope')).toBeNull()
    expect(parseHeaderMarkup('<Copyable text=""><span>x</span></Copyable>')).toBeNull()
    expect(parseHeaderMarkup('<Copyable text="x"><span></span></Copyable>')).toBeNull()
    expect(parseHeaderMarkup('<Copyable text="x">x</Copyable>')).toBeNull()
    expect(parseHeaderMarkup('<span>x</span>')).toBeNull()
    expect(parseHeaderMarkup('<Copyable text="x"><span>{y}</span></Copyable>')).toBeNull()
    expect(
      parseHeaderMarkup('<Copyable text="x"><span>a</span></Copyable>\n<Copyable text="y"><span>b</span></Copyable>'),
    ).toBeNull()
  })
})
