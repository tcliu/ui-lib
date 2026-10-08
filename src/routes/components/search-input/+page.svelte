<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SearchInput from '$lib/components/SearchInput.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { extractComponentAttributes, extractScriptValue } from '$lib/showcase/snippet-attributes'
  import { splitLeadingScript } from '$lib/showcase/snippet-source'
  import { STYLED_INPUT, STYLED_WRAPPER, buildSearchInputSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  // Style is a preset that fills the wrapper/input class fields below.
  let pgQuery = $state('')
  let pgAriaLabel = $state('')
  let pgPlaceholder = $state('')
  let pgSize = $state('')
  let pgStyled = $state('')
  let pgWrapperClass = $state('')
  let pgInputClass = $state('')

  const styledOptions = [{ value: 'yes', label: 'Styled' }]
  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
  ]

  const demoAriaLabel = $derived(pgAriaLabel || i18n.t('common.apply'))
  const demoPlaceholder = $derived(pgPlaceholder || undefined)
  const demoSize = $derived(parseSizeValue(pgSize))
  const demoWrapperClass = $derived(pgWrapperClass || undefined)
  const demoInputClass = $derived(pgInputClass || undefined)

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      pgQuery = ''
    }
  }

  function clearPlayground() {
    pgQuery = ''
    pgAriaLabel = ''
    pgPlaceholder = ''
    pgSize = ''
    pgStyled = ''
    pgWrapperClass = ''
    pgInputClass = ''
  }

  const code = $derived.by(() =>
    buildSearchInputSnippet({
      ariaLabel: pgAriaLabel,
      query: pgQuery,
      placeholder: pgPlaceholder,
      size: pgSize,
      wrapperClass: pgWrapperClass,
      inputClass: pgInputClass,
    }),
  )

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ applyLabel: i18n.t('common.apply'), handleKeydown }),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Write a compiled snippet's recognized demo-tag attributes back into
  // playground state, so snippet edits show up in the Value column. Only
  // canonical shapes map (literals, and the `ariaLabel={applyLabel}` scope
  // ref); custom expressions are left alone, and a draft without a complete
  // demo tag (a free-form experiment) touches nothing. Absent means unset,
  // matching what the builder omits. `syncSeed` then holds the regenerated
  // seed back so the editor keeps the user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const attrs = extractComponentAttributes(source, 'SearchInput')
    if (!attrs) {
      return
    }
    // An `ariaLabel={applyLabel}` scope ref means unset, like absence.
    const aria = attrs.get('ariaLabel')
    if (!aria || (aria.kind === 'expression' && aria.value === 'applyLabel')) {
      pgAriaLabel = ''
    } else if (aria.kind === 'string') {
      pgAriaLabel = aria.value
    }
    const text = (name: string): string | undefined => {
      if (!attrs.has(name)) {
        return ''
      }
      const attr = attrs.get(name)!
      return attr.kind === 'string' ? attr.value : undefined
    }
    const applyText = (name: string, assign: (value: string) => void) => {
      const next = text(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    applyText('placeholder', value => (pgPlaceholder = value))
    applyText('size', value => (pgSize = value))
    applyText('wrapperClass', value => (pgWrapperClass = value))
    applyText('inputClass', value => (pgInputClass = value))
    // The builder seeds the query as script-local state; a hand-written
    // `query` binding the scope key instead leaves the playground alone.
    const scriptQuery = extractScriptValue(splitLeadingScript(source).declarations, 'query')
    if (scriptQuery !== null) {
      pgQuery = scriptQuery
    }
    preview.syncSeed()
  }

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // SelectDropdown's committed value.
  const props: PropRow[] = [
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.' },
    { name: 'inputClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the default input classes.' },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input.' },
    { name: 'placeholder', type: 'string', defaultValue: "'Search...'", note: 'Native placeholder.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | number", defaultValue: "'sm'", note: 'Box, text, and icon scale together; numbers are icon-scale pixels interpolated between the steps.' },
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable search text.' },
    { name: 'wrapperClass', type: 'string', defaultValue: "''", note: 'Extra classes for the outer wrapper.' },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'onfocus', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Focus callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback; Escape clears in this demo.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet codeIcon()}
  <CodeIcon size="sm" />
{/snippet}

{#snippet pageActions()}
  <Button
    variant="ghost"
    size="sm"
    icon={codeIcon}
    ariaLabel={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    ariaExpanded={preview.open}
    tooltip={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    onClick={() => preview.toggle()} />
{/snippet}

{#snippet propValue(row: PropRow)}
  {#if row.name === 'ariaLabel'}
    <TextInput bind:value={pgAriaLabel} ariaLabel="ariaLabel value" placeholder={i18n.t('common.apply')} />
  {:else if row.name === 'placeholder'}
    <TextInput bind:value={pgPlaceholder} ariaLabel="placeholder value" placeholder="Search..." />
  {:else if row.name === 'size'}
    <SelectDropdown
      buttonLabel={pgSize || 'Default'}
      activeValue={pgSize}
      ariaLabel="size value"
      options={sizeOptions}
      filterable
      allowCustomValue
      onSelect={value => (pgSize = value)}
      clearable
      clearLabel="Clear size"
      onClear={() => (pgSize = '')} />
  {:else if row.name === 'value'}
    <TextInput bind:value={pgQuery} ariaLabel="value value" placeholder="(empty)" />
  {:else if row.name === 'wrapperClass'}
    <TextInput bind:value={pgWrapperClass} ariaLabel="wrapperClass value" placeholder="(built-in)" />
  {:else if row.name === 'inputClass'}
    <TextInput bind:value={pgInputClass} ariaLabel="inputClass value" placeholder="(built-in)" />
  {:else}
    <span class="text-slate-500">—</span>
  {/if}
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} value={propValue} />
{/snippet}

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; the style
    preset below drives two props at once (a composite preset), so it stays
    here with Reset. -->
  <div class="flex flex-col gap-3">
    <Buttons className="flex shrink-0 flex-wrap items-center gap-3">
      <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
    </Buttons>
    <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
      <FormField label="Style">
        <SelectDropdown
          buttonLabel={pgStyled ? 'Styled' : 'Default'}
          activeValue={pgStyled}
          ariaLabel="Style"
          options={styledOptions}
          onSelect={value => {
            pgStyled = value
            pgWrapperClass = STYLED_WRAPPER
            pgInputClass = STYLED_INPUT
          }}
          clearable
          clearLabel="Clear style"
          onClear={() => {
            pgStyled = ''
            pgWrapperClass = ''
            pgInputClass = ''
          }} />
      </FormField>
    </div>
  </div>
{/snippet}

<ShowcasePage name="SearchInput" props={propsSnippet} actions={pageActions}>
  <ShowcaseSection
    title="SearchInput"
    {code}
    {preview}
    showHeader={false}
    bordered={false}
    footer={settingsPanel}
    scope={{ applyLabel: i18n.t('common.apply'), handleKeydown }}>
    <div class="flex flex-col gap-1">
      <SearchInput
        bind:value={pgQuery}
        ariaLabel={demoAriaLabel}
        onkeydown={handleKeydown}
        placeholder={demoPlaceholder}
        size={demoSize}
        wrapperClass={demoWrapperClass}
        inputClass={demoInputClass} />
      <span class="text-sm text-slate-400">value: {pgQuery || '—'}</span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
