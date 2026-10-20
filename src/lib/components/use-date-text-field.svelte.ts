import { DEFAULT_DATE_FORMAT, filterPatternText, formatDate, parsePattern } from './date-input-core'

interface DateTextFieldOptions {
  getValue: () => string
  // Serialized form of the committed value (`YYYY-MM-DD`, or a date-time).
  getValueFormat: () => string
  getFormat: () => string
  getLocale: () => string
  // The rendered text for the committed value.
  getCommittedText: () => string
  getHasValue: () => boolean
  // The committed day (`YYYY-MM-DD`), or '' when the value is unset/invalid.
  getSingle: () => string
  getOpen: () => boolean
  onChange: (value: string) => void
  // Point the calendar grid at a day.
  previewTo: (day: string) => void
  // Open the panel (the field's ArrowDown).
  openPanel: () => void
}

// The editable text field of a date field: its draft text, and the commit that
// parses strictly against the pattern and either writes the value back or
// restores the committed text — filter and revert, never an error state. A
// complete, valid entry previews in an open calendar, so retyping the year or
// month moves the grid with the text before the commit lands.
export function createDateTextField(options: DateTextFieldOptions) {
  const {
    getValue,
    getValueFormat,
    getFormat,
    getLocale,
    getCommittedText,
    getHasValue,
    getSingle,
    getOpen,
    onChange,
    previewTo,
    openPanel,
  } = options

  // The typed text while the user edits, otherwise the committed value's text.
  // Re-derived whenever the value, pattern, or locale changes (the effect writes
  // only `draft`, which it never reads, so a keystroke — which changes `draft`
  // alone — cannot clobber itself).
  let draft = $state('')
  $effect(() => {
    draft = getCommittedText()
  })

  // A valid typed entry that has not been committed yet: the grid previews it,
  // so the view and the highlighted day follow the text (retyping the year
  // moves both) while the stored value stays as it was.
  let previewDay = $state('')

  // Keep out characters that could never belong to the pattern, then preview a
  // complete entry in the open calendar.
  function onFieldInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const filtered = filterPatternText(input.value, getFormat())
    if (filtered !== input.value) input.value = filtered
    draft = filtered
    const preview = getOpen() ? parsePattern(filtered.trim(), getFormat(), getLocale()) : null
    previewDay = preview ? preview.format(DEFAULT_DATE_FORMAT) : ''
    if (preview) previewTo(previewDay)
  }

  function commitFieldText() {
    const text = draft.trim()
    const hadPreview = previewDay
    previewDay = ''
    if (text === '') {
      if (getHasValue()) onChange('')
      draft = ''
      return
    }
    const parsed = parsePattern(text, getFormat(), getLocale())
    if (!parsed) {
      draft = getCommittedText()
      // A rejected entry leaves the grid on the committed value too.
      if (getOpen() && getSingle() && hadPreview) previewTo(getSingle())
      return
    }
    const next = parsed.format(getValueFormat())
    if (next !== getValue()) onChange(next)
    draft = formatDate(next, getFormat(), getLocale())
  }

  function onFieldKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' && !getOpen()) {
      event.preventDefault()
      openPanel()
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      commitFieldText()
    }
  }

  return {
    get draft() {
      return draft
    },
    set draft(value: string) {
      draft = value
    },
    get previewDay() {
      return previewDay
    },
    set previewDay(day: string) {
      previewDay = day
    },
    onFieldInput,
    commitFieldText,
    onFieldKeydown,
  }
}
