import { handleListboxNavKey, type ListboxMove } from './listbox-keynav'

/**
 * What a text-entry combobox's entry gestures need: the caller keeps its own
 * open state, filtering, and commit, so it supplies the operations here.
 */
export interface ComboboxEntryConfig {
  isOpen: () => boolean
  openPanel: () => void
  /** Move (and reveal) the active row, i.e. `listbox.moveHighlight`. */
  move: (direction: ListboxMove) => void
  /** Visible row count, for the Home/End and open-at-last keys. */
  count: () => number
  /** The field's own input work: sync its value or report its query. */
  onInput?: () => void
  /** An arrow, Home, or End moved the active row: the caller may track it. */
  onNavigate?: () => void
}

export interface ComboboxEntry {
  /** Focus opens the panel. */
  handleFocus(): void
  /** A click reopens it too: an already-focused input fires no new `focus`. */
  handleClick(): void
  /** Run the field's input work, then reopen a dismissed panel. */
  handleInput(): void
  /** True when the key drove the listbox; the caller keeps the other keys. */
  handleKeydown(event: KeyboardEvent): boolean
}

/**
 * The entry gestures a text-entry combobox shares (`AutoComplete`, `TagInput`):
 * focusing, clicking, or typing reopens a panel the user dismissed, and the
 * arrow/Home/End keys drive the listbox through the shared navigation handler.
 * The caller keeps its own filtering and commit, so Enter stays per surface — an
 * autocomplete accepts the active row, a tag field commits its draft — and
 * dismissal stays with `useListbox`'s `onEscape`, which closes the panel while
 * keeping focus and the text.
 */
export function createComboboxEntry(config: ComboboxEntryConfig): ComboboxEntry {
  function reopen(): void {
    if (!config.isOpen()) config.openPanel()
  }

  return {
    handleFocus: reopen,
    handleClick: reopen,
    handleInput() {
      // The field's own work runs first so the panel opens on the fresh query.
      config.onInput?.()
      reopen()
    },
    handleKeydown(event) {
      return handleListboxNavKey(event, {
        isOpen: config.isOpen,
        openPanel: config.openPanel,
        move: config.move,
        count: config.count,
        onNavigate: config.onNavigate,
      })
    },
  }
}
