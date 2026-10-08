<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Checkbox from '$lib/components/Checkbox.svelte'
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
  import { buildTextInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgValue = $state('')
  let pgAriaLabel = $state('')
  let pgPlaceholder = $state('')
  let pgSize = $state('')
  let pgDisabled = $state<TriState>('')
  let pgReadonly = $state<TriState>('')
  let pgId = $state('')
  let pgInputClass = $state('')

  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
  ]

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoAriaLabel = $derived(pgAriaLabel || i18n.t('common.apply'))
  const demoSize = $derived(parseSizeValue(pgSize))
  const disabled = $derived(flagOn(pgDisabled))
  const readonly = $derived(flagOn(pgReadonly))

  function clearPlayground() {
    pgValue = ''
    pgAriaLabel = ''
    pgPlaceholder = ''
    pgSize = ''
    pgDisabled = ''
    pgReadonly = ''
    pgId = ''
    pgInputClass = ''
  }

  const code = $derived.by(() =>
    buildTextInputSnippet({
      ariaLabel: pgAriaLabel,
      value: pgValue,
      placeholder: pgPlaceholder,
      size: pgSize,
      disabled: pgDisabled,
      readonly: pgReadonly,
      inputClass: pgInputClass,
    }),
  )

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ applyLabel: i18n.t('common.apply') }),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Write a compiled snippet's recognized demo-tag attributes back into
  // playground state, so snippet edits show up in the Value column. Only
  // canonical shapes map (literals, bare flags, `{true}`/`{false}`, and the
  // `ariaLabel={applyLabel}` scope ref); custom expressions are left alone, and
  // a draft without a complete demo tag (a free-form experiment) touches
  // nothing. Absent means unset, matching what the builder omits. `syncSeed`
  // then holds the regenerated seed back so the editor keeps the user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const attrs = extractComponentAttributes(source, 'TextInput')
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
    const tri = (name: string): TriState | undefined => {
      if (!attrs.has(name)) {
        return ''
      }
      const attr = attrs.get(name)!
      if (attr.kind === 'bare') {
        return 'yes'
      }
      if (attr.kind === 'expression' && (attr.value === 'true' || attr.value === 'false')) {
        return attr.value === 'true' ? 'yes' : 'no'
      }
      return undefined
    }
    const applyText = (name: string, assign: (value: string) => void) => {
      const next = text(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    const applyTri = (name: string, assign: (value: TriState) => void) => {
      const next = tri(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    applyText('placeholder', value => (pgPlaceholder = value))
    applyText('size', value => (pgSize = value))
    applyText('inputClass', value => (pgInputClass = value))
    applyTri('disabled', value => (pgDisabled = value))
    applyTri('readonly', value => (pgReadonly = value))
    // The builder seeds the value as script-local state; a hand-written
    // `bind:value={...}` shape leaves the playground alone.
    const scriptValue = extractScriptValue(splitLeadingScript(source).declarations, 'value')
    if (scriptValue !== null) {
      pgValue = scriptValue
    }
    preview.syncSeed()
  }

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). The bound value edits through the Value column like the
  // SelectDropdown's committed value.
  const props: PropRow[] = [
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input.' },
    { name: 'id', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'inputClass', type: 'string', defaultValue: 'built-in', note: 'Replaces the default input classes.' },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input.' },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Native placeholder.' },
    { name: 'readonly', type: 'boolean', defaultValue: 'false', note: 'Read-only input.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | number", defaultValue: "'sm'", note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.' },
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value.' },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
    { name: 'onfocus', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Focus callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
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
    <TextInput bind:value={pgPlaceholder} ariaLabel="placeholder value" placeholder="(none)" />
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
    <TextInput bind:value={pgValue} ariaLabel="value value" placeholder="(empty)" />
  {:else if row.name === 'id'}
    <TextInput bind:value={pgId} ariaLabel="id value" placeholder="(none)" />
  {:else if row.name === 'inputClass'}
    <TextInput bind:value={pgInputClass} ariaLabel="inputClass value" placeholder="(built-in)" />
  {:else if row.name === 'disabled'}
    <Checkbox
      checked={disabled ?? false}
      ariaLabel="disabled value"
      onChange={value => (pgDisabled = value ? 'yes' : 'no')} />
  {:else if row.name === 'readonly'}
    <Checkbox
      checked={readonly ?? false}
      ariaLabel="readonly value"
      onChange={value => (pgReadonly = value ? 'yes' : 'no')} />
  {:else}
    <span class="text-slate-500">—</span>
  {/if}
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} value={propValue} />
{/snippet}

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; this panel
    keeps only Reset (and any future composite preset that drives several props
    at once). -->
  <Buttons className="flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
  </Buttons>
{/snippet}

<ShowcasePage name="TextInput" props={propsSnippet} actions={pageActions}>
  <ShowcaseSection
    title="TextInput"
    {code}
    {preview}
    showHeader={false}
    bordered={false}
    footer={settingsPanel}
    scope={{ applyLabel: i18n.t('common.apply') }}>
    <div class="flex flex-col gap-1">
      <TextInput
        bind:value={pgValue}
        ariaLabel={demoAriaLabel}
        placeholder={pgPlaceholder || undefined}
        size={demoSize}
        {disabled}
        {readonly}
        id={pgId || undefined}
        inputClass={pgInputClass || undefined} />
      <span class="text-sm text-slate-400">value: {pgValue || '—'}</span>
    </div>
  </ShowcaseSection>
</ShowcasePage>
