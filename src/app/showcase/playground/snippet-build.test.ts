import { describe, expect, it } from 'vitest'
import {
  boolAttrLine,
  enumAttrLine,
  popupAttrLine,
  sizeAttrLine,
  textAttrLine,
} from './snippet-build'
import { staged } from './staged'

describe('textAttrLine', () => {
  it('emits a quoted, escaped attribute while the eye is on', () => {
    expect(textAttrLine('className', staged('a "b" & c', true))).toEqual(['  className="a &quot;b&quot; &amp; c"'])
  })

  it('omits the line while the eye is off or the value is unset', () => {
    expect(textAttrLine('className', staged('ml-2'))).toEqual([])
    expect(textAttrLine('className', staged('', true))).toEqual([])
  })

  it('honours the caller indent', () => {
    expect(textAttrLine('label', staged('Apply', true), '    ')).toEqual(['    label="Apply"'])
  })
})

describe('enumAttrLine', () => {
  it('omits the component default and escapes the value', () => {
    expect(enumAttrLine('variant', staged('secondary', true), 'secondary')).toEqual([])
    expect(enumAttrLine('variant', staged('primary', true), 'secondary')).toEqual(['  variant="primary"'])
  })

  it('stays off while the eye is off', () => {
    expect(enumAttrLine('variant', staged('primary'), 'secondary')).toEqual([])
  })

  it('escapes the value and honours the caller indent', () => {
    expect(enumAttrLine('align', staged('a&b', true), 'left', '    ')).toEqual(['    align="a&amp;b"'])
  })
})

describe('boolAttrLine', () => {
  it('renders the bare attribute for Yes and ={false} for No', () => {
    expect(boolAttrLine('disabled', staged('yes', true), 'no')).toEqual(['  disabled'])
    expect(boolAttrLine('disabled', staged('no', true), 'yes')).toEqual(['  disabled={false}'])
  })

  it('treats an empty default as unset and honours the indent', () => {
    expect(boolAttrLine('required', staged('no', true))).toEqual(['  required={false}'])
    expect(boolAttrLine('required', staged('yes', true), '', '      ')).toEqual(['      required'])
  })

  it('omits unset, default, and eye-off values', () => {
    expect(boolAttrLine('disabled', staged('', true))).toEqual([])
    expect(boolAttrLine('disabled', staged('no', true), 'no')).toEqual([])
    expect(boolAttrLine('disabled', staged('yes'))).toEqual([])
  })
})

describe('sizeAttrLine', () => {
  it('emits a step or a pixel expression, omitting the default', () => {
    expect(sizeAttrLine(staged('lg', true))).toEqual(['  size="lg"'])
    expect(sizeAttrLine(staged('14', true))).toEqual(['  size={14}'])
    expect(sizeAttrLine(staged('md', true))).toEqual([])
  })

  it('omits invalid input and stays off while the eye is off', () => {
    expect(sizeAttrLine(staged('huge', true))).toEqual([])
    expect(sizeAttrLine(staged('lg'))).toEqual([])
  })

  it('honours a custom attribute name and indent', () => {
    expect(sizeAttrLine(staged('sm', true), '    ', 'md', 'buttonSize')).toEqual(['    buttonSize="sm"'])
  })
})

describe('popupAttrLine', () => {
  it('emits a kind as a string and the boolean form as an expression', () => {
    expect(popupAttrLine('ariaHaspopup', staged('menu', true))).toEqual(['  ariaHaspopup="menu"'])
    expect(popupAttrLine('ariaHaspopup', staged('true', true))).toEqual(['  ariaHaspopup={true}'])
  })

  it('omits unset and eye-off values', () => {
    expect(popupAttrLine('ariaHaspopup', staged('', true))).toEqual([])
    expect(popupAttrLine('ariaHaspopup', staged('menu'))).toEqual([])
  })

  it('emits the false form and escapes a kind', () => {
    expect(popupAttrLine('ariaHaspopup', staged('false', true))).toEqual(['  ariaHaspopup={false}'])
    expect(popupAttrLine('ariaHaspopup', staged('a&b', true), '    ')).toEqual(['    ariaHaspopup="a&amp;b"'])
  })
})
