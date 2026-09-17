<script lang="ts">
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import { getI18nContext, LOCALES, type Locale } from '$lib/i18n.svelte'
  import { SHOWCASE_COMPONENTS } from '$lib/showcase-components'
  import { getTheme, setTheme, THEMES, type UiTheme } from '$lib/theme.svelte'

  const i18n = getI18nContext()

  function themeLabel(theme: UiTheme): string {
    return theme.charAt(0).toUpperCase() + theme.slice(1)
  }

  function localeLabel(code: Locale): string {
    return LOCALES.find(locale => locale.code === code)?.label ?? code
  }

  function handleThemeSelect(value: string) {
    const next = THEMES.find(theme => theme === value)
    if (next) {
      setTheme(next)
    }
  }

  function handleLocaleSelect(value: string) {
    const next = LOCALES.find(locale => locale.code === value)
    if (next) {
      i18n.setLocale(next.code)
    }
  }
</script>

<svelte:head>
  <title>{i18n.t('showcase.title')}</title>
</svelte:head>

<div class="flex h-dvh flex-col bg-slate-950 text-slate-100">
  <header class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-800 px-3 py-3 sm:px-4">
    <h1 class="text-base font-semibold tracking-tight sm:text-lg">{i18n.t('showcase.title')}</h1>
    <div class="flex items-center gap-2">
      <SelectDropdown
        buttonLabel={themeLabel(getTheme())}
        activeValue={getTheme()}
        ariaLabel={i18n.t('showcase.theme')}
        options={THEMES.map(theme => ({ value: theme, label: themeLabel(theme) }))}
        onSelect={handleThemeSelect} />
      <SelectDropdown
        buttonLabel={localeLabel(i18n.locale)}
        activeValue={i18n.locale}
        ariaLabel={i18n.t('showcase.language')}
        options={LOCALES.map(locale => ({ value: locale.code, label: locale.label }))}
        onSelect={handleLocaleSelect} />
    </div>
  </header>

  <main class="min-h-0 flex-1 overflow-y-auto" tabindex="-1">
    <div class="mx-auto w-full max-w-3xl px-4 py-6">
      <p class="mb-6 text-sm text-slate-400">{i18n.t('showcase.intro')}</p>
      <h2 class="mb-3 text-md font-semibold text-slate-100">{i18n.t('showcase.components')}</h2>
      <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {#each SHOWCASE_COMPONENTS as component (component.slug)}
          <li>
            <a
              href={`/components/${component.slug}`}
              class="block rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-200 outline-none transition hover:border-cyan-500 hover:text-cyan-300 focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/40 motion-reduce:transition-none">
              {component.name}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </main>
</div>
