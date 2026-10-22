import { createOptionIndex, matchesOption, matchLabelParts, type MatchedLabelParts } from '$lib/actions/option-index'

// The normalized option shape a filterable select reads: a bare string already
// normalizes to its own label, so both sides agree on `{ value, label }`.
interface FilterableOption {
  value: string
  label: string
}

interface SelectFilterOptions<T extends FilterableOption> {
  /** The normalized options, read reactively so the filter follows a swap. */
  options: () => T[]
  /** Whether the control filters as the user types. */
  filterable: () => boolean
  /** Whether the typed text diverges from the echoed value. */
  dirty: () => boolean
  /** The text currently in the control's input. */
  text: () => string
  /** The label echoed in the input while the text is pristine. */
  echoedLabel: () => string
}

export interface SelectFilter<T extends FilterableOption> {
  /** The lowercased needle, empty when filtering is off or the text is echoed. */
  readonly filterQuery: string
  /** Matching options, or every option when the query is empty or matches none. */
  readonly filteredOptions: T[]
  /** Whether a label's matched span should be emphasized. */
  readonly highlightMatches: boolean
  /** Split a label around its matched span, or null when nothing is highlighted. */
  labelParts: (label: string) => MatchedLabelParts | null
}

/**
 * Filtering and match highlighting for a filterable select. The match needle
 * and the visible option list read the same state, so they can never disagree.
 */
export function useSelectFilter<T extends FilterableOption>(options: SelectFilterOptions<T>): SelectFilter<T> {
  // Lowercased once per options array so filtering never re-lowercases every
  // label/value on each keystroke.
  const optionIndex = $derived(createOptionIndex(options.options()))

  const filterQuery = $derived.by(() => {
    if (!options.filterable() || !options.dirty()) {
      return ''
    }
    const text = options.text()
    const echoed = options.echoedLabel()
    // Strip the prefilled label only when text was appended to it; a query that
    // merely equals the label is filtered as-is so an exact match narrows.
    const query = text.length > echoed.length && text.startsWith(echoed) ? text.slice(echoed.length) : text
    return query.trim().toLowerCase()
  })

  const filteredOptions = $derived.by(() => {
    // An empty query shows every option; any other query narrows the list to
    // options whose label or value contains it. A query matching nothing falls
    // back to the full list so the panel never goes empty while typing.
    const all = options.options()
    if (filterQuery === '') {
      return all
    }
    const matched: T[] = []
    for (const entry of optionIndex) {
      if (matchesOption(entry, filterQuery)) {
        matched.push(entry.option)
      }
    }
    return matched.length > 0 ? matched : all
  })

  // Emphasize the typed part only while the query is ambiguous: with two or
  // more matches the user needs to see which part matched, while a lone match
  // is already the only row and needs no extra emphasis.
  const highlightMatches = $derived(filterQuery !== '' && filteredOptions.length > 1)

  function labelParts(label: string): MatchedLabelParts | null {
    return highlightMatches ? matchLabelParts(label, filterQuery) : null
  }

  return {
    get filterQuery() {
      return filterQuery
    },
    get filteredOptions() {
      return filteredOptions
    },
    get highlightMatches() {
      return highlightMatches
    },
    labelParts,
  }
}
