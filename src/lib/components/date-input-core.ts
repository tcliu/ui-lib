// Pure date/time helpers for the date input: the date math, the display
// pattern, and the typed-text conversions (a typed entry to a valid date or
// date-time). `DateField` owns the calendar, so every helper lives here once;
// the input's presentation (its metric ratios and its per-part colors) sits in
// `date-input-metrics.ts`, so this module carries no UI. Date handling, the
// display pattern, and the typed-text width estimate ride on dayjs (format
// tokens are dayjs's: `YYYY`, `MM`, `DD`, `HH`, `mm`, …).
import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'

// Pattern-driven parsing (the editable field's text → a real date) needs the
// custom-parse plugin; it is extended once, here, so every picker shares it.
dayjs.extend(customParseFormat)

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/

// Day-granularity keyboard steps for the roving day focus.
export const DAY_STEP: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
}

const DATE_FORMAT = 'YYYY-MM-DD'

// App locale -> dayjs locale id (dayjs ships `en` plus the two Chinese locales
// imported above).
const DAYJS_LOCALES: Record<string, string> = { en: 'en', 'zh-CN': 'zh-cn', 'zh-TW': 'zh-tw' }

export const yearOf = (value: string) => dayjs(value).year()
export const monthOf = (value: string) => dayjs(value).month()
export const dayOf = (value: string) => dayjs(value).date()
export const weekdayOf = (value: string) => dayjs(value).day()
export const daysInMonth = (year: number, month: number) => dayjs(new Date(year, month, 1)).daysInMonth()

export const iso = (year: number, month: number, day: number) => dayjs(new Date(year, month, day)).format(DATE_FORMAT)

export function todayIso(): string {
  return dayjs().format(DATE_FORMAT)
}

export function addDays(value: string, delta: number): string {
  return dayjs(value).add(delta, 'day').format(DATE_FORMAT)
}

export function clampToMonth(year: number, month: number, day: number): string {
  // `new Date` normalizes a month overflow, then dayjs clamps the day to the
  // target month's last day.
  const target = dayjs(new Date(year, month, 1))
  return target.date(Math.min(day, target.daysInMonth())).format(DATE_FORMAT)
}

export interface MonthCell {
  day: string | null
  label: number
}

// The month's day cells padded to whole weeks; `null` days are the leading and
// trailing blanks.
export function buildMonthWeeks(year: number, month: number): MonthCell[][] {
  const start = dayjs(new Date(year, month, 1))
  const leading = start.day()
  const total = start.daysInMonth()
  const cells: MonthCell[] = []
  for (let i = 0; i < leading; i++) cells.push({ day: null, label: 0 })
  for (let d = 1; d <= total; d++) cells.push({ day: start.date(d).format(DATE_FORMAT), label: d })
  while (cells.length % 7 !== 0) cells.push({ day: null, label: 0 })
  const rows: MonthCell[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

export interface DateTimeParts {
  date: string
  hour: string
  minute: string
  second: string
}

// Split a `YYYY-MM-DDTHH:mm:ss` value into its pieces, or null when
// unset/invalid.
export function splitDateTime(value: string): DateTimeParts | null {
  if (!DATETIME_RE.test(value)) return null
  return {
    date: value.slice(0, 10),
    hour: value.slice(11, 13),
    minute: value.slice(14, 16),
    second: value.slice(17, 19),
  }
}

export function joinDateTime(date: string, hour: string, minute: string, second: string): string {
  return `${date}T${hour}:${minute}:${second}`
}

// Format a date/date-time value with a dayjs pattern, localized through dayjs's
// locale set so `MMM`/`MMMM`/`ddd` follow the active locale.
export function formatDate(value: string, pattern: string, locale: string): string {
  return dayjs(value).locale(DAYJS_LOCALES[locale] ?? 'en').format(pattern)
}

// Strict, locale-aware parse of pattern-formatted text: null unless the text is
// a real date (a rollover such as Feb 31 is rejected, not normalized) and it
// round-trips through the pattern exactly, so a half-typed or padded entry never
// commits. Locale names (`MMM`, `dddd`) follow the active locale.
export function parsePattern(text: string, pattern: string, locale: string): Dayjs | null {
  const parsed = dayjs(text, pattern, DAYJS_LOCALES[locale] ?? 'en', true)
  return parsed.isValid() ? parsed : null
}

// The pattern's tokens, longest-first so `MMMM` is not read as `MM` + `MM`.
const PATTERN_TOKENS = /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|Do|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a|Q|ZZ|Z|S{1,3}|ww|w/g
// Patterns whose text may carry words (month/day/meridiem names).
const PATTERN_NAMES = /MMMM|MMM|dddd|ddd|Do|A|a/
// The clock tokens of a pattern: the ones a date-only entry leaves out.
const TIME_TOKEN = /^(?:HH|H|hh|h|mm|m|ss|s|A|a)$/

// The clock tokens of a pattern.
const CLOCK_TOKENS = new Set(['HH', 'H', 'hh', 'h', 'mm', 'm', 'ss', 's'])

// The pattern's date part: the same pattern up to its first clock token, with
// the separator that glued the two trimmed away. A date-time field's typed
// entry can then carry the date alone ("2026-10-14" in a "YYYY-MM-DD HH:mm:ss"
// field) and commit with the time defaulted to midnight. A pattern without a
// clock is its own date part; one that starts with the clock has none.
export function datePattern(pattern: string): string {
  const tokens = new RegExp(PATTERN_TOKENS)
  let match = tokens.exec(pattern)
  while (match !== null) {
    // A bracketed literal is text, not a token, so it never starts the clock.
    if (match[1] === undefined && TIME_TOKEN.test(match[0])) {
      return match.index === 0 ? '' : pattern.slice(0, match.index).trim()
    }
    match = tokens.exec(pattern)
  }
  return pattern
}

// The patterns a typed entry may match, longest first: the pattern itself, the
// pattern up to each of its clock tokens (so a date-time entry may carry the
// clock in part — "2026-01-12 03" in a "YYYY-MM-DD HH:mm:ss" field), and the
// pattern's date part (the clock defaulted whole). A pattern whose clock is
// 12-hour or carries a meridiem keeps its clock whole, since a clock without
// its meridiem would be ambiguous.
export function entryPatterns(pattern: string): string[] {
  const tokens = new RegExp(PATTERN_TOKENS)
  const prefixes: string[] = []
  let meridiem = false
  let twelveHour = false
  let match = tokens.exec(pattern)
  while (match !== null) {
    // A bracketed literal is text, not a token, so it never starts the clock.
    if (match[1] === undefined) {
      const token = match[0]
      if (token === 'A' || token === 'a') meridiem = true
      if (token === 'hh' || token === 'h') twelveHour = true
      if (CLOCK_TOKENS.has(token)) prefixes.push(pattern.slice(0, tokens.lastIndex))
    }
    match = tokens.exec(pattern)
  }
  const dateOnly = datePattern(pattern)
  if (meridiem || twelveHour) return [pattern, dateOnly].filter(Boolean)
  return [...new Set([pattern, ...prefixes.reverse(), dateOnly])].filter(Boolean)
}

// A typed entry parsed leniently: the pattern's own text, or the parts of it
// the entry carries with the rest defaulted — a date-time field accepts
// "2026-01-12" (the clock defaults to midnight) and "2026-01-12 03"
// ("03:00:00"). An entry that matches none of the pattern's forms is null.
export function parseEntry(text: string, pattern: string, locale: string): Dayjs | null {
  for (const candidate of entryPatterns(pattern)) {
    const parsed = parsePattern(text, candidate, locale)
    if (parsed) return parsed
  }
  return null
}

// The value a typed entry converts to under a value format, or '' when the
// entry matches nothing: the pattern's own text, or the parts of it the entry
// carries with the rest defaulted — a date-time field converts "2026-01-12"
// to "2026-01-12T00:00:00" and "2026-01-12 03" to "2026-01-12T03:00:00".
export function toValue(text: string, pattern: string, valueFormat: string, locale: string): string {
  const parsed = parseEntry(text, pattern, locale)
  return parsed ? parsed.format(valueFormat) : ''
}

// Reject characters that could never belong to a value in this pattern, so the
// field only ever holds a plausible entry; the strict parse on commit is the
// real guard (this is the typing affordance). Allowed: digits, the pattern's
// literal characters (separators, CJK markers, bracketed text), and letters when
// the pattern names a month/day/meridiem.
export function filterPatternText(text: string, pattern: string): string {
  const literals = pattern.replace(PATTERN_TOKENS, (_match, bracketed: string | undefined) => bracketed ?? '')
  const letters = PATTERN_NAMES.test(pattern) ? 'A-Za-z' : ''
  const escaped = literals.replace(/[\\\]^/-]/g, '\\$&')
  return text.replace(new RegExp(`[^0-9${letters}${escaped}]`, 'g'), '')
}

// The picked day paired with the time already carried by `source`, so a field
// whose value holds a time keeps it when only the date changes.
export function dayAtTime(day: string, source: Dayjs | null): Dayjs {
  const picked = dayjs(day)
  return source ? picked.hour(source.hour()).minute(source.minute()).second(source.second()) : picked
}

// The committed day of a value under a value format (`YYYY-MM-DD`, or the date
// of a date-time), or '' when the value is unset or does not parse strictly —
// so an invalid value reads as unset rather than poisoning a comparison.
export function valueDay(value: string, valueFormat: string, locale: string): string {
  const parsed = parsePattern(value, valueFormat, locale)
  return parsed ? parsed.format(DEFAULT_DATE_FORMAT) : ''
}

// Compare two values by the instants they carry: -1, 0, or 1. A value that
// does not parse strictly reads as unset and never compares, so an unset (or
// invalid) end never swaps with a set one.
export function compareValues(a: string, b: string, valueFormat: string, locale: string): number | null {
  const first = parsePattern(a, valueFormat, locale)
  const second = parsePattern(b, valueFormat, locale)
  if (!first || !second) return null
  if (first.isBefore(second)) return -1
  if (first.isAfter(second)) return 1
  return 0
}

// How wide a pattern's text prints, per token: a name takes its longest form, a
// number its digit count, and `[...]` its contents. Other tokens print at least
// two characters (a `YYYY`-shortened year, a two-digit hour), so a fallback
// never under-measures the text.
const TOKEN_WIDTH: Record<string, number> = {
  YYYY: 4,
  MMMM: 9,
  dddd: 9,
  MMM: 3,
  ddd: 3,
  Do: 4,
  ZZ: 5,
  SSS: 3,
}

// The room a pattern needs, in characters: a token contributes what it prints
// and every other character its own length. The field reserves this in `ch`, so
// the text always fits and the width follows a custom `format` — and no wider,
// so the value sits close to the field's calendar affordance.
//
// A full-width / East-Asian-wide character prints roughly two `ch`, so it must
// count double; counting it as one under-reserves the field and lets a CJK
// pattern (e.g. `YYYY年MM月DD日`) scroll under the calendar icon.
const WIDE_RANGES: [number, number][] = [
  [0x1100, 0x115f], // Hangul Jamo
  [0x2e80, 0xa4cf], // CJK radicals, symbols, and ideographs
  [0xac00, 0xd7a3], // Hangul syllables
  [0xf900, 0xfaff], // CJK compatibility ideographs
  [0xfe10, 0xfe19], // vertical forms
  [0xfe30, 0xfe6f], // CJK compatibility forms
  [0xff00, 0xff60], // fullwidth forms
  [0xffe0, 0xffe6], // fullwidth signs
  [0x1f300, 0x1faff], // emoji
  [0x20000, 0x3fffd], // CJK extension planes
]

function patternCharWidth(char: string): number {
  const code = char.codePointAt(0) ?? 0
  return WIDE_RANGES.some(([start, end]) => code >= start && code <= end) ? 2 : 1
}

export function patternWidth(pattern: string): number {
  const text = pattern.replace(
    PATTERN_TOKENS,
    (match, bracketed: string | undefined) => bracketed ?? '#'.repeat(TOKEN_WIDTH[match] ?? Math.max(2, match.length)),
  )
  return Array.from(text).reduce((width, char) => width + patternCharWidth(char), 0)
}

// Defaults for the `format` prop, so the showcase rows and the components agree.
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
export const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
// How a date-time field serializes its committed value (the display pattern uses
// a space; the value keeps the ISO `T`), seconds included.
export const DATETIME_VALUE_FORMAT = 'YYYY-MM-DDTHH:mm:ss'

// Edit one clock segment of a date-time value, expressed in whole seconds: an
// entered value past the segment's own range carries into the next unit, and a
// clock that passes midnight rolls the date, so 23:59:59 + 1s is the *next
// day's* 00:00:00 (and 00:00:00 - 1s is the previous day's 23:59:59) rather
// than a clamp.
export type TimeUnit = 'hour' | 'minute' | 'second'
export function setTimeSegment(value: string, unit: TimeUnit, entered: number): string {
  const base = dayjs(value)
  const current = unit === 'hour' ? base.hour() : unit === 'minute' ? base.minute() : base.second()
  const seconds = unit === 'hour' ? 3600 : unit === 'minute' ? 60 : 1
  return base.add((entered - current) * seconds, 'second').format(DATETIME_VALUE_FORMAT)
}

// What a field exposes to its pair: the action that takes the focus and opens
// its calendar (optionally on a given day).
export interface DateFieldHandle {
  focusAndOpen: (day?: string) => void
}

// The pair's other end, as a field sees it: the day it holds ('' when unset)
// and the handle that takes the focus there.
export interface DateFieldSibling extends DateFieldHandle {
  day: string
}

// The span a range field's calendar highlights: the two bounds as days.
export interface DateSpan {
  from: string
  to: string
}
