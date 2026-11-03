import type { MenuItemState } from '#lib/components/Menu.svelte'

// Shared radio-item row styling for the chrome's theme/language menus: the same
// row chrome, differing only in whether the option is the currently selected
// one. `current` marks the committed choice when no row is being highlighted.
export function menuRadioItemClass(state: MenuItemState, current: boolean): string {
  return `flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm outline-none transition-none ${
    state.disabled
      ? 'cursor-not-allowed text-slate-600'
      : state.active
        ? 'bg-slate-800 text-cyan-200'
        : current
          ? 'text-cyan-200'
          : 'text-slate-300'
  }`
}
