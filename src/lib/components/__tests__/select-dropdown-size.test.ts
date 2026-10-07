import { describe, expect, it } from 'vitest'
import {
  boxClass,
  emptyClass,
  optionRowClass,
  resolveSelectGeometry,
  resolveSelectStep,
  selectGeometryStyle,
} from '../select-dropdown-styles'

// Named steps must keep rendering through the literal classes, byte-identical
// to before the numeric support landed: every step × every builder is pinned
// against its legacy string.
describe('select-dropdown style builders', () => {
  const TRIGGER_TAIL =
    'inline-flex cursor-pointer items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-950 text-left text-slate-100 outline-none transition motion-reduce:transition-none hover:border-cyan-500'
  const OPTION_TAIL =
    'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md text-left outline-none transition-none max-[27.999rem]:min-h-11'
  it.each([
    ['xs', 'min-w-20', 'px-2.5 py-1.5', 'text-xs'],
    ['sm', 'min-w-28', 'px-3 py-2', 'text-sm'],
    ['md', 'min-w-36', 'px-3 py-2.5', 'text-md'],
    ['lg', 'min-w-44', 'px-4 py-3', 'text-lg'],
  ] as const)('emits the exact legacy strings for %s', (step, minW, pad, text) => {
    expect(boxClass(step)).toBe(`${minW} ${TRIGGER_TAIL} ${pad} ${text}`)
    expect(optionRowClass(step)).toBe(`${minW} ${OPTION_TAIL} ${pad} ${text}`)
    expect(emptyClass(step)).toBe(`${minW} ${pad} ${text} text-slate-400`)
  })
})

describe('resolveSelectGeometry', () => {
  it('passes size names through with their step metrics and no custom flag', () => {
    expect(resolveSelectGeometry('xs')).toEqual({
      step: 'xs',
      iconPx: 12,
      custom: false,
      fontPx: 11,
      padXPx: 10,
      padYPx: 6,
      minWPx: 80,
    })
    expect(resolveSelectGeometry('lg').custom).toBe(false)
  })

  it('maps exact icon-scale pixels to their step with no custom flag', () => {
    expect(resolveSelectGeometry(12)).toMatchObject({ step: 'xs', custom: false, fontPx: 11 })
    expect(resolveSelectGeometry(16)).toMatchObject({ step: 'sm', custom: false })
    expect(resolveSelectGeometry(20)).toMatchObject({ step: 'md', custom: false })
    expect(resolveSelectGeometry(24)).toMatchObject({ step: 'lg', custom: false })
  })

  it('interpolates between steps for other numbers', () => {
    // Halfway xs→sm: font 11→13, padX 10→12, padY 6→8, minW 80→112. The
    // midpoint tie keeps the smaller step for the chevron.
    expect(resolveSelectGeometry(14)).toEqual({
      step: 'xs',
      iconPx: 14,
      custom: true,
      fontPx: 12,
      padXPx: 11,
      padYPx: 7,
      minWPx: 96,
    })
    expect(resolveSelectGeometry(18).step).toBe('sm')
  })

  it('moves every metric on every input value', () => {
    // 19 vs 20: whole-pixel rounding gave both a 15px font while only the
    // width moved. Tenth-pixel precision keeps each input distinct.
    expect(resolveSelectGeometry(19)).toEqual({
      step: 'md',
      iconPx: 19,
      custom: true,
      fontPx: 14.5,
      padXPx: 12,
      padYPx: 9.5,
      minWPx: 136,
    })
    expect(selectGeometryStyle(resolveSelectGeometry(19))).toBe(
      'font-size:14.5px;padding:9.5px 12px;min-width:136px',
    )
  })

  it('extrapolates below 1px and above the scale instead of clamping', () => {
    // Below: the xs→sm slope continues down (metrics floored at zero).
    expect(resolveSelectGeometry(0)).toEqual({
      step: 'xs',
      iconPx: 1,
      custom: true,
      fontPx: 5.5,
      padXPx: 4.5,
      padYPx: 0.5,
      minWPx: 0,
    })
    // Above: the md→lg slope continues up with no maximum.
    expect(resolveSelectGeometry(100)).toEqual({
      step: 'lg',
      iconPx: 100,
      custom: true,
      fontPx: 75,
      padXPx: 92,
      padYPx: 50,
      minWPx: 784,
    })
  })

  it('falls back to sm for non-finite input', () => {
    expect(resolveSelectGeometry(Number.NaN)).toMatchObject({ step: 'sm', custom: false })
  })
})

describe('resolveSelectStep', () => {
  it('passes names through and snaps numbers to the nearest step', () => {
    expect(resolveSelectStep('md')).toBe('md')
    expect(resolveSelectStep(16)).toBe('sm')
    expect(resolveSelectStep(14)).toBe('xs')
    expect(resolveSelectStep(100)).toBe('lg')
    expect(resolveSelectStep(Number.NaN)).toBe('sm')
  })
})

describe('selectGeometryStyle', () => {
  it('emits no style for named steps and exact hits', () => {
    expect(selectGeometryStyle(resolveSelectGeometry('sm'))).toBeUndefined()
    expect(selectGeometryStyle(resolveSelectGeometry(16))).toBeUndefined()
  })

  it('emits font, padding, and min-width for interpolated numbers', () => {
    expect(selectGeometryStyle(resolveSelectGeometry(14))).toBe(
      'font-size:12px;padding:7px 11px;min-width:96px',
    )
  })
})
