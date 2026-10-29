interface CaretAtEndOptions {
  /** The field whose caret should move, or null while the field is unmounted. */
  element: () => HTMLInputElement | HTMLTextAreaElement | null
  /** Whether the control still holds focus when the deferred fix lands. */
  focused: () => boolean
}

export interface CaretAtEnd {
  /** Schedule the caret fix for the next frame, replacing a pending one. */
  placeCaretAtEnd: () => void
  /** Drop a pending fix (e.g. before a deliberate selection gesture). */
  cancel: () => void
}

// `setSelectionRange` throws for an input type outside the text-like set
// (email, number, date, …), so those skip the write instead of catching it.
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'url', 'tel', 'password'])

function supportsSelection(field: HTMLInputElement | HTMLTextAreaElement): boolean {
  return field instanceof HTMLTextAreaElement || TEXT_INPUT_TYPES.has(field.type)
}

/**
 * Place the caret at the end of a focused input's value on the next frame.
 * Browsers may select the whole value when keyboard navigation moves focus in;
 * a deferred fix lets the browser's own selection land first, then collapses
 * only a whole-value or already-collapsed selection so a deliberate drag-select
 * is left alone.
 */
export function useCaretAtEnd({ element, focused }: CaretAtEndOptions): CaretAtEnd {
  let rafId: number | null = null

  function cancel(): void {
    if (rafId === null) {
      return
    }
    cancelAnimationFrame(rafId)
    rafId = null
  }

  function placeCaretAtEnd(): void {
    const input = element()
    if (!input) {
      return
    }
    cancel()
    // Snapshot the selection at scheduling time: if it changed by the frame
    // (Shift+Home / Ctrl+A in the meantime), the fix backs off instead of
    // collapsing the selection the user just made.
    const scheduledStart = input.selectionStart
    const scheduledEnd = input.selectionEnd
    rafId = requestAnimationFrame(() => {
      rafId = null
      const next = element()
      if (!next || !focused() || !supportsSelection(next)) {
        return
      }
      const { selectionStart, selectionEnd, value } = next
      if (value.length === 0) {
        return
      }
      if (selectionStart !== scheduledStart || selectionEnd !== scheduledEnd) {
        return
      }
      const collapsed = selectionStart === selectionEnd
      const wholeValue = selectionStart === 0 && selectionEnd === value.length
      if (!collapsed && !wholeValue) {
        return
      }
      const end = value.length
      next.setSelectionRange(end, end)
    })
  }

  return { placeCaretAtEnd, cancel }
}
