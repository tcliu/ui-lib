import { readWebSettings, writeWebSetting } from '#appLib/state/web-settings.js'

// The component picker starts open on a fresh visit; the user's last choice
// persists in the shared web-settings object alongside the theme.
const DEFAULT_OPEN = true

function readOpen(): boolean {
  const stored = readWebSettings().showcasePickerOpen
  return typeof stored === 'boolean' ? stored : DEFAULT_OPEN
}

const initial = readOpen()
let open = $state<boolean>(initial)

export function getPickerOpen(): boolean {
  return open
}

export function setPickerOpen(next: boolean): void {
  open = next
  writeWebSetting('showcasePickerOpen', next)
}
