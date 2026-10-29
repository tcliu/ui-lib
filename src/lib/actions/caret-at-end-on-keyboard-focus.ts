import { useCaretAtEnd } from '../components/use-caret-at-end.svelte'

/**
 * Keep the caret at the end of a field's value when keyboard navigation (Tab or
 * Shift+Tab) moves focus into it, while a pointer-initiated focus keeps its
 * natural caret. Attach the action to the form's container, never per field:
 * one listener pair covers every input and textarea the form renders, including
 * the ones created later.
 *
 * The caret write itself is the shared `useCaretAtEnd` hook, so the deferred
 * fix that leaves a deliberate selection alone is implemented once.
 */
export function caretAtEndOnKeyboardFocus(node: HTMLElement) {
  // A focus this soon after a pointer press came from that press. A window
  // instead of a flag cleared on the next task, because a tap or a slow press
  // focuses the field after `touchend`, in a later task than the pointerdown.
  const POINTER_FOCUS_WINDOW_MS = 600
  let lastPointerAt = Number.NEGATIVE_INFINITY
  let target: HTMLInputElement | HTMLTextAreaElement | null = null

  const caret = useCaretAtEnd({
    element: () => target,
    focused: () => target !== null && document.activeElement === target,
  })

  function onPointerDown() {
    lastPointerAt = Date.now()
  }

  function onFocusIn(event: FocusEvent) {
    if (Date.now() - lastPointerAt < POINTER_FOCUS_WINDOW_MS) return
    const element = event.target
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return
    if (element.disabled) return
    target = element
    caret.placeCaretAtEnd()
  }

  function onFocusOut(event: FocusEvent) {
    if (event.target === target) target = null
  }

  node.addEventListener('pointerdown', onPointerDown, true)
  node.addEventListener('focusin', onFocusIn)
  node.addEventListener('focusout', onFocusOut)

  return {
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown, true)
      node.removeEventListener('focusin', onFocusIn)
      node.removeEventListener('focusout', onFocusOut)
      caret.cancel()
    },
  }
}
