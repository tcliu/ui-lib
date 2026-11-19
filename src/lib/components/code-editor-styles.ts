// The editor chrome the eager `CodeEditor` and the lazy `LazyCodeEditor` share.
// It lives in its own side-effect-free module so the lazy surface can import the
// defaults without importing `CodeEditor.svelte`, whose module graph pulls in
// all of CodeMirror: a value import there defeats the dynamic `import()` and
// puts the editor in the initial route bundle.

import type { SizeInput } from '#lib/size-scale.js'
import { dimensionMetrics } from './size-metrics'

export const CODE_EDITOR_CONTAINER_CLASS =
  'h-full overflow-hidden rounded-[var(--editor-frame-radius,0.5rem)] border border-slate-700 bg-slate-950'
export const CODE_EDITOR_CLASS = 'h-full'

// Editor text metrics on the shared size axis, calibrated so the default `md`
// reproduces the shipped chrome: a 14px (`0.875rem`) font, the content's
// 12/16/8px top-right-left padding (the left side is the line-number gutter),
// the 2px playback-mark radius, and the 8px frame radius of the shipped
// container class. No line ratio: the line box is the browser's `normal`
// relative to the font, so scaling the font scales it.
export const EDITOR_RATIOS = {
  font: 0.875,
  padY: 0.75,
  padX: 1,
  padLeft: 0.5,
  radius: 0.125,
  frameRadius: 0.5,
}

export type EditorMetrics = { [K in keyof typeof EDITOR_RATIOS]: number }

export function editorMetrics(size: SizeInput): EditorMetrics {
  return dimensionMetrics(size, EDITOR_RATIOS)
}
