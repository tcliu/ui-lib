<script lang="ts">
  import { getI18nContext } from '$lib/i18n.svelte'
  import { SHOWCASE_COMPONENTS } from './showcase-components'

  const i18n = getI18nContext()
  const firstSlug = SHOWCASE_COMPONENTS[0]?.slug ?? 'base-dialog'
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6">
  <h2 class="text-base font-semibold tracking-tight sm:text-lg">{i18n.t('showcase.notFoundTitle')}</h2>
  <p class="text-sm text-slate-400">{i18n.t('showcase.notFoundBody')}</p>
  <a
    href={`/components/${firstSlug}`}
    class="w-fit rounded-md px-3 py-2 text-sm text-cyan-200 transition outline-none hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-500/40 motion-reduce:transition-none">
    {i18n.t('showcase.backToIndex')}
  </a>
</div>
