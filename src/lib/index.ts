// parity: app-owned — the package entry, never vendored into an app
// The package's public API.
//
// The components and icons are imported by their own path
// (`@codepg/ui-lib/components/Button.svelte`), so this entry carries only the
// helpers a consumer needs to size its own controls and to give the shared
// components their labels — including a store for a component rendered outside
// the provider tree. The i18n store is re-exported here as well, so a consumer
// that keeps its own dictionary can merge it over the shared one.

export { LOCALES, createI18nStore, getI18nContext, setDefaultI18nStore, setI18nContext } from './i18n/store.svelte'
export type { I18nStore, Locale, MessageKey } from './i18n/store.svelte'

export { FONT_RATIO, ICON_RATIO, SIZE_ORDER, SIZE_PX, resolveFontPx } from './size-scale'
export type { SizeInput, SizeName } from './size-scale'

export { useColumnWidthStorage, type ColumnWidthStore } from './storage/column-width-storage'
export { createPersistStore, type PersistStore } from './storage/persist-storage'
