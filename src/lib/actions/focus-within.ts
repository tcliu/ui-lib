// Whether focus currently sits inside `node`. A shared control may not traverse
// the DOM itself, so this is the one sanctioned read of the active element: the
// caller decides what focus inside one of its owned nodes means (here, that a
// re-anchor may hand focus back to a day cell).
export function isFocusWithin(node: HTMLElement | null): boolean {
  return !!node && node.contains(document.activeElement)
}
