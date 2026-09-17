import { browser } from '$app/environment';
import { getContext, hasContext, setContext } from 'svelte';
import { en, type MessageKey } from './locales/en';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';

export type Locale = 'en' | 'zh-CN' | 'zh-TW';

const STORAGE_KEY = 'ui-lib-locale';

// One translation file per locale. `en` defines the key set and every other
// locale is typed `Record<MessageKey, string>`, so a missing key fails the build.
const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

// Switcher entries; every locale is labelled in its own language.
export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
];

const CONTEXT_KEY = Symbol('ui-lib-i18n');

export interface I18nStore<L extends string = Locale> {
  readonly locale: L;
  setLocale(next: L): void;
  t(key: MessageKey, params?: Record<string, string | number>): string;
}

export function readStoredLocale<L extends string>(
  dictionaries: Record<L, Record<MessageKey, string>>,
  defaultLocale: L,
  storageKey: string,
): L {
  if (!browser) return defaultLocale;
  try {
    const saved = localStorage.getItem(storageKey);
    return saved && saved in dictionaries ? (saved as L) : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

// One store per app instance, created by the root layout. The locale lives in a
// rune so `t()` re-renders its readers; module scope would share one locale
// across concurrent SSR requests.
export function createI18nStore<L extends string>(
  dictionaries: Record<L, Record<MessageKey, string>>,
  defaultLocale: L,
  storageKey: string,
): I18nStore<L> {
  const initial = readStoredLocale(dictionaries, defaultLocale, storageKey);
  let locale = $state<L>(initial);

  // Keep the document language in step so hyphenation, spelling, and screen
  // readers match the rendered text (the static shell sets it pre-paint too).
  if (browser) document.documentElement.lang = initial;

  function apply(next: L) {
    if (browser) document.documentElement.lang = next;
  }

  return {
    get locale() {
      return locale;
    },
    setLocale(next: L) {
      locale = next;
      if (!browser) return;
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // storage unavailable: the in-memory locale still applies this session
      }
      apply(next);
    },
    // Interpolate `{name}` placeholders. Fall back to the source locale, then the
    // key, so a missing translation never renders empty.
    t(key, params) {
      let text = dictionaries[locale][key] ?? dictionaries[defaultLocale][key] ?? key;
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
  };
}

// The app-shaped factory, so the layout does not repeat the dictionary map.
export function createAppI18n(): I18nStore {
  return createI18nStore(DICTIONARIES, 'en', STORAGE_KEY);
}

export function setI18nContext(store: I18nStore): void {
  setContext(CONTEXT_KEY, store);
}

let defaultStore: I18nStore | null = null;

export function getI18nContext(): I18nStore {
  if (hasContext(CONTEXT_KEY)) {
    return getContext<I18nStore>(CONTEXT_KEY);
  }
  // Islands mounted outside the layout tree have no provider; fall back to a
  // default English store so primitives still render. App code under the
  // layout always hits the provider above: warn in dev so a provider-less
  // component fails loudly instead of silently staying English.
  if (import.meta.env.DEV) {
    console.warn('getI18nContext: no i18n provider above; using the default English store');
  }
  if (!defaultStore) {
    defaultStore = createAppI18n();
  }
  return defaultStore;
}

export type { MessageKey };
