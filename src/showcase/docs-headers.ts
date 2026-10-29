// Localized `FieldTable` header labels for ui-lib's own showcase pages. The
// shared `FieldTable` defaults to English literals so it carries no locale
// contract; pages spread this one-liner to keep the translated headers the
// old `PropsTable` rendered.
import type { getI18nContext } from '$lib/i18n.svelte'

export function docsHeaders(i18n: ReturnType<typeof getI18nContext>) {
  return {
    headers: {
      prop: i18n.t('showcase.prop'),
      type: i18n.t('showcase.type'),
      default: i18n.t('showcase.default'),
      value: i18n.t('showcase.value'),
      note: i18n.t('showcase.note'),
    },
  }
}
