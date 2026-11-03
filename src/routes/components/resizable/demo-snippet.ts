// Show-code source for the Resizable demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The size is local
// $state in the snippet (seeded from scope) so the live instance is resizable,
// matching the static demo.

import { escapeAttr, textAttrLine, unescapeAttr } from '#showcase/playground/snippet-build.js'
import type { Staged } from '#showcase/playground/staged.js'

export const RESIZABLE_DEFAULT_WIDTH = 320
export const RESIZABLE_DEFAULT_HEIGHT = 240
export const RESIZABLE_CONTENT =
  'flex h-full w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300'
// Bounded scroll container: the demo row is flex, so without this the
// container would shrink to fit instead of overflowing, hiding the
// scrollbars. The max height keeps the demo compact on load; enlarging past
// either bound scrolls this wrapper instead of growing the page. `tabindex`
// keeps the non-interactive scroll wrapper out of the tab order, and the
// right/bottom padding plus stable gutter keep this wrapper's own scrollbars
// off the container's edge handles (a flush box otherwise puts the bottom
// handle under a horizontal scrollbar and the right handle under a vertical
// one). There is no left or top padding, so the container lines up with the
// settings panel below it and with the demo row above it.
export const RESIZABLE_SCROLLPORT = 'max-h-96 w-full overflow-auto pr-4 pb-4 [scrollbar-gutter:stable]'

export interface ResizableSnippetState {
  minWidth: Staged<string>
  minHeight: Staged<string>
  maxWidth: Staged<string>
  maxHeight: Staged<string>
  // The content div's class; the eye resets it to the default, so it always
  // renders and only the class varies.
  contentClass: Staged<string>
  className: Staged<string>
}

// A playground bound: empty or non-numeric text means unset, so the cleared
// form applies no overrides. The page parses with this same helper, so the
// static demo, Show-code, and live render stay in step.
export function parseBound(text: string): number | null {
  if (text.trim() === '') {
    return null
  }
  const parsed = Number(text)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

// A playground max bound: like parseBound, but the literal 'parent' caps the
// box to the parent's content box (ResizeBound). The page, builder, and sync
// share this shape so the Value column round-trips both forms.
export function parseMaxBound(text: string): number | 'parent' | null {
  if (text.trim() === 'parent') {
    return 'parent'
  }
  return parseBound(text)
}

// A staged minimum bound line: omitted while its eye is off, its text is
// empty, or it resolves to the component default (`0`).
function boundLine(name: string, pair: Staged<string>, def = ''): string[] {
  if (!pair.on || pair.value === '' || pair.value === def) {
    return []
  }
  const parsed = parseBound(pair.value)
  return parsed === null ? [] : [`  ${name}={${parsed}}`]
}

// A staged maximum bound line, keeping the `parent` keyword as a string.
function maxBoundLine(name: string, pair: Staged<string>): string[] {
  if (!pair.on || pair.value === '') {
    return []
  }
  const parsed = parseMaxBound(pair.value)
  if (parsed === null) return []
  return parsed === 'parent' ? [`  ${name}="parent"`] : [`  ${name}={${parsed}}`]
}

// Canonical content markup: the size-label div in a caller class; the class
// is the editable facet, the label reads from scope.
export function buildResizableChildrenMarkup(className: string): string {
  return `<div class="${escapeAttr(className || RESIZABLE_CONTENT)}">{contentLabel}</div>`
}

// Parse a content draft back to its class. Null unless it is exactly the
// canonical shape, so the dialog blocks OK instead of applying markup the row
// cannot reproduce.
export function parseResizableChildrenMarkup(draft: string): string | null {
  const match = draft.match(/^<div class="([^"]*)">\{contentLabel\}<\/div>$/)
  if (!match) {
    return null
  }
  return unescapeAttr(match[1] ?? '')
}

export function buildResizableSnippet({ minWidth, minHeight, maxWidth, maxHeight, contentClass, className }: ResizableSnippetState): string {
  return [
    '<script>',
    '  let width = $state(initialWidth)',
    '  let height = $state(initialHeight)',
    '</script>',
    `<div class="${RESIZABLE_SCROLLPORT}" tabindex="-1">`,
    '  <Resizable',
    '    width={width}',
    '    height={height}',
    '    onResize={(nextWidth, nextHeight) => { width = nextWidth; height = nextHeight; }}',
    // The minimum Values prefill the component default (`0`); the builder
    // omits the default so Show-code stays minimal.
    ...boundLine('minWidth', minWidth, '0').map(line => `  ${line}`),
    ...boundLine('minHeight', minHeight, '0').map(line => `  ${line}`),
    ...maxBoundLine('maxWidth', maxWidth).map(line => `  ${line}`),
    ...maxBoundLine('maxHeight', maxHeight).map(line => `  ${line}`),
    ...textAttrLine('className', className, '    '),
    '  >',
    `    <div class="${escapeAttr(contentClass.value || RESIZABLE_CONTENT)}">{contentLabel}</div>`,
    '  </Resizable>',
    '</div>',
  ].join('\n')
}
