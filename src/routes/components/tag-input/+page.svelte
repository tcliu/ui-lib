<script lang="ts">
  import TagInput from '$lib/components/TagInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  let value = $state(['svelte', 'kit'])
  let colored = $state(['svelte'])

  const availableTags = ['svelte', 'kit', 'icons', 'forms', 'tables']

  function colorFor(tag: string): string {
    return tag === 'svelte' ? 'border-orange-700 bg-orange-950/50 text-orange-200' : 'border-slate-600 bg-slate-800 text-slate-200'
  }

  const codeDefault = `<TagInput
  value={value}
  availableTags={availableTags}
  placeholder="Add a tag"
  onChange={next => (value = next)} />
<span class="text-sm text-slate-400">tags: {value.join(', ')}</span>`

  const codeCustomized = `<TagInput
  value={colored}
  availableTags={availableTags}
  placeholder="Add a tag"
  chipClassFor={colorFor}
  onChange={next => (colored = next)} />`

  const props: PropRow[] = [
    { name: 'value', type: 'string[]', defaultValue: '[]', note: 'Selected tags.' },
    { name: 'availableTags', type: 'string[]', defaultValue: '[]', note: 'Suggestions offered while typing.' },
    { name: 'onChange', type: '(next: string[]) => void', defaultValue: '—', note: 'Called with the new tag list.' },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Placeholder text.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input.' },
    { name: 'inputId', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'chipClass', type: 'string', defaultValue: 'built-in', note: 'Base classes for every chip.' },
    { name: 'chipClassFor', type: '(tag: string) => string', defaultValue: '—', note: 'Per-tag chip classes; wins over chipClass.' },
    { name: 'chip', type: 'Snippet<[tag, remove]>', defaultValue: '—', note: 'Custom chip renderer.' },
    { name: 'option', type: 'Snippet<[tag]>', defaultValue: '—', note: 'Custom suggestion renderer.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="TagInput" props={propsSnippet}>
  <ShowcaseSection
    title={i18n.t('showcase.default')}
    code={codeDefault}
    scope={{ value, availableTags }}>
    <TagInput
      value={value}
      availableTags={availableTags}
      placeholder="Add a tag"
      onChange={next => (value = next)} />
    <span class="text-sm text-slate-400">tags: {value.join(', ')}</span>
  </ShowcaseSection>

  <ShowcaseSection
    title={i18n.t('showcase.customized')}
    code={codeCustomized}
    scope={{ colored, availableTags, colorFor }}>
    <TagInput
      value={colored}
      availableTags={availableTags}
      placeholder="Add a tag"
      chipClassFor={colorFor}
      onChange={next => (colored = next)} />
  </ShowcaseSection>
</ShowcasePage>
