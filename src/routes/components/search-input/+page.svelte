<script lang="ts">
  import SearchInput from '$lib/components/SearchInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  let query = $state('')
  let custom = $state('')
  let inputEl = $state<HTMLInputElement | null>(null)
  let lastKey = $state('—')

  function handleKeydown(event: KeyboardEvent) {
    lastKey = event.key
    if (event.key === 'Escape') {
      query = ''
    }
  }

  const code = `<SearchInput
  bind:value={query}
  ariaLabel="Search"
  placeholder="Filter sessions"
  onkeydown={handleKeydown} />`

  const props: PropRow[] = [
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable search text.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.' },
    { name: 'placeholder', type: 'string', defaultValue: "'Search...'", note: 'Native placeholder.' },
    { name: 'wrapperClass', type: 'string', defaultValue: "''", note: 'Extra classes for the outer wrapper.' },
    { name: 'inputClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the default input classes.' },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback; Escape clears in this demo.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="SearchInput" props={propsSnippet} {code}>
  <ShowcaseSection title={i18n.t('showcase.default')}>
    <div class="flex flex-col gap-1">
      <SearchInput bind:value={query} ariaLabel={i18n.t('common.apply')} onkeydown={handleKeydown} />
      <span class="text-sm text-slate-400">value: {query || '—'}</span>
    </div>
    <SearchInput bind:value={custom} placeholder="Filter sessions" ariaLabel={i18n.t('common.reload')} />
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')}>
    <SearchInput
      bind:value={custom}
      bind:inputRef={inputEl}
      oninput={() => (lastKey = 'input')}
      ariaLabel={i18n.t('common.reset')}
      wrapperClass="rounded-lg border border-cyan-500/40 p-2"
      inputClass="w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 pl-7 text-sm text-cyan-200 outline-none focus-visible:border-cyan-500" />
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.state')}>
    <p class="text-sm text-slate-400">lastKey: {lastKey}</p>
    <p class="text-sm text-slate-400">inputRef: {inputEl ? inputEl.type : '—'}</p>
  </ShowcaseSection>
</ShowcasePage>
