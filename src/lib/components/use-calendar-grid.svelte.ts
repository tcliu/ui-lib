import { tick } from 'svelte'
import { isFocusWithin } from '$lib/actions/focus-within'
import {
  DAY_STEP,
  addDays,
  buildMonthWeeks,
  clampToMonth,
  dayOf,
  monthOf,
  todayIso,
  weekdayOf,
  yearOf,
} from './date-input-core'

interface CalendarGridOptions {
  // Whether the panel is showing; the grid only follows a value while open.
  getOpen: () => boolean
  // The committed day (`YYYY-MM-DD`), or '' when the value is unset/invalid.
  getSingle: () => string
  // The day a closed or freshly opened grid anchors on: the value, else today.
  getAnchorDay: () => string
  getLocale: () => string
}

// The month grid a date field's panel renders: the visible month, the day
// roving focus starts from, the day nodes the arrow keys move between, and the
// rules that keep the view on the committed value — re-anchoring when the
// panel is closed, and when a value arrives from outside while it is open
// without stealing focus from a time segment.
export function createCalendarGrid(options: CalendarGridOptions) {
  const { getOpen, getSingle, getAnchorDay, getLocale } = options

  let viewYear = $state(new Date().getFullYear())
  let viewMonth = $state(new Date().getMonth())
  let focusDay = $state(todayIso())
  let gridRef = $state<HTMLDivElement | null>(null)

  // The day the view was last pointed at, so a value that arrives for the day
  // already shown is not a re-anchor. Plain (not `$state`): the effects below
  // write it, and a tracked write would re-run them.
  let shownDay = ''

  const dateFormat = $derived(
    new Intl.DateTimeFormat(getLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  )
  const monthFormat = $derived(
    new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  )
  const numberFormat = $derived(new Intl.NumberFormat(getLocale()))
  const weekdayLabels = $derived(
    Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(getLocale(), { weekday: 'short', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2024, 0, 7 + index)),
      ),
    ),
  )
  const monthLabel = $derived(monthFormat.format(new Date(Date.UTC(viewYear, viewMonth, 1))))
  const weeks = $derived(
    buildMonthWeeks(viewYear, viewMonth).map(row =>
      row.map(cell => ({
        ...cell,
        aria: cell.day ? dateFormat.format(new Date(`${cell.day}T00:00:00Z`)) : '',
      })),
    ),
  )

  const dayNodes = new Map<string, HTMLButtonElement>()
  function dayRef(node: HTMLButtonElement, day: string) {
    dayNodes.set(day, node)
    return {
      destroy() {
        dayNodes.delete(day)
      },
    }
  }

  // Re-anchor the visible month and the roving focus to the committed value
  // whenever the picker is closed and the value changes (external update,
  // Clear, reset).
  $effect(() => {
    if (getOpen()) return
    const anchor = getAnchorDay()
    viewYear = yearOf(anchor)
    viewMonth = monthOf(anchor)
    focusDay = anchor
  })

  // An open panel follows the value: a change from outside (a typed commit, a
  // parent write, restored data) re-anchors the grid on that day, so the view
  // never shows a month other than the field's value. An unset or unparseable
  // value leaves the view where the user left it, and a *grid* that holds focus
  // keeps it on the day — a time segment keeps its own focus while a step rolls
  // the date.
  $effect(() => {
    if (!getOpen()) return
    const day = getSingle()
    if (!day || day === shownDay) return
    const gridFocused = isFocusWithin(gridRef)
    anchorView(day)
    if (gridFocused) void tick().then(() => dayNodes.get(day)?.focus())
  })

  // Point the grid at `day` — its month, and the day roving focus starts from —
  // without touching the value.
  function anchorView(day: string) {
    shownDay = day
    viewYear = yearOf(day)
    viewMonth = monthOf(day)
    focusDay = day
  }

  // Move roving focus onto `day`, following it across a month boundary: the
  // focus lands after the grid re-renders.
  async function focusOn(day: string) {
    focusDay = day
    if (yearOf(day) !== viewYear || monthOf(day) !== viewMonth) {
      viewYear = yearOf(day)
      viewMonth = monthOf(day)
      await tick()
    }
    dayNodes.get(day)?.focus()
  }

  function onDayKeydown(event: KeyboardEvent, day: string) {
    const step = DAY_STEP[event.key]
    if (step !== undefined) {
      event.preventDefault()
      void focusOn(addDays(day, step))
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const weekday = weekdayOf(day)
      void focusOn(addDays(day, event.key === 'Home' ? -weekday : 6 - weekday))
      return
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      void focusOn(clampToMonth(yearOf(day), monthOf(day) + (event.key === 'PageDown' ? 1 : -1), dayOf(day)))
    }
  }

  function prevMonth() {
    if (viewMonth === 0) {
      viewMonth = 11
      viewYear--
    } else {
      viewMonth--
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      viewMonth = 0
      viewYear++
    } else {
      viewMonth++
    }
  }

  return {
    get gridRef() {
      return gridRef
    },
    set gridRef(node: HTMLDivElement | null) {
      gridRef = node
    },
    get focusDay() {
      return focusDay
    },
    setFocusDay(day: string) {
      focusDay = day
    },
    get monthLabel() {
      return monthLabel
    },
    get weekdayLabels() {
      return weekdayLabels
    },
    get weeks() {
      return weeks
    },
    get numberFormat() {
      return numberFormat
    },
    dayRef,
    anchorView,
    focusDayNode(day: string) {
      dayNodes.get(day)?.focus()
    },
    onDayKeydown,
    prevMonth,
    nextMonth,
  }
}
