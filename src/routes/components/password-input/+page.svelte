<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Checkbox from '$lib/components/Checkbox.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PasswordInput from '$lib/components/PasswordInput.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { extractComponentAttributes, extractScriptValue } from '$lib/showcase/snippet-attributes'
  import { splitLeadingScript } from '$lib/showcase/snippet-source'
  import { buildPasswordInputSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts unset (the component
  // default renders), so the cleared form applies no overrides.
  let pgValue = $state('')
  let pgPlaceholder = $state('')
  let pgShowLabel = $state('')
  let pgHideLabel = $state('')
  let pgDisabled = $state<TriState>('')
  let pgRequired = $state<TriState>('')
  let pgClassName = $state('')

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const disabled = $derived(flagOn(pgDisabled))
  const required = $derived(flagOn(pgRequired))

  function clearPlayground() {
    pgValue = ''
    pgPlaceholder = ''
    pgShowLabel = ''
    pgHideLabel = ''
    pgDisabled = ''
    pgRequired = ''
    pgClassName = ''
  }

  const code = $derived.by(() =>
    buildPasswordInputSnippet({
      value: pgValue,
      placeholder: pgPlaceholder,
      showLabel: pgShowLabel,
      hideLabel: pgHideLabel,
      disabled: pgDisabled,
      required: pgRequired,
      className: pgClassName,
    }),
  )

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({}),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Write a compiled snippet's recognized demo-tag attributes back into
  // playground state, so snippet edits show up in the Value column. Only
  // canonical shapes map (literals, bare flags, `{true}`/`{false}`); custom
  // expressions are left alone, and a draft without a complete demo tag (a
  // free-form experiment) touches nothing. Absent means unset, matching what
  // the builder omits. `syncSeed` then holds the regenerated seed back so the
  // editor keeps the user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const attrs = extractComponentAttributes(source, 'PasswordInput')
    if (!attrs) {
      return
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
    applyText('showLabel', value => (pgShowLabel = value))
    applyText('hideLabel', value => (pgHideLabel = value))
    applyText('className', value => (pgClassName = value))
    applyTri('disabled', value => (pgDisabled = value))
    applyTri('required', value => (pgRequired = value))
    // The builder seeds the value as script-local state; a hand-written
    // `bind:value={...}` shape leaves the playground alone.
    const scriptValue = extractScriptValue(splitLeadingScript(source).declarations, 'value')
    if (scriptValue !== null) {
      pgValue = scriptValue
    }
    preview.syncSeed()
  }

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z).
  const props: PropRow[] = [
    { name: 'autocomplete', type: 'string', defaultValue: "'current-password'", note: 'Native autocomplete token.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the input.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the field and the toggle.' },
    { name: 'hideLabel', type: 'string', defaultValue: '—', note: 'Toggle label when visible; falls back to the locale.' },
    { name: 'id', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'name', type: 'string', defaultValue: '—', note: 'Native input name.' },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Placeholder text.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', note: 'Native required flag.' },
    { name: 'showLabel', type: 'string', defaultValue: '—', note: 'Toggle label when hidden; falls back to the locale.' },
    { name: 'value', type: 'string', defaultValue: "''", note: 'Bindable field value.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Native input handler.' },
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
  {#if row.name === 'value'}
    <TextInput bind:value={pgValue} ariaLabel="value value" placeholder="(empty)" />
  {:else if row.name === 'placeholder'}
    <TextInput bind:value={pgPlaceholder} ariaLabel="placeholder value" placeholder="Password" />
  {:else if row.name === 'showLabel'}
    <TextInput bind:value={pgShowLabel} ariaLabel="showLabel value" placeholder="Show secret" />
  {:else if row.name === 'hideLabel'}
    <TextInput bind:value={pgHideLabel} ariaLabel="hideLabel value" placeholder="Hide secret" />
  {:else if row.name === 'disabled'}
    <Checkbox
      checked={disabled ?? false}
      ariaLabel="disabled value"
      onChange={value => (pgDisabled = value ? 'yes' : 'no')} />
  {:else if row.name === 'required'}
    <Checkbox
      checked={required ?? false}
      ariaLabel="required value"
      onChange={value => (pgRequired = value ? 'yes' : 'no')} />
  {:else if row.name === 'className'}
    <TextInput bind:value={pgClassName} ariaLabel="className value" placeholder="(none)" />
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

<ShowcasePage name="PasswordInput" props={propsSnippet} actions={pageActions}>
  <ShowcaseSection title="PasswordInput" {code} {preview} showHeader={false} bordered={false} footer={settingsPanel}>
    <PasswordInput
      bind:value={pgValue}
      placeholder={pgPlaceholder || 'Password'}
      showLabel={pgShowLabel || undefined}
      hideLabel={pgHideLabel || undefined}
      {disabled}
      {required}
      className={pgClassName || undefined} />
    <span class="text-sm text-slate-400">length: {pgValue.length}</span>
  </ShowcaseSection>
</ShowcasePage>
