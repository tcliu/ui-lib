import { describe, expect, it } from 'vitest'
import {
  addDays,
  buildMonthWeeks,
  clampToMonth,
  compareValues,
  DATETIME_VALUE_FORMAT,
  datePattern,
  DEFAULT_DATE_FORMAT,
  entryPatterns,
  formatDate,
  joinDateTime,
  patternWidth,
  setTimeSegment,
  splitDateTime,
  toValue,
  valueDay,
} from './date-input-core'

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

  it('reads the committed day of a value, and an unset one as no day', () => {
    expect(valueDay('2026-09-05', DEFAULT_DATE_FORMAT, 'en')).toBe('2026-09-05')
    // A date-time contributes its day, not its time.
    expect(valueDay('2026-09-05T14:30:59', DATETIME_VALUE_FORMAT, 'en')).toBe('2026-09-05')
    // An unset or impossible value reads as unset rather than as a day.
    expect(valueDay('', DEFAULT_DATE_FORMAT, 'en')).toBe('')
    expect(valueDay('2026-02-31', DEFAULT_DATE_FORMAT, 'en')).toBe('')
  })

  it('compares two values by the instants they carry', () => {
    expect(compareValues('2026-09-05', '2026-09-06', DEFAULT_DATE_FORMAT, 'en')).toBe(-1)
    expect(compareValues('2026-09-06', '2026-09-05', DEFAULT_DATE_FORMAT, 'en')).toBe(1)
    expect(compareValues('2026-09-05', '2026-09-05', DEFAULT_DATE_FORMAT, 'en')).toBe(0)
    // The clock counts too, so two times on the same day compare by their time.
    expect(compareValues('2026-09-05T09:00:00', '2026-09-05T10:00:00', DATETIME_VALUE_FORMAT, 'en')).toBe(-1)
    expect(compareValues('2026-09-05T10:00:00', '2026-09-05T10:00:00', DATETIME_VALUE_FORMAT, 'en')).toBe(0)
    // An unset or impossible value never compares, so it never swaps.
    expect(compareValues('', '2026-09-05', DEFAULT_DATE_FORMAT, 'en')).toBeNull()
    expect(compareValues('2026-02-31', '2026-09-05', DEFAULT_DATE_FORMAT, 'en')).toBeNull()
  })

  it('reads the date part of a pattern', () => {
    // The clock drops off, and the separator that glued it goes with it.
    expect(datePattern('YYYY-MM-DD HH:mm:ss')).toBe('YYYY-MM-DD')
    expect(datePattern('MMM D, YYYY HH:mm')).toBe('MMM D, YYYY')
    expect(datePattern('D MMM YYYY hh:mm A')).toBe('D MMM YYYY')
    // A pattern without a clock is its own date part.
    expect(datePattern('YYYY-MM-DD')).toBe('YYYY-MM-DD')
    expect(datePattern('MMM D, YYYY')).toBe('MMM D, YYYY')
    // A pattern that starts with the clock has no date part.
    expect(datePattern('HH:mm YYYY-MM-DD')).toBe('')
  })

  it('lists the forms a typed entry may match, longest first', () => {
    expect(entryPatterns('YYYY-MM-DD HH:mm:ss')).toEqual([
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD HH',
      'YYYY-MM-DD',
    ])
    // A date pattern has one form: itself.
    expect(entryPatterns('YYYY-MM-DD')).toEqual(['YYYY-MM-DD'])
    // A 12-hour clock or a meridiem keeps the clock whole, since a clock
    // without its meridiem would be ambiguous.
    expect(entryPatterns('YYYY-MM-DD hh:mm A')).toEqual(['YYYY-MM-DD hh:mm A', 'YYYY-MM-DD'])
  })

  it('converts a typed entry into a value, defaulting what it leaves out', () => {
    // The pattern's own text.
    expect(toValue('2026-01-12 03:04:05', 'YYYY-MM-DD HH:mm:ss', DATETIME_VALUE_FORMAT, 'en')).toBe(
      '2026-01-12T03:04:05',
    )
    // A clock carried in part: the missing units default to zero.
    expect(toValue('2026-01-12 03', 'YYYY-MM-DD HH:mm:ss', DATETIME_VALUE_FORMAT, 'en')).toBe('2026-01-12T03:00:00')
    expect(toValue('2026-01-12 03:04', 'YYYY-MM-DD HH:mm:ss', DATETIME_VALUE_FORMAT, 'en')).toBe('2026-01-12T03:04:00')
    // The date alone: the clock defaults whole.
    expect(toValue('2026-01-12', 'YYYY-MM-DD HH:mm:ss', DATETIME_VALUE_FORMAT, 'en')).toBe('2026-01-12T00:00:00')
    // A date pattern keeps its strictness: a partial entry converts to nothing.
    expect(toValue('2026-01', 'YYYY-MM-DD', DEFAULT_DATE_FORMAT, 'en')).toBe('')
    expect(toValue('2026-02-31', 'YYYY-MM-DD', DEFAULT_DATE_FORMAT, 'en')).toBe('')
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
