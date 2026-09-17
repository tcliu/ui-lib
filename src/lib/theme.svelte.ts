import { browser } from '$app/environment';

// UI themes. Dark is the default palette (no data-theme attribute); every other
// theme opts in through `data-theme`, matching the palettes in `src/styles.css`
// and the pre-paint script in `src/app.html`.
export type UiTheme =
  | 'dark'
  | 'light'
  | 'ember'
  | 'sepia'
  | 'nebula'
  | 'sky'
  | 'forest'
  | 'midnight'
  | 'mint'
  | 'lavender';

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
  'lavender'
];

// Persisted web settings key, read by the pre-paint script in `src/app.html`.
// The theme is one field of a JSON object so future settings share the entry.
const KEY = 'ui-lib:web-settings';

function isUiTheme(value: unknown): value is UiTheme {
  return typeof value === 'string' && (THEMES as string[]).includes(value);
}

function readSettings(): Record<string, unknown> {
  if (!browser) {
    return {};
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function read(): UiTheme {
  const stored = readSettings().theme;
  return isUiTheme(stored) ? stored : 'dark';
}

const initial = read();
let current = $state<UiTheme>(initial);

function apply(theme: UiTheme) {
  if (!browser) return;
  if (theme === 'dark') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

apply(initial);

export function getTheme(): UiTheme {
  return current;
}

export function setTheme(next: UiTheme): void {
  current = next;
  if (!browser) return;
  try {
    const settings = readSettings();
    settings.theme = next;
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // storage full/unavailable: the in-memory theme still applies this session
  }
  apply(next);
}
