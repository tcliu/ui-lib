// Per-side drawer controller for AppShell. Owns one pane's geometry, rail
// collapse, persistence, and floating-overlay focus moves so the component
// wires the left and right panes through the same implementation instead of
// mirroring the logic twice.
import { tick } from 'svelte'
import { clampPaneWidth, collapsesToRail, loadPaneSize, savePaneSize, type AppShellCollapseMode } from '$lib/app-shell'

export interface AppShellDrawerOptions {
  getOpen: () => boolean
  setOpen: (open: boolean) => void
  getSize: () => number
  setSize: (size: number) => void
  notifyOpenChange: (open: boolean) => void
  notifySizeChange: (size: number) => void
  notifyDragEnd: () => void
  collapseMode: () => AppShellCollapseMode
  railWidth: () => number
  min: () => number
  max: () => number
  defaultSize: () => number
  storageKey: () => string | undefined
  floating: () => boolean
  // Element to focus when this drawer closes; the caller points it at the
  // other open drawer or at the main column.
  focusFallback: () => HTMLElement | null
}

// Focus after Svelte flushes the state change that mounts/unmounts the pane.
function focusAfterTick(target: HTMLElement | null) {
  if (!target) {
    return
  }
  tick().then(() => target.focus({ preventScroll: true }))
}

export class AppShellDrawer {
  // Bound to the floating pane element so opening moves focus into it.
  asideEl = $state<HTMLElement | null>(null)
  private readonly options: AppShellDrawerOptions

  constructor(options: AppShellDrawerOptions) {
    this.options = options
  }

  get open() {
    return this.options.getOpen()
  }

  // Rail collapse only applies to a docked pane; a floating drawer is either
  // open above the content or closed.
  get visible() {
    return this.open || (this.options.collapseMode() === 'rail' && !this.options.floating())
  }

  get floatingOpen() {
    return this.options.floating() && this.open
  }

  get effectiveSize() {
    return this.open ? this.options.getSize() : this.options.railWidth()
  }

  get splitterMin() {
    return this.options.collapseMode() === 'rail' ? this.options.railWidth() : this.options.min()
  }

  restoreSize() {
    const loaded = loadPaneSize(
      this.options.storageKey(),
      this.options.defaultSize(),
      this.options.min(),
      this.options.max(),
    )
    if (loaded !== this.options.getSize()) {
      this.options.setSize(loaded)
    }
  }

  setOpen(next: boolean) {
    this.options.setOpen(next)
    this.options.notifyOpenChange(next)
    if (this.options.floating()) {
      focusAfterTick(next ? this.asideEl : this.options.focusFallback())
    }
  }

  changeSize(next: number) {
    const { collapseMode, railWidth, min, max, defaultSize } = this.options
    if (collapseMode() === 'rail' && collapsesToRail(next, railWidth())) {
      const size = defaultSize()
      this.options.setSize(size)
      this.options.notifySizeChange(size)
      this.setOpen(false)
      return
    }
    const size = clampPaneWidth(next, min(), max(), defaultSize())
    this.options.setSize(size)
    this.options.notifySizeChange(size)
  }

  save() {
    savePaneSize(this.options.storageKey(), this.options.getSize())
    this.options.notifyDragEnd()
  }
}
