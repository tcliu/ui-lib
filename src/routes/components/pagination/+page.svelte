<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import Pagination from '$lib/components/Pagination.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { STYLED_CLASS, buildPaginationSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  const total = 200

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgPageSize = $state(10)
  let pgCurrentPage = $state(3)
  let pgSize = $state('')
  let pgCustomOptions = $state('')
  let pgCustomLabels = $state('')
  let pgStyled = $state('')
  let pgClassName = $state('')

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
  ]
  const customOptions = [{ value: 'yes', label: 'Custom' }]
  const customLabels = [{ value: 'yes', label: 'Custom' }]
  const styledOptions = [{ value: 'yes', label: 'Styled' }]

  const demoSize = $derived((pgSize || undefined) as 'xs' | 'sm' | 'md' | 'lg' | undefined)
  const demoPageSizeOptions = $derived(pgCustomOptions ? [5, 10, 25, 100] : undefined)
  const demoClassName = $derived(pgClassName || undefined)

  function handlePageSizeChange(size: number) {
    pgPageSize = size
    pgCurrentPage = 1
  }

  const isCustomized = $derived(
    pgSize !== '' || pgCustomOptions !== '' || pgCustomLabels !== '' || pgStyled !== '' || pgClassName !== '',
  )
  const sectionTitle = $derived(isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default'))

  function clearPlayground() {
    pgPageSize = 10
    pgCurrentPage = 3
    pgSize = ''
    pgCustomOptions = ''
    pgCustomLabels = ''
    pgStyled = ''
    pgClassName = ''
  }

  const code = $derived.by(() =>
    buildPaginationSnippet({
      size: pgSize,
      customOptions: pgCustomOptions,
      customLabels: pgCustomLabels,
      className: pgClassName,
    }),
  )

  const props: PropRow[] = [
    { name: 'total', type: 'number', defaultValue: '—', note: 'Total item count.' },
    { name: 'pageSize', type: 'number', defaultValue: '—', note: 'Items per page.' },
    { name: 'currentPage', type: 'number', defaultValue: '—', note: 'Active page (1-based).' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'sm'", note: 'Control scale.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the nav.' },
    { name: 'pageSizeOptions', type: 'number[]', defaultValue: '[10, 20, 50]', note: 'Page-size choices.' },
    { name: 'onPageChange', type: '(page: number) => void', defaultValue: '—', note: 'Called on page change.' },
    {
      name: 'onPageSizeChange',
      type: '(size: number) => void',
      defaultValue: '—',
      note: 'Called on page-size change.',
    },
    { name: 'previousLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the previous arrow.' },
    { name: 'nextLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the next arrow.' },
    { name: 'pageSizeLabel', type: 'string', defaultValue: 'locale', note: 'Label beside the page-size select.' },
    {
      name: 'currentPageLabel',
      type: 'string',
      defaultValue: 'locale',
      note: 'Accessible name for the page jump input.',
    },
    { name: 'paginationLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the nav.' },
    { name: 'trailing', type: 'Snippet', defaultValue: '—', note: 'Arbitrary content pinned to the row’s right edge.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Size">
      <SelectDropdown
        buttonLabel={pgSize || 'Default'}
        activeValue={pgSize}
        ariaLabel="Size"
        options={sizeOptions}
        onSelect={value => (pgSize = value)}
        clearable
        clearLabel="Clear size"
        onClear={() => (pgSize = '')} />
    </FormField>
    <FormField label="Page-size options">
      <SelectDropdown
        buttonLabel={pgCustomOptions ? 'Custom' : 'Default'}
        activeValue={pgCustomOptions}
        ariaLabel="Page-size options"
        options={customOptions}
        onSelect={value => (pgCustomOptions = value)}
        clearable
        clearLabel="Clear page-size options"
        onClear={() => (pgCustomOptions = '')} />
    </FormField>
    <FormField label="Labels">
      <SelectDropdown
        buttonLabel={pgCustomLabels ? 'Custom' : 'Default'}
        activeValue={pgCustomLabels}
        ariaLabel="Labels"
        options={customLabels}
        onSelect={value => (pgCustomLabels = value)}
        clearable
        clearLabel="Clear labels"
        onClear={() => (pgCustomLabels = '')} />
    </FormField>
    <FormField label="Style">
      <SelectDropdown
        buttonLabel={pgStyled ? 'Styled' : 'Default'}
        activeValue={pgStyled}
        ariaLabel="Style"
        options={styledOptions}
        onSelect={value => {
          pgStyled = value
          pgClassName = STYLED_CLASS
        }}
        clearable
        clearLabel="Clear style"
        onClear={() => {
          pgStyled = ''
          pgClassName = ''
        }} />
    </FormField>
    <FormField label="Class name" htmlFor="pg-classname">
      <input
        id="pg-classname"
        bind:value={pgClassName}
        placeholder="(none)"
        class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus-visible:border-cyan-500 motion-reduce:transition-none" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="Pagination" props={propsSnippet}>
  <ShowcaseSection
    title={sectionTitle}
    {code}
    footer={settingsPanel}
    scope={{ pageSize: pgPageSize, currentPage: pgCurrentPage, handlePageSizeChange }}>
    <Pagination
      {total}
      pageSize={pgPageSize}
      currentPage={pgCurrentPage}
      size={demoSize}
      pageSizeOptions={demoPageSizeOptions}
      previousLabel={pgCustomLabels ? 'Go back' : undefined}
      nextLabel={pgCustomLabels ? 'Go forward' : undefined}
      pageSizeLabel={pgCustomLabels ? 'Rows' : undefined}
      currentPageLabel={pgCustomLabels ? 'Page number' : undefined}
      paginationLabel={pgCustomLabels ? 'Results' : undefined}
      className={demoClassName}
      onPageChange={page => (pgCurrentPage = page)}
      onPageSizeChange={handlePageSizeChange} />
  </ShowcaseSection>
</ShowcasePage>
