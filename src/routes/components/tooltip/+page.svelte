<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Tooltip from '$lib/components/Tooltip.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  let explicitTrigger = $state<HTMLButtonElement | null>(null)

  const code = `<Button bind:buttonEl={trigger}>Apply</Button>
<Tooltip trigger={trigger}>Apply</Tooltip>`

  const props: PropRow[] = [
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Tooltip text/content.' },
    { name: 'align', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Horizontal alignment to the trigger.' },
    { name: 'class', type: 'string', defaultValue: "''", note: 'Extra classes for the tooltip box.' },
    { name: 'trigger', type: 'HTMLElement | null', defaultValue: 'null', note: 'Explicit trigger; falls back to the anchor parent.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="Tooltip" props={propsSnippet} {code}>
  <ShowcaseSection title={i18n.t('showcase.default')}>
    <Button bind:buttonEl={explicitTrigger}>{i18n.t('common.apply')}</Button>
    <Tooltip trigger={explicitTrigger}>{i18n.t('common.apply')}</Tooltip>
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')}>
    <span class="relative inline-flex">
      <Button>{i18n.t('common.ok')}</Button>
      <Tooltip align="left">{i18n.t('common.ok')}</Tooltip>
    </span>
    <span class="relative inline-flex">
      <Button>{i18n.t('common.cancel')}</Button>
      <Tooltip align="right" class="border-cyan-500/40 text-cyan-200">{i18n.t('common.cancel')}</Tooltip>
    </span>
  </ShowcaseSection>
</ShowcasePage>
