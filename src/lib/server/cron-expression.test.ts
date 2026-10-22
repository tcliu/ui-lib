import { describe, expect, it } from 'vitest'
import { cronMatches, nextCronMatch, parseCronExpression } from './cron-expression'

// Fixed UTC anchor so the expectations never depend on the host timezone.
const at = (iso: string) => new Date(iso)

describe('parseCronExpression', () => {
  it('expands the macros', () => {
    const minutely = parseCronExpression('@minutely')
    expect(minutely?.minute.values).toHaveLength(60)
    expect(minutely?.minute.values[0]).toBe(0)
    expect(minutely?.minute.values[59]).toBe(59)
    expect(parseCronExpression('@hourly')?.minute.values).toEqual([0])
    expect(parseCronExpression('@daily')?.hour.values).toEqual([0])
    expect(parseCronExpression('@monthly')?.dayOfMonth.values).toEqual([1])
    expect(parseCronExpression('@annotated')).toBeNull()
  })

  it('parses single values, ranges, steps, and lists', () => {
    const parsed = parseCronExpression('5,10-20/5 2 * * *')
    expect(parsed?.minute.values).toEqual([5, 10, 15, 20])
    expect(parsed?.hour.values).toEqual([2])
    expect(parsed?.dayOfMonth.restricted).toBe(false)
  })

  it('marks a plain star unrestricted and a stepped star restricted', () => {
    expect(parseCronExpression('* * * * *')?.minute.restricted).toBe(false)
    expect(parseCronExpression('*/15 * * * *')?.minute.restricted).toBe(true)
  })

  it('normalizes Sunday from 7 to 0', () => {
    expect(parseCronExpression('0 0 * * 7')?.dayOfWeek.values).toEqual([0])
    expect(parseCronExpression('0 0 * * 0')?.dayOfWeek.values).toEqual([0])
    expect(parseCronExpression('0 0 * * 5-7')?.dayOfWeek.values).toEqual([0, 5, 6])
  })

  it('rejects malformed or out-of-range expressions', () => {
    expect(parseCronExpression('')).toBeNull()
    expect(parseCronExpression('   ')).toBeNull()
    expect(parseCronExpression('* * * *')).toBeNull()
    expect(parseCronExpression('* * * * * *')).toBeNull()
    expect(parseCronExpression('60 * * * *')).toBeNull()
    expect(parseCronExpression('* 24 * * *')).toBeNull()
    expect(parseCronExpression('* * 0 * *')).toBeNull()
    expect(parseCronExpression('* * * 13 *')).toBeNull()
    expect(parseCronExpression('* * * * 8')).toBeNull()
    expect(parseCronExpression('*/0 * * * *')).toBeNull()
    expect(parseCronExpression('5-1 * * * *')).toBeNull()
    expect(parseCronExpression('1,,2 * * * *')).toBeNull()
    expect(parseCronExpression('a * * * *')).toBeNull()
  })
})

describe('cronMatches', () => {
  it('matches on minute, hour, month, and day', () => {
    const parsed = parseCronExpression('30 4 1 6 *')
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(cronMatches(parsed, at('2026-06-01T04:30:00Z'))).toBe(true)
    expect(cronMatches(parsed, at('2026-06-01T04:31:00Z'))).toBe(false)
    expect(cronMatches(parsed, at('2026-06-02T04:30:00Z'))).toBe(false)
    expect(cronMatches(parsed, at('2026-07-01T04:30:00Z'))).toBe(false)
  })

  it('ORs the day-of-month and day-of-week fields when both are restricted', () => {
    const parsed = parseCronExpression('0 0 1 * 1')
    expect(parsed).not.toBeNull()
    if (!parsed) return
    // 2026-06-01 is a Monday, so both halves of the OR hold on that day.
    expect(cronMatches(parsed, at('2026-06-01T00:00:00Z'))).toBe(true)
    // The 1st of a non-Monday month still matches through day-of-month.
    expect(cronMatches(parsed, at('2026-07-01T00:00:00Z'))).toBe(true)
    // A Monday that is not the 1st still matches through day-of-week.
    expect(cronMatches(parsed, at('2026-06-08T00:00:00Z'))).toBe(true)
    // Neither the 1st nor a Monday: no match.
    expect(cronMatches(parsed, at('2026-06-09T00:00:00Z'))).toBe(false)
  })

  it('requires a single restricted day field to match on its own', () => {
    const parsed = parseCronExpression('0 0 1 * *')
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(cronMatches(parsed, at('2026-06-01T00:00:00Z'))).toBe(true)
    expect(cronMatches(parsed, at('2026-06-08T00:00:00Z'))).toBe(false)
  })
})

describe('nextCronMatch', () => {
  it('returns the next matching minute strictly after the given instant', () => {
    const parsed = parseCronExpression('*/15 * * * *')
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(nextCronMatch(parsed, at('2026-06-01T00:00:00Z'))?.toISOString()).toBe('2026-06-01T00:15:00.000Z')
    expect(nextCronMatch(parsed, at('2026-06-01T00:14:30Z'))?.toISOString()).toBe('2026-06-01T00:15:00.000Z')
  })

  it('rolls into the next day and the next month', () => {
    const daily = parseCronExpression('0 3 * * *')
    expect(daily).not.toBeNull()
    if (!daily) return
    expect(nextCronMatch(daily, at('2026-06-01T04:00:00Z'))?.toISOString()).toBe('2026-06-02T03:00:00.000Z')

    const monthly = parseCronExpression('0 0 1 * *')
    expect(monthly).not.toBeNull()
    if (!monthly) return
    expect(nextCronMatch(monthly, at('2026-06-01T00:00:00Z'))?.toISOString()).toBe('2026-07-01T00:00:00.000Z')
  })

  it('finds the next leap day rather than giving up after a year', () => {
    const leap = parseCronExpression('0 0 29 2 *')
    expect(leap).not.toBeNull()
    if (!leap) return
    expect(nextCronMatch(leap, at('2026-03-01T00:00:00Z'))?.toISOString()).toBe('2028-02-29T00:00:00.000Z')
  })

  it('returns null when no run falls inside the search horizon', () => {
    // Feb 30 never occurs in the Gregorian calendar.
    const impossible = parseCronExpression('0 0 30 2 *')
    expect(impossible).not.toBeNull()
    if (!impossible) return
    expect(nextCronMatch(impossible, at('2026-01-01T00:00:00Z'))).toBeNull()
  })
})
