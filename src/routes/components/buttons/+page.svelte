<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  const props: PropRow[] = [
    { name: 'align', type: "'left' | 'center' | 'right'", defaultValue: "'left'", note: 'Horizontal alignment of the default row.' },
    { name: 'className', type: 'string', defaultValue: '—', note: 'Replaces the default layout classes (align is ignored).' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Buttons to lay out.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="Buttons" props={propsSnippet}>
  <ShowcaseSection title={i18n.t('showcase.default')}>
    <Buttons>
      <Button variant="primary">{i18n.t('common.ok')}</Button>
      <Button>{i18n.t('common.cancel')}</Button>
    </Buttons>
    <Buttons align="center">
      <Button variant="primary">{i18n.t('common.apply')}</Button>
      <Button>{i18n.t('common.reset')}</Button>
    </Buttons>
    <Buttons align="right">
      <Button variant="outline">{i18n.t('common.reload')}</Button>
      <Button variant="primary">{i18n.t('common.ok')}</Button>
    </Buttons>
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')}>
    <Buttons className="flex flex-col items-start gap-1">
      <Button variant="primary">{i18n.t('common.ok')}</Button>
      <Button>{i18n.t('common.cancel')}</Button>
    </Buttons>
  </ShowcaseSection>
</ShowcasePage>
