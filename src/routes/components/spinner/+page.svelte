<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  const props: PropRow[] = [
    { name: 'className', type: 'string', defaultValue: "'h-4 w-4'", note: 'Size and color classes for the SVG.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="Spinner" props={propsSnippet}>
  <ShowcaseSection title={i18n.t('showcase.default')}>
    <Spinner />
    <span class="inline-flex items-center gap-2 text-sm text-slate-300">
      <Spinner /> {i18n.t('common.reload')}
    </span>
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')}>
    <Spinner className="h-6 w-6" />
    <Spinner className="h-8 w-8 text-cyan-400" />
    <Spinner className="h-10 w-10 text-amber-400" />
  </ShowcaseSection>
</ShowcasePage>
