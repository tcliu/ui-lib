import { DATE_RE, setTimeSegment, splitDateTime, todayIso, type TimeUnit } from './date-input-core'

// The hour/minute/second row a time-bearing date panel renders. The committed
// value's own segments show (midnight for an unset value), and an edit carries
// into the next unit instead of clamping at the segment's edge.
export function createTimeSegments(getValue: () => string, onChange: (value: string) => void) {
  const parts = $derived(splitDateTime(getValue()))
  const date = $derived(parts?.date ?? '')
  // Where an edit starts when the value carries no parseable time yet: the
  // value's own date, or today, at midnight — so the first edit yields a
  // complete date-time instead of an empty one.
  const seed = $derived(
    `${DATE_RE.test(getValue()) ? getValue() : date || todayIso()}T00:00:00`,
  )

  // Edit one segment as clock seconds, so an entry past its own range carries
  // into the next unit and past midnight rolls the date (the boxes therefore
  // carry no min/max of their own). The box shows two digits, so the entry
  // reads as its last two — appending after focus lands on the same value a
  // fresh entry would — with a leading minus kept as the stepping borrow.
  function setSegment(unit: TimeUnit, raw: string) {
    const digits = raw.replace(/[^0-9]/g, '').slice(-2)
    if (digits === '') return
    const entered = Number.parseInt(digits, 10) * (raw.trimStart().startsWith('-') ? -1 : 1)
    onChange(setTimeSegment(parts ? getValue() : seed, unit, entered))
  }

  return {
    get hourText() {
      return parts?.hour ?? '00'
    },
    get minuteText() {
      return parts?.minute ?? '00'
    },
    get secondText() {
      return parts?.second ?? '00'
    },
    setSegment,
  }
}
