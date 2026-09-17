<script lang="ts">
  import Pagination from '$lib/components/Pagination.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  const total = 200
  const sizes = ['xs', 'sm', 'md', 'lg'] as const
  let pageSize = $state(10)
  let currentPage = $state(3)

  function handlePageSizeChange(size: number) {
    pageSize = size
    currentPage = 1
  }

  const codeDefault = `<Pagination
  total={200}
  pageSize={pageSize}
  currentPage={currentPage}
  onPageChange={page => (currentPage = page)}
  onPageSizeChange={handlePageSizeChange} />`

  const codeCustomized = `{#each sizes as size (size)}
  <Pagination
    {total}
    {pageSize}
    {currentPage}
    {size}
    onPageChange={page => (currentPage = page)}
    onPageSizeChange={next => (pageSize = next)} />
{/each}
<Pagination
  total={200}
  pageSize={pageSize}
  currentPage={currentPage}
  pageSizeOptions={[5, 10, 25, 100]}
  previousLabel="Go back"
  nextLabel="Go forward"
  pageSizeLabel="Rows"
  currentPageLabel="Page number"
  paginationLabel="Results"
  className="rounded-lg border border-cyan-500/40 p-2"
  onPageChange={page => (currentPage = page)}
  onPageSizeChange={next => (pageSize = next)} />`

  const codeState = `<p class="text-sm text-slate-400">page: {currentPage}, size: {pageSize}</p>`

  const props: PropRow[] = [
    { name: 'total', type: 'number', defaultValue: '—', note: 'Total item count.' },
    { name: 'pageSize', type: 'number', defaultValue: '—', note: 'Items per page.' },
    { name: 'currentPage', type: 'number', defaultValue: '—', note: 'Active page (1-based).' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'sm'", note: 'Control scale.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the nav.' },
    { name: 'pageSizeOptions', type: 'number[]', defaultValue: '[10, 20, 50]', note: 'Page-size choices.' },
    { name: 'onPageChange', type: '(page: number) => void', defaultValue: '—', note: 'Called on page change.' },
    { name: 'onPageSizeChange', type: '(size: number) => void', defaultValue: '—', note: 'Called on page-size change.' },
    { name: 'previousLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the previous arrow.' },
    { name: 'nextLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the next arrow.' },
    { name: 'pageSizeLabel', type: 'string', defaultValue: 'locale', note: 'Label beside the page-size select.' },
    { name: 'currentPageLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the page jump input.' },
    { name: 'paginationLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the nav.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="Pagination" props={propsSnippet}>
  <ShowcaseSection
    title={i18n.t('showcase.default')}
    code={codeDefault}
    scope={{ pageSize, currentPage, handlePageSizeChange }}>
    <Pagination
      {total}
      {pageSize}
      {currentPage}
      onPageChange={page => (currentPage = page)}
      onPageSizeChange={handlePageSizeChange} />
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')} code={codeCustomized} scope={{ total, sizes, pageSize, currentPage }}>
    {#each sizes as size (size)}
      <Pagination
        {total}
        {pageSize}
        {currentPage}
        {size}
        onPageChange={page => (currentPage = page)}
        onPageSizeChange={next => (pageSize = next)} />
    {/each}
    <Pagination
      {total}
      {pageSize}
      {currentPage}
      pageSizeOptions={[5, 10, 25, 100]}
      previousLabel="Go back"
      nextLabel="Go forward"
      pageSizeLabel="Rows"
      currentPageLabel="Page number"
      paginationLabel="Results"
      className="rounded-lg border border-cyan-500/40 p-2"
      onPageChange={page => (currentPage = page)}
      onPageSizeChange={next => (pageSize = next)} />
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.state')} code={codeState} scope={{ currentPage, pageSize }}>
    <p class="text-sm text-slate-400">page: {currentPage}, size: {pageSize}</p>
  </ShowcaseSection>
</ShowcasePage>
