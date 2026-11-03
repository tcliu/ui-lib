import { browser } from '$app/env'

// Persisted web settings key, read by the pre-paint script in `src/app.html`.
// Preferences (theme, picker visibility) are fields of one JSON object so
// future settings share the entry.
export const WEB_SETTINGS_KEY = 'ui-lib:web-settings'

export function readWebSettings(): Record<string, unknown> {
  if (!browser) {
    return {}
  }
  try {
    const raw = localStorage.getItem(WEB_SETTINGS_KEY)
    if (!raw) {
      return {}
    }
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function writeWebSetting(key: string, value: unknown): void {
  if (!browser) return
  try {
    const settings = readWebSettings()
    settings[key] = value
    localStorage.setItem(WEB_SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // storage full/unavailable: the in-memory value still applies this session
  }
}
