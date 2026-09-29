// Show-code source for the Resizable demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The size is local
// $state in the snippet (seeded from scope) so the live instance is resizable,
// matching the static demo.

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
  minWidth: string
  minHeight: string
  maxWidth: string
  maxHeight: string
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

function boundLine(name: string, text: string): string[] {
  const parsed = parseBound(text)
  return parsed === null ? [] : [`  ${name}={${parsed}}`]
}

export function buildResizableSnippet({ minWidth, minHeight, maxWidth, maxHeight }: ResizableSnippetState): string {
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
    ...boundLine('minWidth', minWidth).map(line => `  ${line}`),
    ...boundLine('minHeight', minHeight).map(line => `  ${line}`),
    ...boundLine('maxWidth', maxWidth).map(line => `  ${line}`),
    ...boundLine('maxHeight', maxHeight).map(line => `  ${line}`),
    '  >',
    `    <div class="${RESIZABLE_CONTENT}">{contentLabel}</div>`,
    '  </Resizable>',
    '</div>',
  ].join('\n')
}
