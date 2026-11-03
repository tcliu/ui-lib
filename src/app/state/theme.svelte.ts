import { browser } from '$app/env'
import { readWebSettings, writeWebSetting } from './web-settings'

// UI themes. Dark is the default palette (no data-theme attribute); every other
// theme opts in through `data-theme`, matching the palettes in `src/lib/styles.css`
// and the pre-paint script in `src/app.html`.
export type UiTheme =
  'dark' | 'light' | 'ember' | 'sepia' | 'nebula' | 'sky' | 'forest' | 'midnight' | 'mint' | 'lavender'

export const THEMES: UiTheme[] = [
  'dark',
  'light',
  'ember',
  'sepia',
  'nebula',
  'sky',
  'forest',
  'midnight',
  'mint',
  'lavender',
]

function isUiTheme(value: unknown): value is UiTheme {
  return typeof value === 'string' && (THEMES as string[]).includes(value)
}

function read(): UiTheme {
  const stored = readWebSettings().theme
  return isUiTheme(stored) ? stored : 'dark'
}

const initial = read()
let current = $state<UiTheme>(initial)

function apply(theme: UiTheme) {
  if (!browser) return
  if (theme === 'dark') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = theme
  }
}

apply(initial)

export function getTheme(): UiTheme {
  return current
}

export function setTheme(next: UiTheme): void {
  current = next
  writeWebSetting('theme', next)
  apply(next)
}
