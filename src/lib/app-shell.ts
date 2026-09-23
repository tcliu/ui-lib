// Pane geometry + optional persistence for the shared AppShell layout.
//
// Union of the per-app pane helpers: drag-to-rail collapse with reset-to-default
// plus clamped load/save behind an optional storage key. Persistence is opt-in:
// without `storageKey` every function degrades to session-only defaults and
// never touches storage.

export const APP_SHELL_MIN_WIDTH = 160
export const APP_SHELL_MAX_WIDTH = 480
export const APP_SHELL_DEFAULT_WIDTH = 288
export const APP_SHELL_RAIL_WIDTH = 64

// Inline width (px) at which `auto` presentation docks the pane beside the
// content; below it the drawer floats above the content. Equals the 48rem
// desktop breakpoint at the 16px root size, but measured against the shell's
// own container so an embedded shell floats when *its* space is narrow.
export const APP_SHELL_DESKTOP_BREAKPOINT = 768

export type AppShellCollapseMode = 'hide' | 'rail'

// Drawer presentation. `auto` docks the pane inline beside the content while
// the shell container is wide enough and floats it above the content below the
// desktop breakpoint, so a narrow container never squeezes the pane and the
// page into each other; `docked` and `floating` pin one behavior at every
// width. Rail collapse is an in-flow affordance, so rail panes always dock.
export type AppShellDrawerMode = 'auto' | 'docked' | 'floating'

export function resolveDrawerFloating(mode: AppShellDrawerMode, desktopLayout: boolean): boolean {
  if (mode === 'floating') {
    return true
  }
  if (mode === 'docked') {
    return false
  }
  return !desktopLayout
}

export function clampPaneWidth(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return Math.min(max, Math.max(min, Math.round(value)))
}

// A rail-mode drag at or below the rail width collapses the pane instead of
// parking it at a narrow width.
export function collapsesToRail(next: number, railWidth: number): boolean {
  return next <= railWidth
}

export function loadPaneSize(storageKey: string | undefined, fallback: number, min: number, max: number): number {
  if (!storageKey || typeof localStorage === 'undefined') {
    return fallback
  }
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === null) {
      return fallback
    }
    return clampPaneWidth(Number.parseInt(raw, 10), min, max, fallback)
  } catch (error) {
    console.error('Failed to load pane width from localStorage', { error })
    return fallback
  }
}

export function savePaneSize(storageKey: string | undefined, value: number): void {
  if (!storageKey || typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.setItem(storageKey, String(Math.round(value)))
  } catch (error) {
    console.error('Failed to save pane width to localStorage', { error })
  }
}
