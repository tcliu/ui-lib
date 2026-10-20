import { describe, expect, it } from 'vitest'
import {
  addDays,
  buildMonthWeeks,
  clampToMonth,
  formatDate,
  joinDateTime,
  patternWidth,
  setTimeSegment,
  splitDateTime,
} from '../date-input-core'

describe('formatDate', () => {
  it('formats dayjs tokens and literal text', () => {
    expect(formatDate('2026-09-05', 'YYYY-MM-DD', 'en')).toBe('2026-09-05')
    expect(formatDate('2026-09-05', 'YY/M/D', 'en')).toBe('26/9/5')
    expect(formatDate('2026-09-05T14:30', 'HH:mm', 'en')).toBe('14:30')
    expect(formatDate('2026-09-05', '[on] MMM D, YYYY', 'en')).toBe('on Sep 5, 2026')
  })

  it('localizes month and weekday names through dayjs locales', () => {
    expect(formatDate('2026-09-05', 'dddd', 'en')).toBe('Saturday')
    // Chinese locale names, proving the locale mapping is wired.
    expect(formatDate('2026-09-05', 'M月', 'zh-CN')).toBe('9月')
  })
})

describe('date-input-core helpers', () => {
  it('builds whole-week month rows', () => {
    const weeks = buildMonthWeeks(2026, 8)
    expect(weeks.length).toBeGreaterThan(0)
    expect(weeks.every(week => week.length === 7)).toBe(true)
  })

  it('splits and joins a date-time value', () => {
    expect(splitDateTime('2026-09-05T14:30:59')).toEqual({ date: '2026-09-05', hour: '14', minute: '30', second: '59' })
    // A value without seconds is not a date-time value at all.
    expect(splitDateTime('2026-09-05T14:30')).toBeNull()
    expect(splitDateTime('')).toBeNull()
    expect(joinDateTime('2026-09-05', '14', '30', '59')).toBe('2026-09-05T14:30:59')
  })

  it('adds days and clamps months', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(clampToMonth(2026, 9, 31)).toBe('2026-10-31')
  })

  it('carries a time segment and rolls the date past midnight', () => {
    // A segment past its own range carries into the next unit...
    expect(setTimeSegment('2026-09-05T10:59:00', 'minute', 60)).toBe('2026-09-05T11:00:00')
    expect(setTimeSegment('2026-09-05T10:59:30', 'second', 60)).toBe('2026-09-05T11:00:00')
    // ...and a clock at the top of the day rolls the date.
    expect(setTimeSegment('2026-09-05T23:59:59', 'second', 60)).toBe('2026-09-06T00:00:00')
    expect(setTimeSegment('2026-09-05T23:30:00', 'hour', 24)).toBe('2026-09-06T00:30:00')
    // Stepping below zero borrows into the previous day.
    expect(setTimeSegment('2026-09-05T00:00:00', 'second', -1)).toBe('2026-09-04T23:59:59')
  })
})

describe('patternWidth', () => {
  it('measures a pattern by what it prints', () => {
    expect(patternWidth('YYYY-MM-DD')).toBe(10)
    expect(patternWidth('YYYY-MM-DD HH:mm')).toBe(16)
    expect(patternWidth('YYYY-MM-DD HH:mm:ss')).toBe(19)
    // Names take their longest form, and a single-letter token its two digits.
    expect(patternWidth('D MMMM YYYY')).toBe(17)
    expect(patternWidth('[on] MMM D, YYYY')).toBe(15)
    // Full-width literals take two `ch`, so a CJK pattern reserves their real
    // printed width rather than one column per glyph.
    expect(patternWidth('YYYY年MM月DD日')).toBe(14)
  })
})
